'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LivePiano, softClipCurve } from '@/lib/live-piano';
import {
  DEFAULT_INSTRUMENT, findInstrument, LIVE_REFERENCE_MIDI, liveSampleGain, loadSavedInstrument,
  sampleUrl, saveInstrument, shapeSample, type Instrument,
} from '@/lib/soundfont';

/**
 * Nối `LivePiano` với trình duyệt: dựng `AudioContext`, tải và giải mã mẫu âm, nhớ tiếng
 * đàn đã chọn, và ước độ trễ để người học biết máy mình có hợp không.
 */

/**
 * Tải trước đúng tầm nốt cả giáo trình dùng: Đô2 tới Đô6.
 *
 * Con số đo được, không đoán — quét toàn bộ bản nhạc trong `docs/` ra đúng tầm đó (xem
 * dòng quyết định về phần cứng ở `nhat-ky-quyet-dinh.md`). Khoảng 1MB cho Grand Piano.
 * Nốt ngoài tầm vẫn kêu ngay nhờ mượn mẫu âm nốt gần nhất, và tự tải khi được bấm.
 */
const PRELOAD_LOWEST = 36;
const PRELOAD_HIGHEST = 84;
const MIDDLE_C = 60;

/**
 * Tải từ Đô giữa toả ra hai phía: vùng quanh Đô giữa là chỗ người học bấm đầu tiên, nên
 * nó phải có tiếng trước khi cả tầm tải xong.
 */
const PRELOAD_ORDER = Array.from(
  { length: PRELOAD_HIGHEST - PRELOAD_LOWEST + 1 },
  (_, i) => PRELOAD_LOWEST + i,
).sort((a, b) => Math.abs(a - MIDDLE_C) - Math.abs(b - MIDDLE_C));

/** Âm lượng mặc định: chừa chỗ để vặn to thêm khi đánh nhẹ hoặc phòng ồn. */
const DEFAULT_VOLUME = 0.8;

/**
 * Bộ chặn đỉnh đón được tín hiệu tới ±4 trước khi dính mép cắt cứng — mười nốt cùng mạnh
 * hết cỡ cộng pedal vẫn nằm trong đó. 4097 điểm: số lẻ để có một điểm đúng ở 0, và mỗi bước
 * 0,002 nên đoạn thẳng dưới mức gối đi qua không sai lệch.
 */
const SOFT_CLIP_RANGE = 4;
const SOFT_CLIP_POINTS = 4097;

