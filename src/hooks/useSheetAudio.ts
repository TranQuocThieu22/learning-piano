'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import type { NoteTimingEvent } from 'abcjs';
import {
  loadSavedProgram, normalizeBufferVolume, saveProgram, synthOptions,
} from '@/lib/soundfont';
import type { SheetTune } from './useSheetRender';

/**
 * **Cửa TIẾNG của khung xem bản nhạc trong bài học.** Cửa còn lại là
 * `useSheetRender.ts` (phần vẽ). `EarTrainingDrill` cũng phát tiếng từ một đoạn
 * ABC nhưng bằng `CreateSynth` gọi thẳng — nó chỉ cần phát một câu ngắn, không
 * cần tua/lặp/đổi tốc độ, nên chưa gộp vào đây.
 *
 * Gói trọn bộ phát của abcjs: nạp bản nhạc, phát, tạm dừng, tua, lặp, đổi tốc
 * độ, đổi tiếng đàn, và **dừng hẳn khi rời trang**. Component chỉ thấy một nắm
 * trạng thái với vài hàm, không thấy `SynthController` ở đâu cả.
 *
 * Ba cái bẫy đã trả giá mới biết, đều nằm trong file này — sửa gì thì đừng phá:
 *
 * 1. **`pause()` không dừng được tiếng, phải `destroy()`.** Điều hướng trong
 *    Next.js không tải lại trang, nên bản nhạc đang phát kêu tiếp sang trang mới
 *    mà không còn nút nào tắt (bẫy 15, 18).
 * 2. **`setTune` phải truyền `userAction = true`.** Gọi với `false` chỉ ghi đè
 *    tuỳ chọn mà không nạp lại gì, nên sau lần phát đầu tiên thì đổi nhạc cụ
 *    không có tác dụng.
 * 3. **Mỗi lần abcjs dựng lại chuỗi âm thanh là phải kéo to lại âm lượng** —
 *    đổi bài, đổi tiếng đàn, đổi tốc độ — vì lần nào nó cũng tạo AudioBuffer mới
 *    ở mức gốc (bẫy 20).
 */

/**
 * Vá lại vài chỗ .d.ts của abcjs ghi thiếu hoặc ghi sai so với mã chạy thật:
 * - `seek` có trong SynthController nhưng thiếu khai báo.
 * - `getAudioBuffer` được khai báo trên SynthController nhưng thực tế chỉ
 *   CreateSynth mới có; SynthController giữ nó ở thuộc tính `midiBuffer`.
 * - `destroy` có thật trong `synth-controller.js` nhưng thiếu khai báo. Đây là
 *   thứ duy nhất dừng hẳn được tiếng: nó gọi `timer.stop()` và `midiBuffer.stop()`.
 */
type SynthControllerInternals = InstanceType<typeof ABCJS.synth.SynthController> & {
  seek?: (percent: number, units?: string) => void;
  midiBuffer?: { getAudioBuffer?: () => AudioBuffer | undefined };
  destroy?: () => void;
};

const PLAYBACK_CLASS = 'abcjs-highlight';

export interface SheetAudio {
  /** `false` khi trình duyệt không phát được tiếng — lúc đó đừng vẽ thanh điều khiển. */
  ready: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  /** Vị trí đang phát, 0..1. */
  progress: number;
  totalMs: number;
  /** Phần trăm tốc độ: 100 là đúng tốc độ ghi trong bản nhạc. */
  warp: number;
  bpm: number;
  /** Nhạc cụ đang chọn, đã nhớ sẵn từ buổi trước. */
  program: number;
  chooseProgram: (program: number) => void;
  playPause: () => void;
  restart: () => void;
  toggleLoop: () => void;
  seek: (progress: number) => void;
  changeWarp: (warp: number) => void;
}

