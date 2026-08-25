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
  /** Các phím đang được giữ, dùng để hiện phản hồi tức thời. */
  heldNotes: number[];
}

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

/**
 * Kết nối đàn qua Web MIDI.
 *
 * `onNoteOn` được giữ trong ref nên component gọi hook không cần bọc useCallback;
 * nếu gắn thẳng vào effect thì mỗi lần state đổi sẽ tháo ra gắn lại trình xử lý,
 * và những nốt bấm đúng lúc đó sẽ rơi mất.
 */
export function useMidiInput(onNoteOn?: (note: number, velocity: number) => void): UseMidiInputResult {
  const [status, setStatus] = useState<MidiStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);

  const accessRef = useRef<MIDIAccess | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
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
        onNoteOnRef.current?.(note, velocity);
      } else if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
        setHeldNotes((prev) => prev.filter((n) => n !== note));
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
    heldNotes,
  };
}
