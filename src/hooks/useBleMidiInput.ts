'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BLE_MIDI_CHARACTERISTIC, BLE_MIDI_SERVICE, encodeBlePackets, parseBlePacket,
} from '@/lib/ble-midi';

/**
 * Nối thẳng tới đàn qua **Web Bluetooth**, không đi qua Web MIDI.
 *
 * **Vì sao cần đường riêng này.** Trên Android, đàn nối Bluetooth không hiện ra
 * qua `requestMIDIAccess` — đã thử tới cùng trên Roland FP-30X, kể cả khi app
 * của Roland báo *Connected* và trang đã xin lại quyền để điểm danh lại. Xem bẫy
 * 35 trong `bay-ky-thuat.md`. Đường này bỏ qua Web MIDI: trình duyệt tự nối
 * Bluetooth tới đàn rồi đọc byte, nên không phụ thuộc vào việc Android có chịu
 * liệt kê thiết bị MIDI hay không, và **không cần app của hãng đàn**.
 *
 * Ba điều của Web Bluetooth phải nhớ, sửa gì thì đừng phá:
 *
 * 1. **`requestDevice` chỉ gọi được từ một cú bấm của người dùng.** Gọi trong
 *    effect là trình duyệt từ chối thẳng. Vì vậy `connect` phải nằm trong
 *    `onClick`, không được tự chạy lúc mở trang.
 * 2. **Phải khai service trong `filters`** để hộp thoại chọn thiết bị chỉ hiện
 *    đàn, không hiện tai nghe và mọi thứ khác trong phòng.
 * 3. **Mất kết nối là chuyện bình thường** — đi ra xa, đàn tắt, máy ngủ. Nghe
 *    `gattserverdisconnected` để báo cho người học và cho họ nối lại, thay vì để
 *    app im lặng không nhận nốt nào nữa.
 */

/*
 * Kiểu của Web Bluetooth chưa có trong thư viện DOM của TypeScript. Khai đúng
 * phần đang dùng, không kéo thêm dependency chỉ để lấy mấy dòng khai báo.
 */
interface BleCharacteristic extends EventTarget {
  startNotifications: () => Promise<BleCharacteristic>;
  stopNotifications: () => Promise<BleCharacteristic>;
  writeValue: (value: BufferSource) => Promise<void>;
  /** Chuẩn BLE-MIDI dùng kiểu ghi này; trình duyệt cũ chưa có thì lùi về `writeValue`. */
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  value?: DataView;
}
interface BleService {
  getCharacteristic: (uuid: string) => Promise<BleCharacteristic>;
}
interface BleGatt {
  connected: boolean;
  connect: () => Promise<BleGatt>;
  disconnect: () => void;
  getPrimaryService: (uuid: string) => Promise<BleService>;
}
interface BleDevice extends EventTarget {
  name?: string;
  gatt?: BleGatt;
}
interface BluetoothLike {
  requestDevice: (options: {
    filters?: { services: string[] }[];
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }) => Promise<BleDevice>;
  getAvailability?: () => Promise<boolean>;
}

function bluetooth(): BluetoothLike | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth ?? null;
}

export type BleMidiStatus = 'idle' | 'connecting' | 'connected' | 'denied' | 'lost';

export interface UseBleMidiResult {
  /** Trình duyệt này có Web Bluetooth không. `false` trên iPhone và iPad. */
  supported: boolean;
  status: BleMidiStatus;
  /** Tên đàn đang nối, để người học biết chắc mình nối đúng cây. */
  deviceName: string | null;
  errorMessage: string | null;
  /** **Chỉ gọi từ một cú bấm của người dùng.** */
  connect: () => void;
  disconnect: () => void;
  /** Các phím đang được giữ, dùng để hiện phản hồi tức thời. */
  heldNotes: number[];
  /** Gửi lệnh sang đàn. `false` khi chưa nối hoặc đàn không nhận ghi. */
  send: (messages: number[][]) => Promise<boolean>;
}

export interface BleMidiHandlers {
  onNoteOn?: (midi: number, velocity: number) => void;
  /** Phím vừa nhả — bộ phát tiếng cần nó để tắt nốt. */
  onNoteOff?: (midi: number) => void;
  /** Pedal ngân (CC64) vừa đạp hoặc vừa nhả. */
  onPedal?: (down: boolean) => void;
}

