'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MicNoteListener, type HeardEvent } from '@/lib/mic-listener';
import { holdAmbient } from '@/lib/ambient-hold';

export type MicStatus =
  /** Chưa bấm nút bật micro lần nào (hoặc đã tắt). */
  | 'idle'
  /** Đang chờ người học cho phép dùng micro. */
  | 'connecting'
  /** Trình duyệt này không cho web dùng micro. */
  | 'unsupported'
  /** Trang không chạy trên https — trình duyệt chặn micro. Hay gặp khi mở bằng địa chỉ mạng nội bộ lúc thử. */
  | 'insecure'
  /** Người học bấm "Chặn", hoặc đã chặn từ trước trong cài đặt trình duyệt. */
  | 'denied'
  /** Máy không có micro, hoặc micro đang bị ứng dụng khác chiếm. */
  | 'no-mic'
  | 'error'
  | 'ready';

export interface MicOptions {
  /** Những phím bản nhạc đang chờ — xem `DetectOptions.hint` trong mic-pitch.ts. */
  hint?: readonly number[];
  /** Nhiều nhất bao nhiêu nốt một lần đánh. */
  maxNotes?: number;
  /** Chỉ xét phím trong khoảng này. */
  range?: readonly [number, number];
  /**
   * Tạm bỏ qua mọi thứ nghe được — trong lúc app tự phát tiếng (nghe mẫu), micro
   * sẽ nghe thấy chính cái loa của máy và tưởng người học đang đánh.
   */
  paused?: boolean;
}

export interface UseMicInputResult {
  status: MicStatus;
  errorMessage: string | null;
  /** Mức âm lượng micro đang thu, 0..1, cập nhật khoảng 10 lần mỗi giây. */
  level: number;
  /** Những phím nghe được ở lần gần nhất, để người học biết micro đang "hiểu" gì. */
  lastHeard: number[] | null;
  connect: () => void;
  disconnect: () => void;
}

/** Sau khi app thôi phát tiếng, còn bỏ qua thêm chừng này — tiếng vang của loa chưa tắt hẳn. */
const RESUME_GRACE_MS = 500;

/**
 * Bật micro và nghe tiếng đàn thật của người học.
 *
 * Âm thanh chỉ đi từ micro vào bộ nhận nốt ngay trên máy (`mic-listener.ts`):
 * không ghi lại, không lưu, không gửi đi đâu. Điều này có ghi cho người học ngay
 * chỗ bấm bật micro — thấy trình duyệt hỏi quyền micro là người ta lo, và họ có
 * quyền được biết.
 *
 * `onHeard` được giữ trong ref, như `useMidiInput`: chỗ gọi không cần bọc
 * useCallback, và đổi hàm giữa chừng không làm rơi lần nghe nào.
 */
