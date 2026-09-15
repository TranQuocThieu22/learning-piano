'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MidiStatus =
  /** Chưa bấm nút kết nối lần nào. */
  | 'idle'
  /** Đang chờ trình duyệt trả quyền. */
  | 'connecting'
  /** Trình duyệt này không có Web MIDI (Safari, phần lớn trình duyệt trên iPhone/iPad). */
  | 'unsupported'
  /** Người dùng từ chối quyền, hoặc trang không chạy trên HTTPS. */
  | 'denied'
  /** Đã kết nối được, kể cả khi chưa có đàn nào cắm vào. */
  | 'ready';

export interface MidiDevice {
  id: string;
  name: string;
}

export interface UseMidiInputResult {
  status: MidiStatus;
  errorMessage: string | null;
  devices: MidiDevice[];
  selectedDeviceId: string | null;
  selectDevice: (id: string) => void;
  connect: () => void;
  /**
   * Dò lại danh sách đàn.
   *
   * Cắm dây thì `onstatechange` tự báo, nhưng **nối Bluetooth thì không chắc**:
   * người học thường ghép đôi đàn ở phần Cài đặt của máy trong lúc trang đang mở,
   * và đường báo đó có thể tới muộn hoặc không tới. Một cái nút bấm được luôn rẻ
   * hơn là bảo người ta tải lại trang.
   */
  refresh: () => void;
  /** Các phím đang được giữ, dùng để hiện phản hồi tức thời. */
  heldNotes: number[];
}

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CONTROL_CHANGE = 0xb0;
/** Số hiệu pedal ngân theo chuẩn MIDI, và mốc coi là đã đạp. */
const SUSTAIN_PEDAL = 64;
const PEDAL_DOWN_FROM = 64;

export interface MidiHandlers {
  onNoteOn?: (note: number, velocity: number) => void;
  /**
   * Một phím vừa nhả. Bài tập chỉ quan tâm lúc phím xuống, nhưng bộ phát tiếng
   * (`live-piano.ts`) cần cả lúc nhả — không có thì nốt nào cũng ngân mãi.
   */
  onNoteOff?: (note: number) => void;
  /** Pedal ngân (CC64) vừa đạp hoặc vừa nhả. */
  onPedal?: (down: boolean) => void;
}

/**
 * Kết nối đàn qua Web MIDI.
 *
 * Trình xử lý được giữ trong ref nên component gọi hook không cần bọc useCallback;
 * nếu gắn thẳng vào effect thì mỗi lần state đổi sẽ tháo ra gắn lại trình xử lý,
 * và những nốt bấm đúng lúc đó sẽ rơi mất.
 */
export function useMidiInput(handlers: MidiHandlers = {}): UseMidiInputResult {
  const [status, setStatus] = useState<MidiStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);

  const accessRef = useRef<MIDIAccess | null>(null);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const list: MidiDevice[] = [];
    access.inputs.forEach((input) => {
      list.push({ id: input.id, name: input.name || 'Thiết bị không tên' });
    });
    setDevices(list);
    setSelectedDeviceId((current) => {
      if (current && list.some((d) => d.id === current)) return current;
      return list[0]?.id ?? null;
    });
  }, []);

  const connect = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      setStatus('unsupported');
      return;
    }
    setStatus('connecting');
    setErrorMessage(null);
    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        accessRef.current = access;
        access.onstatechange = () => refreshDevices(access);
        refreshDevices(access);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        setStatus('denied');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      });
  }, [refreshDevices]);

  /**
   * Xin lại quyền MIDI để **liệt kê lại từ đầu**, chứ không chỉ đọc lại danh sách cũ.
   *
   * Vì sao phải xin lại: bản đầu chỉ đọc lại `access.inputs` của lần xin trước, và
   * gặp đúng cảnh không ra gì — đàn Bluetooth đã nối xong qua app của hãng mà trang
   * vẫn trống. Theo chuẩn thì `inputs` là danh sách sống và `onstatechange` phải
   * báo, nhưng trên Android thực tế không phải vậy. Gọi lại `requestMIDIAccess` thì
   * trình duyệt dựng lại danh sách; quyền đã cấp rồi nên không hỏi lại người học.
   */
  const refresh = connect;

  // Chỉ lắng nghe đúng thiết bị đang chọn, và luôn gỡ trình xử lý cũ trước.
  useEffect(() => {
    const access = accessRef.current;
    if (!access || !selectedDeviceId) return;

    let input: MIDIInput | undefined;
    access.inputs.forEach((candidate) => {
      if (candidate.id === selectedDeviceId) input = candidate;
    });
    if (!input) return;

    const handler = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 3) return;
      const command = data[0] & 0xf0;
      const note = data[1];
      const velocity = data[2];

      // Nhiều đàn báo nhả phím bằng "note on, lực = 0" thay vì note off.
      if (command === NOTE_ON && velocity > 0) {
        setHeldNotes((prev) => (prev.includes(note) ? prev : [...prev, note]));
        handlersRef.current.onNoteOn?.(note, velocity);
      } else if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
        setHeldNotes((prev) => prev.filter((n) => n !== note));
        handlersRef.current.onNoteOff?.(note);
      } else if (command === CONTROL_CHANGE && note === SUSTAIN_PEDAL) {
        // Với lệnh điều khiển thì byte thứ hai là số hiệu nút, byte thứ ba là mức.
        handlersRef.current.onPedal?.(velocity >= PEDAL_DOWN_FROM);
      }
    };

    input.addEventListener('midimessage', handler as EventListener);
    return () => {
      input?.removeEventListener('midimessage', handler as EventListener);
      setHeldNotes([]);
    };
  }, [selectedDeviceId, devices]);

  useEffect(() => {
    return () => {
      if (accessRef.current) accessRef.current.onstatechange = null;
    };
  }, []);

  return {
    status,
    errorMessage,
    devices,
    selectedDeviceId,
    selectDevice: setSelectedDeviceId,
    connect,
    refresh,
    heldNotes,
  };
}