export function useBleMidiInput(handlers: BleMidiHandlers = {}): UseBleMidiResult {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<BleMidiStatus>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);

  const deviceRef = useRef<BleDevice | null>(null);
  const charRef = useRef<BleCharacteristic | null>(null);
  /**
   * Lần ghi cuối cùng đang chạy. Ngắt kết nối phải **đợi nó xong**: lệnh bật lại loa đàn
   * được gửi ngay trước khi ngắt, và cắt Bluetooth giữa lúc đang ghi là lệnh rơi mất —
   * đàn câm luôn cho tới khi tắt nguồn. Không bao giờ ở trạng thái lỗi (đã bắt ở `send`).
   */
  const pendingWriteRef = useRef<Promise<unknown>>(Promise.resolve());
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  /*
   * Đọc khả năng của trình duyệt trong effect chứ không lúc render: máy chủ không
   * có `navigator`, đọc lúc render là HTML hai bên lệch nhau.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(bluetooth() !== null);
  }, []);

  const send = useCallback((messages: number[][]) => {
    const char = charRef.current;
    if (!char) return Promise.resolve(false);
    // Xếp hàng sau lần ghi trước: Web Bluetooth từ chối hai lần ghi chồng nhau trên cùng một characteristic.
    const write = pendingWriteRef.current.then(async () => {
      for (const packet of encodeBlePackets(messages)) {
        if (char.writeValueWithoutResponse) await char.writeValueWithoutResponse(packet);
        else await char.writeValue(packet);
      }
      return true;
    }).catch(() => false);
    pendingWriteRef.current = write;
    return write;
  }, []);

  const disconnect = useCallback(() => {
    const char = charRef.current;
    const device = deviceRef.current;
    charRef.current = null;
    deviceRef.current = null;
    setStatus('idle');
    setDeviceName(null);
    setHeldNotes([]);
    void pendingWriteRef.current.then(() => {
      void char?.stopNotifications().catch(() => {
        // Đàn đã đi xa rồi thì dừng cũng chẳng có gì để dừng.
      });
      device?.gatt?.disconnect();
    });
  }, []);

  const connect = useCallback(() => {
    const ble = bluetooth();
    if (!ble) return;

    setStatus('connecting');
    setErrorMessage(null);

    void (async () => {
      try {
        const device = await ble.requestDevice({
          /*
           * **Hiện MỌI thiết bị quanh đó, không lọc theo service MIDI.**
           *
           * Bản đầu lọc `filters: [{ services: [BLE_MIDI_SERVICE] }]` và hộp
           * thoại trống trơn: rất nhiều đàn BLE MIDI **không quảng bá** UUID
           * service trong gói phát sóng, chúng chỉ để lộ service sau khi đã nối.
           * Lọc theo thứ đàn không nói ra thì đàn không bao giờ hiện.
           *
           * Đổi lại danh sách có cả tai nghe và mấy thứ khác trong phòng, nên
           * người học phải tự chọn đúng tên đàn. Danh sách hơi rối vẫn hơn danh
           * sách rỗng. `optionalServices` là bắt buộc: thiếu nó thì nối được
           * nhưng `getPrimaryService` bị chặn.
           */
          acceptAllDevices: true,
          optionalServices: [BLE_MIDI_SERVICE],
        });
        const gatt = await device.gatt?.connect();
        if (!gatt) throw new Error('Đàn không cho nối');
        const service = await gatt.getPrimaryService(BLE_MIDI_SERVICE);
        const char = await service.getCharacteristic(BLE_MIDI_CHARACTERISTIC);

        char.addEventListener('characteristicvaluechanged', (event) => {
          const value = (event.target as BleCharacteristic).value;
          if (!value) return;
          const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
          for (const event of parseBlePacket(bytes)) {
            if (event.kind === 'pedal') {
              handlersRef.current.onPedal?.(event.down);
            } else if (event.kind === 'down') {
              handlersRef.current.onNoteOn?.(event.midi, event.velocity);
              setHeldNotes((giu) => (giu.includes(event.midi) ? giu : [...giu, event.midi]));
            } else {
              handlersRef.current.onNoteOff?.(event.midi);
              setHeldNotes((giu) => giu.filter((m) => m !== event.midi));
            }
          }
        });
        await char.startNotifications();

        device.addEventListener('gattserverdisconnected', () => {
          charRef.current = null;
          setStatus('lost');
          setHeldNotes([]);
        });

        deviceRef.current = device;
        charRef.current = char;
        setDeviceName(device.name ?? 'Đàn Bluetooth');
        setStatus('connected');
      } catch (err: unknown) {
        /*
         * Người học bấm Huỷ ở hộp thoại chọn thiết bị cũng vào đây. Đó không
         * phải lỗi, nên về lại trạng thái ban đầu chứ không báo đỏ.
         *
         * Hộp thoại nay hiện mọi thiết bị, nên chọn nhầm tai nghe là chuyện sẽ
         * xảy ra. Lúc đó `getPrimaryService` không tìm thấy service MIDI — dịch
         * thành câu người học hiểu được, thay vì để nguyên thông báo tiếng Anh
         * của trình duyệt.
         */
        const message = err instanceof Error ? err.message : String(err);
        const daHuy = err instanceof Error && err.name === 'NotFoundError'
          && /user|cancel/i.test(message);
        const khongPhaiDan = /service/i.test(message) || err instanceof Error
          && err.name === 'NotFoundError' && /service/i.test(message);
        setStatus(daHuy ? 'idle' : 'denied');
        setErrorMessage(
          daHuy ? null
            : khongPhaiDan
              ? 'Thiết bị vừa chọn không phải đàn MIDI, hoặc đàn chưa bật Bluetooth MIDI. Chọn lại đúng tên đàn.'
              : message,
        );
      }
    })();
  }, []);

  /*
   * Rời trang thì ngắt hẳn: đàn vẫn giữ kết nối với trang cũ thì lần sau nối lại không được.
   *
   * Ngắt **sau một nhịp microtask** chứ không ngay: component gọi hook này dọn dẹp SAU
   * hook (React dọn theo thứ tự khai báo), và đó là lúc nó gửi lệnh bật lại loa đàn.
   * Ngắt ngay thì lệnh ấy tới khi Bluetooth đã đứt. Đợi một nhịp để lệnh kịp xếp hàng,
   * rồi đợi nó ghi xong.
   */
  useEffect(() => () => {
    void Promise.resolve()
      .then(() => pendingWriteRef.current)
      .then(() => deviceRef.current?.gatt?.disconnect());
  }, []);

  return { supported, status, deviceName, errorMessage, connect, disconnect, heldNotes, send };
}
