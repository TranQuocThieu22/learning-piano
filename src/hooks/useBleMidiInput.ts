'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BLE_MIDI_CHARACTERISTIC, BLE_MIDI_SERVICE, parseBlePacket,
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
}

export function useBleMidiInput(onNoteOn?: (midi: number, velocity: number) => void): UseBleMidiResult {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<BleMidiStatus>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);

  const deviceRef = useRef<BleDevice | null>(null);
  const charRef = useRef<BleCharacteristic | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
  });

  /*
   * Đọc khả năng của trình duyệt trong effect chứ không lúc render: máy chủ không
   * có `navigator`, đọc lúc render là HTML hai bên lệch nhau.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(bluetooth() !== null);
  }, []);

  const disconnect = useCallback(() => {
    const char = charRef.current;
    charRef.current = null;
    void char?.stopNotifications().catch(() => {
      // Đàn đã đi xa rồi thì dừng cũng chẳng có gì để dừng.
    });
    deviceRef.current?.gatt?.disconnect();
    deviceRef.current = null;
    setStatus('idle');
    setDeviceName(null);
    setHeldNotes([]);
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
          for (const note of parseBlePacket(bytes)) {
            if (note.kind === 'down') {
              onNoteOnRef.current?.(note.midi, note.velocity);
              setHeldNotes((giu) => (giu.includes(note.midi) ? giu : [...giu, note.midi]));
            } else {
              setHeldNotes((giu) => giu.filter((m) => m !== note.midi));
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

  // Rời trang thì ngắt hẳn: đàn vẫn giữ kết nối với trang cũ thì lần sau nối lại không được.
  useEffect(() => () => {
    deviceRef.current?.gatt?.disconnect();
  }, []);

  return { supported, status, deviceName, errorMessage, connect, disconnect, heldNotes };
}
