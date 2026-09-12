'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMidiInput } from '@/hooks/useMidiInput';
import { useBleMidiInput } from '@/hooks/useBleMidiInput';
import { useMicInput, type MicOptions } from '@/hooks/useMicInput';
import type { HeardEvent } from '@/lib/mic-listener';

/**
 * Hai cách để app nghe người học đánh đàn thật:
 *
 * - `mic` — nghe qua micro của điện thoại. Chạy trên MỌI máy, kể cả iPhone/iPad,
 *   và cả đàn cơ không có cổng cắm. Là cách mặc định, vì người học tập bằng điện
 *   thoại đặt trên giá nhạc (xem AGENTS.md).
 * - `midi` — nối dây USB MIDI. Chính xác tuyệt đối và nhanh hơn, nhưng chỉ chạy trên
 *   Android và máy tính. Đàn nối vào bằng dây (điện thoại cần cáp OTG) hoặc bằng Bluetooth
 *   — cả hai đều hiện ra qua cùng một API nên phần mã không phân biệt.
 */
export type PianoInputMode = 'mic' | 'midi';

export interface PianoInputHandlers {
  /** Một phím vừa xuống, báo từ đàn qua dây MIDI. */
  onMidiNote: (midi: number) => void;
  /** Một lần micro nghe thấy phím xuống — có thể nhiều nốt cùng lúc. `atMs` theo `performance.now()`. */
  onMicHeard: (event: HeardEvent, atMs: number) => void;
}

export function usePianoInput(handlers: PianoInputHandlers, micOptions: MicOptions = {}) {
  const [mode, setMode] = useState<PianoInputMode | null>(null);
  // Cập nhật ngay trong lúc bấm chứ không chờ render: nốt đầu tiên có thể tới
  // trước khi React kịp vẽ lại.
  const modeRef = useRef<PianoInputMode | null>(null);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // Quyền MIDI một khi đã cấp thì còn đó cả khi người học chuyển sang micro, nên
  // phải tự chặn: đang dùng micro thì bỏ qua mọi thứ đến từ dây.
  const midi = useMidiInput((note) => {
    if (modeRef.current === 'midi') handlersRef.current.onMidiNote(note);
  });
  const mic = useMicInput((event, atMs) => {
    if (modeRef.current === 'mic') handlersRef.current.onMicHeard(event, atMs);
  }, micOptions);

  /*
   * Đường thứ hai của chế độ MIDI: nối thẳng Bluetooth, không qua Web MIDI. Trên
   * Android đây là đường DUY NHẤT chạy được với đàn Bluetooth (bẫy 35). Nốt về
   * cùng một chỗ với nốt đi qua dây, nên phần bài tập không cần biết nốt tới bằng
   * đường nào.
   */
  const ble = useBleMidiInput((note) => {
    if (modeRef.current === 'midi') handlersRef.current.onMidiNote(note);
  });

  /**
   * Máy có nối dây MIDI được không. Đọc trong effect chứ không lúc render: máy chủ
   * không có `navigator`, đọc lúc render là HTML hai bên lệch nhau.
   */
  const [midiSupported, setMidiSupported] = useState(false);
  useEffect(() => {
    // Đọc khả năng của trình duyệt chỉ làm được sau khi đã lên máy người học.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMidiSupported(typeof navigator.requestMIDIAccess === 'function');
  }, []);

  const { connect: connectMic, disconnect: disconnectMic } = mic;
  const { connect: connectMidi } = midi;
  const { disconnect: disconnectBle } = ble;

  const chooseMic = useCallback(() => {
    modeRef.current = 'mic';
    setMode('mic');
    connectMic();
  }, [connectMic]);

  const chooseMidi = useCallback(() => {
    modeRef.current = 'midi';
    setMode('midi');
    disconnectMic();
    connectMidi();
  }, [connectMidi, disconnectMic]);

  /** Quay về màn hình chọn cách nối, tắt micro và ngắt Bluetooth nếu đang nối. */
  const reset = useCallback(() => {
    modeRef.current = null;
    setMode(null);
    disconnectMic();
    disconnectBle();
  }, [disconnectMic, disconnectBle]);

  /**
   * Đã sẵn sàng nghe chưa.
   *
   * Chế độ MIDI sẵn sàng khi **một trong hai** đường có đàn: Web MIDI thấy thiết
   * bị (dây, hoặc Bluetooth trên máy tính), hoặc đã nối thẳng Bluetooth.
   */
  const ready = mode === 'mic'
    ? mic.status === 'ready'
    : mode === 'midi' && (
      (midi.status === 'ready' && midi.devices.length > 0) || ble.status === 'connected'
    );

  return { mode, ready, midi, mic, ble, midiSupported, chooseMic, chooseMidi, reset };
}

export type PianoInput = ReturnType<typeof usePianoInput>;