export function useMicInput(
  onHeard: (event: HeardEvent, atMs: number) => void,
  options: MicOptions = {},
): UseMicInputResult {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [lastHeard, setLastHeard] = useState<number[] | null>(null);

  const onHeardRef = useRef(onHeard);
  useEffect(() => {
    onHeardRef.current = onHeard;
  });

  const listenerRef = useRef<MicNoteListener | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false);
  const ignoreUntilRef = useRef(0);

  // Đẩy cài đặt mới vào bộ nghe mỗi lần đổi, không phải dựng lại micro.
  const hintKey = (options.hint ?? []).join(',');
  const rangeKey = options.range ? options.range.join(',') : '';
  useEffect(() => {
    const listener = listenerRef.current;
    if (!listener) return;
    listener.hint = options.hint ?? [];
    listener.maxNotes = options.maxNotes ?? 4;
    listener.range = options.range;
    // hintKey/rangeKey đại diện cho nội dung của hint/range: mảng mới mỗi lần
    // render nhưng nội dung y hệt thì không cần chạy lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintKey, rangeKey, options.maxNotes, status]);

  useEffect(() => {
    const paused = Boolean(options.paused);
    if (pausedRef.current && !paused) ignoreUntilRef.current = performance.now() + RESUME_GRACE_MS;
    pausedRef.current = paused;
  }, [options.paused]);

  const disconnect = useCallback(() => {
    teardownRef.current?.();
    teardownRef.current = null;
    listenerRef.current = null;
    setStatus('idle');
    setLevel(0);
    setLastHeard(null);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !Ctor) {
      setStatus('unsupported');
      return;
    }

    teardownRef.current?.();
    setStatus('connecting');
    setErrorMessage(null);

    // Tạo và đánh thức AudioContext NGAY trong lúc bấm nút, trước khi chờ người
    // học cho phép micro: Safari trên iPhone chỉ cho phát/thu âm thanh khi được
    // khởi động trực tiếp từ một cú chạm. Chờ hộp thoại xin quyền xong mới tạo thì
    // cú chạm đó đã "hết hạn", và AudioContext nằm im ở trạng thái tạm dừng.
    const ctx = new Ctor();
    void ctx.resume();

    let stream: MediaStream | null = null;
    let stopped = false;
    const nodes: AudioNode[] = [];
    let meterTimer = 0;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && ctx.state !== 'running') void ctx.resume();
    };

    const teardown = () => {
      stopped = true;
      window.clearInterval(meterTimer);
      document.removeEventListener('visibilitychange', onVisible);
      for (const node of nodes) {
        try { node.disconnect(); } catch { /* đã gỡ rồi */ }
      }
      // Tắt hẳn micro — thiếu bước này thì chấm đỏ "đang dùng micro" của điện thoại
      // cứ sáng mãi sau khi người học đã rời trang.
      stream?.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
    };
    teardownRef.current = teardown;

    const feed = (chunk: Float32Array) => listenerRef.current?.push(chunk);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            // Ba bộ lọc dành cho cuộc gọi, đều phá tiếng đàn: lọc ồn coi nốt ngân dài
            // là tiếng ồn đều đều và cắt dần đi; tự chỉnh âm lượng làm nốt nhẹ to bằng
            // nốt mạnh; khử vọng thì cắt mất phần tiếng trùng với loa.
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        await ctx.resume();

        const listener = new MicNoteListener(ctx.sampleRate, (event) => {
          if (pausedRef.current || performance.now() < ignoreUntilRef.current) return;
          setLastHeard(event.notes.map((n) => n.midi));
          onHeardRef.current(event, performance.now() - event.ageMs);
        });
        listener.hint = options.hint ?? [];
        listener.maxNotes = options.maxNotes ?? 4;
        listener.range = options.range;
        listenerRef.current = listener;

        const source = ctx.createMediaStreamSource(stream);
        // Nối vào loa qua một nút âm lượng 0: trình duyệt chỉ chạy những nút có
        // đường ra loa, nhưng người học không được nghe lại chính micro của mình.
        const sink = ctx.createGain();
        sink.gain.value = 0;
        sink.connect(ctx.destination);
        nodes.push(source, sink);

        if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
          await ctx.audioWorklet.addModule('/audio/mic-capture-worklet.js');
          if (stopped) return;
          const node = new AudioWorkletNode(ctx, 'pj-mic-capture');
          node.port.onmessage = (e: MessageEvent<Float32Array>) => feed(e.data);
          source.connect(node);
          node.connect(sink);
          nodes.push(node);
        } else {
          // Trình duyệt cũ chưa có AudioWorklet (iPhone trước iOS 14.5).
          // ScriptProcessor đã bị đánh dấu lỗi thời nhưng vẫn chạy khắp nơi.
          const node = ctx.createScriptProcessor(1024, 1, 1);
          node.onaudioprocess = (e) => feed(new Float32Array(e.inputBuffer.getChannelData(0)));
          source.connect(node);
          node.connect(sink);
          nodes.push(node);
        }

        meterTimer = window.setInterval(() => {
          const rms = listenerRef.current?.getLevel() ?? 0;
          // Đổi sang thang dB rồi trải -60..-12 dB ra 0..1: đo tuyến tính thì nốt
          // nhẹ chỉ nhúc nhích một vạch, người học tưởng micro không nghe thấy gì.
          const db = 20 * Math.log10(Math.max(rms, 1e-6));
          setLevel(Math.min(1, Math.max(0, (db + 60) / 48)));
        }, 100);
        document.addEventListener('visibilitychange', onVisible);
        setStatus('ready');
      } catch (err) {
        teardown();
        if (teardownRef.current === teardown) teardownRef.current = null;
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
        else if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError') setStatus('no-mic');
        else {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    // options đọc ở thời điểm bấm nút; về sau effect phía trên lo cập nhật.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rời trang thì tắt micro.
  useEffect(() => () => {
    teardownRef.current?.();
    teardownRef.current = null;
  }, []);

  // Micro đang nghe thì nhạc nền phải im — không thì micro nghe luôn nhạc nền.
  useEffect(() => {
    if (status !== 'ready') return;
    return holdAmbient();
  }, [status]);

  return { status, errorMessage, level, lastHeard, connect, disconnect };
}