export function useLivePiano() {
  // Đọc tiếng đã lưu trong effect, không lúc khởi tạo: ô chọn hiện ngay trong lần render
  // đầu, mà máy chủ không có localStorage — đọc sớm là HTML hai bên lệch nhau.
  const [instrument, setInstrument] = useState<Instrument>(DEFAULT_INSTRUMENT);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstrument(loadSavedInstrument());
  }, []);

  const [started, setStarted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [loaded, setLoaded] = useState(0);
  const [pedalDown, setPedalDown] = useState(false);
  /** Độ trễ trình duyệt tự báo, tính bằng ms. `null` là trình duyệt không báo. */
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const outputRef = useRef<AudioNode | null>(null);
  const pianoRef = useRef<LivePiano | null>(null);
  const volumeRef = useRef(DEFAULT_VOLUME);

  /**
   * **Phải gọi trong một cú bấm của người dùng.** Trình duyệt trên điện thoại chặn âm
   * thanh cho tới cú chạm đầu tiên, mà nốt gửi về từ dây MIDI không tính là cú chạm —
   * dựng `AudioContext` lúc nốt đầu tới là nó nằm im ở trạng thái tạm dừng.
   */
  const start = useCallback(() => {
    if (!ctxRef.current) {
      // 'interactive' xin trình duyệt bộ đệm nhỏ nhất nó chịu được: đây là chỗ độ trễ
      // quan trọng hơn mọi thứ khác.
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      /*
       * Bộ chặn đỉnh đứng cuối để bấm hợp âm nhiều nốt không vỡ tiếng. KHÔNG dùng
       * `DynamicsCompressorNode`: nó giữ tiếng lại 6ms để nhìn trước — xem `softClip`.
       * `oversample: 'none'` là bắt buộc, lấy mẫu dư cũng thêm trễ.
       */
      const headroom = ctx.createGain();
      headroom.gain.value = 1 / SOFT_CLIP_RANGE;
      const shaper = ctx.createWaveShaper();
      shaper.curve = softClipCurve(SOFT_CLIP_POINTS, SOFT_CLIP_RANGE);
      shaper.oversample = 'none';
      headroom.connect(shaper);
      shaper.connect(ctx.destination);
      ctxRef.current = ctx;
      outputRef.current = headroom;
    }
    void ctxRef.current.resume();
    setStarted(true);
  }, []);

  // Dựng lại bộ phát mỗi lần đổi tiếng đàn: mẫu âm của mỗi tiếng đã nắn khác nhau.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!started || !ctx) return;

    const decode = async (midi: number) => {
      const response = await fetch(sampleUrl(instrument, midi));
      if (!response.ok) return null;
      return ctx.decodeAudioData(await response.arrayBuffer());
    };

    // Đo hệ số âm lượng một lần cho cả bộ nốt, từ nốt mốc đã nắn tiếng — mọi nốt đợi số này
    // rồi mới nhân, để nốt nào tải trước cũng không to nhỏ lệch nhau.
    let gainJob: Promise<number> | null = null;
    const bundleGain = () => {
      gainJob ??= decode(LIVE_REFERENCE_MIDI).then((reference) => {
        if (!reference) return 1;
        shapeSample(reference, instrument, 1);
        return liveSampleGain(reference);
      });
      return gainJob;
    };

    const piano = new LivePiano(ctx, {
      output: outputRef.current ?? undefined,
      loadSample: async (midi) => {
        const [gain, buffer] = await Promise.all([bundleGain(), decode(midi)]);
        if (!buffer) return null;
        shapeSample(buffer, instrument, gain);
        return buffer;
      },
    });
    piano.setVolume(volumeRef.current);
    pianoRef.current = piano;
    setLoaded(0);
    void piano.preload(PRELOAD_ORDER, (done) => {
      if (pianoRef.current === piano) setLoaded(done);
    });

    return () => {
      piano.dispose();
      if (pianoRef.current === piano) pianoRef.current = null;
    };
  }, [started, instrument]);

  // Trình duyệt chỉ biết độ trễ thật sau khi âm thanh đã chạy, và số đó đổi khi cắm tai
  // nghe hay nối loa Bluetooth — nên đọc lại đều đặn chứ không đọc một lần.
  useEffect(() => {
    if (!started) return;
    const read = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const output = (ctx as AudioContext & { outputLatency?: number }).outputLatency;
      if (typeof output !== 'number' && typeof ctx.baseLatency !== 'number') {
        setLatencyMs(null);
        return;
      }
      setLatencyMs(Math.round(((ctx.baseLatency ?? 0) + (output ?? 0)) * 1000));
    };
    read();
    const timer = setInterval(read, 2000);
    return () => clearInterval(timer);
  }, [started]);

  // Rời trang thì đóng hẳn âm thanh — điều hướng Next.js không tải lại trang (bẫy 15).
  useEffect(() => {
    return () => {
      pianoRef.current?.dispose();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  const noteOn = useCallback((midi: number, velocity: number) => {
    pianoRef.current?.noteOn(midi, velocity);
  }, []);

  const noteOff = useCallback((midi: number) => {
    pianoRef.current?.noteOff(midi);
  }, []);

  const pedal = useCallback((down: boolean) => {
    pianoRef.current?.setPedal(down);
    setPedalDown(down);
  }, []);

  const setVolume = useCallback((value: number) => {
    volumeRef.current = value;
    setVolumeState(value);
    pianoRef.current?.setVolume(value);
  }, []);

  const chooseInstrument = useCallback((id: string) => {
    setInstrument(findInstrument(id));
    saveInstrument(id);
  }, []);

  return {
    start,
    started,
    instrument,
    chooseInstrument,
    volume,
    setVolume,
    loaded,
    loadTotal: PRELOAD_ORDER.length,
    pedalDown,
    latencyMs,
    noteOn,
    noteOff,
    pedal,
  };
}