export function useSheetAudio(
  audioRef: RefObject<HTMLDivElement | null>,
  tune: SheetTune | null,
  bpmAt: (warp: number) => number,
): SheetAudio {
  const synthRef = useRef<SynthControllerInternals | null>(null);
  /**
   * Những phần tử đang được tô sáng theo nốt đang phát.
   *
   * Nhớ lại chính mình thay vì dò `querySelectorAll` trong khung bản nhạc: hook
   * này không cần biết bản nhạc được vẽ ở đâu, nên cửa tiếng không dính gì tới
   * cửa vẽ. Lớp `abcjs-highlight` cũng do chính chỗ này gắn vào, không phải abcjs.
   */
  const litRef = useRef<HTMLElement[]>([]);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [warp, setWarp] = useState(100);
  const [bpm, setBpm] = useState(0);
  // Đọc localStorage ngay lúc khởi tạo state được, không lo lệch hydration: ô
  // chọn nhạc cụ chỉ hiện sau khi `ready` bật, nên `program` không hề nằm trong
  // cây render đầu tiên mà React đem so với HTML dựng từ server.
  const [program, setProgram] = useState(loadSavedProgram);

  /** Kéo to bản nhạc vừa dựng xong — xem bẫy 3 ở đầu file. */
  const boostVolume = useCallback(() => {
    const buffer = synthRef.current?.midiBuffer?.getAudioBuffer?.();
    if (buffer) normalizeBufferVolume(buffer);
  }, []);

  /**
   * Dựng bộ phát mỗi khi đổi bản nhạc, và **dẹp cái cũ trước khi dựng cái mới**.
   *
   * Chờ có `tune` rồi mới dựng, chứ không dựng sẵn lúc trang mở: dựng sẵn thì
   * ngay sau đó bản nhạc vẽ xong lại phải dẹp đi dựng lại, thừa một vòng.
   */
  useEffect(() => {
    if (!audioRef.current || !tune || !ABCJS.synth.supportsAudio()) return;

    const clearPlayback = () => {
      for (const el of litRef.current) el.classList?.remove(PLAYBACK_CLASS);
      litRef.current = [];
    };

    const synthControl = new ABCJS.synth.SynthController() as SynthControllerInternals;
    const cursorControl = {
      onStart: () => {
        clearPlayback();
        setIsPlaying(true);
      },
      onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {
        setProgress(totalBeats > 0 ? beatNumber / totalBeats : 0);
        setTotalMs(totalTime);
      },
      onEvent: (ev: NoteTimingEvent) => {
        clearPlayback();
        for (const group of ev.elements ?? []) {
          for (const el of group) {
            el.classList?.add(PLAYBACK_CLASS);
            litRef.current.push(el);
          }
        }
      },
      onFinished: () => {
        clearPlayback();
        setIsPlaying(false);
        setProgress(0);
      },
    };

    // Vẫn phải gọi load() để SynthController có chỗ gắn: nội bộ nó cập nhật các
    // nút bấm ở đây mỗi khi trạng thái đổi. Ta ẩn hẳn khối này đi và tự dựng lại
    // giao diện bằng Mantine ở SheetAudioControls cho đồng bộ theme. Riêng
    // displayWarp phải bật, vì `setWarp` ghi thẳng vào ô nhập tốc độ của abcjs
    // mà không kiểm tra tồn tại — thiếu nó là lỗi ngay khi đổi tốc độ.
    synthControl.load(audioRef.current, cursorControl, { displayWarp: true });

    // setTune tự dựng lấy chuỗi âm thanh của nó, nên không cần CreateSynth riêng
    // ở đây — tạo thêm chỉ khiến mẫu âm bị tải hai lần.
    synthRef.current = synthControl;
    setReady(true);

    return () => {
      // Xem bẫy 1 ở đầu file: `destroy()` mới gọi tới `midiBuffer.stop()`.
      synthControl.destroy?.();
      synthRef.current = null;
      litRef.current = [];
      setReady(false);
      setIsPlaying(false);
    };
  }, [audioRef, tune]);

  /**
   * Đổi bài thì mọi thứ về vạch xuất phát, kể cả tốc độ người học vừa chỉnh.
   *
   * Đặt lại **ngay trong lúc render**, không trong một effect: đây đúng là cách
   * React khuyên cho việc "prop đổi thì reset state". Làm trong effect thì có
   * một khung hình mang tốc độ và thanh tiến trình của bài cũ kịp lọt ra màn
   * hình, và quy tắc lint của repo cũng cấm gọi setState thẳng trong effect.
   */
  const [lastTune, setLastTune] = useState(tune);
  if (lastTune !== tune) {
    setLastTune(tune);
    setIsPlaying(false);
    setIsLooping(false);
    setProgress(0);
    setWarp(100);
    setBpm(bpmAt(100));
  }

  // Nạp lại tiếng đàn khi đổi bản nhạc hoặc khi người học chọn nhạc cụ khác.
  useEffect(() => {
    const synthControl = synthRef.current;
    if (!ready || !synthControl || !tune) return;

    // Xem bẫy 2 ở đầu file: phải là `true`, không phải `false`.
    synthControl.setTune(tune, true, synthOptions(program)).then(boostVolume).catch((err) => {
      console.warn('Audio problem:', err);
    });
  }, [ready, program, tune, boostVolume]);

  const playPause = useCallback(() => {
    const synthControl = synthRef.current;
    if (!synthControl) return;
    // play() tự lật giữa phát và dừng; onStart chỉ báo lúc bắt đầu nên khi tạm
    // dừng phải tự hạ cờ xuống. Lật ngay, không chờ promise, để nút phản hồi liền tay.
    synthControl.play();
    setIsPlaying((playing) => !playing);
  }, []);

  const restart = useCallback(() => {
    synthRef.current?.restart();
    setProgress(0);
  }, []);

  const toggleLoop = useCallback(() => {
    synthRef.current?.toggleLoop();
    setIsLooping((looping) => !looping);
  }, []);

  const seek = useCallback((next: number) => {
    synthRef.current?.seek?.(next);
    setProgress(next);
  }, []);

  const changeWarp = useCallback((next: number) => {
    setWarp(next);
    setBpm(bpmAt(next));
    // setWarp dựng lại buffer từ đầu (destroy rồi go), nên phải kéo to lại.
    synthRef.current?.setWarp(next)?.then(boostVolume);
  }, [bpmAt, boostVolume]);

  const chooseProgram = useCallback((next: number) => {
    setProgram(next);
    saveProgram(next);
  }, []);

  return {
    ready,
    isPlaying,
    isLooping,
    progress,
    totalMs,
    warp,
    bpm,
    program,
    chooseProgram,
    playPause,
    restart,
    toggleLoop,
    seek,
    changeWarp,
  };
}
