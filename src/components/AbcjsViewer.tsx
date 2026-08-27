'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import type { NoteTimingEvent, TuneObject } from 'abcjs';
import { Button, Group, Select } from '@mantine/core';
import { IconDeviceGamepad2 } from '@tabler/icons-react';
import { ScorePractice } from './ScorePractice';
import { SheetAudioControls } from './SheetAudioControls';
import type { EventResult, ScoreEvent } from '@/lib/score-compare';
import {
  INSTRUMENTS,
  loadSavedProgram,
  normalizeBufferVolume,
  saveProgram,
  synthOptions,
} from '@/lib/soundfont';

/** abcjs gắn noteTimings lên tune sau khi gọi setTiming, nhưng chưa khai báo trong .d.ts. */
type TuneWithTimings = TuneObject & { noteTimings?: NoteTimingEvent[] };

/**
 * Vá lại vài chỗ .d.ts của abcjs ghi thiếu hoặc ghi sai so với mã chạy thật:
 * - `seek` có trong SynthController nhưng thiếu khai báo.
 * - `getAudioBuffer` được khai báo trên SynthController nhưng thực tế chỉ
 *   CreateSynth mới có; SynthController giữ nó ở thuộc tính `midiBuffer`.
 */
type SynthControllerInternals = InstanceType<typeof ABCJS.synth.SynthController> & {
  seek?: (percent: number, units?: string) => void;
  midiBuffer?: { getAudioBuffer?: () => AudioBuffer | undefined };
};

/** Nhịp mỗi phút ở tốc độ `warp`, tính lại đúng như abcjs làm trong `SynthController.go`. */
function bpmAtWarp(tune: TuneObject, warp: number) {
  const msPerMeasure = (tune.millisecondsPerMeasure() * 100) / warp;
  return Math.round((tune.getBeatsPerMeasure() / msPerMeasure) * 60000);
}

interface ExtractedScore {
  events: ScoreEvent[];
  /** Phần tử SVG của từng sự kiện, cùng thứ tự với events, để tô màu chỗ sai. */
  elements: HTMLElement[][];
}

function extractScore(tune: TuneObject): ExtractedScore {
  const events: ScoreEvent[] = [];
  const elements: HTMLElement[][] = [];
  try {
    // Bắt buộc gọi setUpAudio trước: abcjs chỉ điền midiPitches vào noteTimings
    // sau khi đã dựng chuỗi âm thanh. Không gọi thì mọi sự kiện đều rỗng nốt.
    tune.setUpAudio({});
    tune.setTiming();
    const timings = (tune as TuneWithTimings).noteTimings ?? [];
    for (const ev of timings) {
      if (ev.type !== 'event') continue;
      const pitches = (ev.midiPitches ?? []).map((p) => p.pitch);
      if (pitches.length === 0) continue;
      events.push({
        index: events.length,
        ms: ev.milliseconds,
        pitches: [...pitches].sort((a, b) => a - b),
        measureNumber: ev.measureNumber,
      });
      elements.push((ev.elements ?? []).flat());
    }
  } catch {
    // Bản nhạc lạ khiến abcjs không dựng được mốc thời gian: bỏ phần luyện tập,
    // phần hiển thị và phát nhạc vẫn chạy bình thường.
    return { events: [], elements: [] };
  }
  return { events, elements };
}

const WRONG_CLASS = 'practice-wrong';
const MISSING_CLASS = 'practice-missing';
const CORRECT_CLASS = 'practice-correct';
const MISS_FLASH_CLASS = 'practice-miss-flash';
/** Phải khớp thời lượng keyframes `practice-miss-flash` trong globals.css. */
const MISS_FLASH_MS = 450;

export function AbcjsViewer({ abcNotation }: { abcNotation: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLElement[][]>([]);
  /** Giữ lại để đổi nhạc cụ mà không phải vẽ lại bản nhạc. */
  const tuneRef = useRef<TuneObject | null>(null);
  const synthControlRef = useRef<InstanceType<typeof ABCJS.synth.SynthController> | null>(null);

  const [expected, setExpected] = useState<ScoreEvent[]>([]);
  const [practiceOpen, setPracticeOpen] = useState(false);
  /** Bật khi SynthController đã gắn xong, để effect nạp tiếng đàn biết lúc chạy. */
  const [audioReady, setAudioReady] = useState(false);
  // Đọc localStorage ngay lúc khởi tạo state được, không lo lệch hydration:
  // ô chọn nhạc cụ chỉ hiện sau khi audioReady bật, nên `program` không hề nằm
  // trong cây render đầu tiên mà React đem so với HTML dựng từ server.
  const [program, setProgram] = useState(loadSavedProgram);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  /** Vị trí đang phát, 0..1. */
  const [progress, setProgress] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [warp, setWarp] = useState(100);
  const [bpm, setBpm] = useState(0);

  /** Hẹn giờ gỡ lớp nháy đỏ, một cái cho mỗi nốt đang nháy. */
  const flashTimersRef = useRef(new Map<number, number>());

  const clearFlashes = useCallback(() => {
    for (const timer of flashTimersRef.current.values()) window.clearTimeout(timer);
    flashTimersRef.current.clear();
    for (const group of elementsRef.current) {
      for (const el of group) el.classList?.remove(MISS_FLASH_CLASS);
    }
  }, []);

  const clearHighlights = useCallback(() => {
    clearFlashes();
    for (const group of elementsRef.current) {
      for (const el of group) el.classList?.remove(WRONG_CLASS, MISSING_CLASS, CORRECT_CLASS);
    }
  }, [clearFlashes]);

  /**
   * Nháy đỏ và rung nhẹ nốt người học đáng lẽ phải đánh.
   *
   * Nháy rồi tắt hẳn, không để lại vết trên khuông: mục đích là "ê, chỗ này
   * này", không phải ghi sổ lỗi. Bấm sai liên tiếp thì phải cho hiệu ứng chạy
   * lại từ đầu — gỡ lớp ra, ép trình duyệt tính lại bố cục, rồi mới gắn vào.
   * Thiếu bước ép tính lại thì trình duyệt gộp hai thao tác làm một và hiệu ứng
   * đứng im ở lần nháy đầu.
   */
  const flashWrongNote = useCallback((expectedIndex: number) => {
    const group = elementsRef.current[expectedIndex];
    if (!group || group.length === 0) return;

    const pending = flashTimersRef.current.get(expectedIndex);
    if (pending !== undefined) window.clearTimeout(pending);

    for (const el of group) {
      el.classList?.remove(MISS_FLASH_CLASS);
      void el.getBoundingClientRect();
      el.classList?.add(MISS_FLASH_CLASS);
    }

    flashTimersRef.current.set(expectedIndex, window.setTimeout(() => {
      for (const el of group) el.classList?.remove(MISS_FLASH_CLASS);
      flashTimersRef.current.delete(expectedIndex);
    }, MISS_FLASH_MS));
  }, []);

  // Bản nhạc bị dựng lại (đổi bài) trong lúc còn hẹn giờ thì các hẹn giờ đó trỏ
  // vào phần tử đã bị vứt. Dọn sạch khi rời trang.
  useEffect(() => clearFlashes, [clearFlashes]);

  /**
   * Tô xanh những chỗ người học vừa đánh đúng, ngay trong lúc đang đánh.
   *
   * Vẽ lại toàn bộ thay vì chỉ thêm chỗ mới: rẻ hơn nhiều so với việc phải giữ
   * đúng trạng thái cũ, mà mỗi lần vẽ chỉ vài trăm thao tác DOM cho một lần bấm
   * phím. Không có nhánh nào tô màu cho nốt sai — đó là chủ ý, xem score-follow.ts.
   */
  const paintLiveMatches = useCallback((matchedIndexes: number[] | null) => {
    clearHighlights();
    if (!matchedIndexes) return;
    for (const index of matchedIndexes) {
      for (const el of elementsRef.current[index] ?? []) el.classList?.add(CORRECT_CLASS);
    }
  }, [clearHighlights]);

  const paintResults = useCallback((results: EventResult[] | null) => {
    clearHighlights();
    if (!results) return;
    for (const r of results) {
      if (r.status === 'correct') continue;
      const group = elementsRef.current[r.expectedIndex] ?? [];
      for (const el of group) {
        el.classList?.add(r.status === 'wrong' ? WRONG_CLASS : MISSING_CLASS);
      }
    }
  }, [clearHighlights]);

  useEffect(() => {
    if (!paperRef.current || !audioRef.current) return;

    // Visual render
    const visualObj = ABCJS.renderAbc(paperRef.current, abcNotation, {
      responsive: 'resize',
      add_classes: true
    });

    const score = extractScore(visualObj[0]);
    elementsRef.current = score.elements;
    tuneRef.current = visualObj[0];
    setExpected(score.events);
    setPracticeOpen(false);
    setAudioReady(false);
    setIsPlaying(false);
    setIsLooping(false);
    setProgress(0);
    setWarp(100);
    setBpm(bpmAtWarp(visualObj[0], 100));

    // Audio render
    if (ABCJS.synth.supportsAudio()) {
      const synthControl = new ABCJS.synth.SynthController();

      const clearPlaybackHighlight = () => {
        paperRef.current?.querySelectorAll('.abcjs-highlight').forEach((e) => e.classList.remove('abcjs-highlight'));
      };

      const cursorControl = {
        onStart: () => {
          clearPlaybackHighlight();
          setIsPlaying(true);
        },
        onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {
          setProgress(totalBeats > 0 ? beatNumber / totalBeats : 0);
          setTotalMs(totalTime);
        },
        onEvent: (ev: NoteTimingEvent) => {
          clearPlaybackHighlight();
          for (const group of ev.elements ?? []) {
            for (const el of group) el.classList?.add('abcjs-highlight');
          }
        },
        onFinished: () => {
          clearPlaybackHighlight();
          setIsPlaying(false);
          setProgress(0);
        },
      };

      // Vẫn phải gọi load() để SynthController có chỗ gắn: nội bộ nó cập nhật
      // các nút bấm ở đây mỗi khi trạng thái đổi. Ta ẩn hẳn khối này đi và tự
      // dựng lại giao diện bằng Mantine ở SheetAudioControls cho đồng bộ theme.
      // Riêng displayWarp phải bật, vì `setWarp` ghi thẳng vào ô nhập tốc độ
      // của abcjs mà không kiểm tra tồn tại — thiếu nó là lỗi ngay khi đổi tốc độ.
      synthControl.load(audioRef.current, cursorControl, {
        displayWarp: true
      });

      // setTune tự dựng lấy chuỗi âm thanh của nó, nên không cần CreateSynth
      // riêng ở đây — tạo thêm chỉ khiến mẫu âm bị tải hai lần.
      synthControlRef.current = synthControl;
      setAudioReady(true);
    }
  }, [abcNotation]);

  /**
   * Kéo to bản nhạc vừa dựng xong. Phải gọi lại sau *mọi* lần abcjs dựng lại
   * chuỗi âm thanh — đổi bài, đổi tiếng đàn, đổi tốc độ — vì mỗi lần như vậy
   * nó tạo một AudioBuffer mới ở mức gốc.
   */
  const boostVolume = useCallback(() => {
    const synthControl = synthControlRef.current as SynthControllerInternals | null;
    const buffer = synthControl?.midiBuffer?.getAudioBuffer?.();
    if (buffer) normalizeBufferVolume(buffer);
  }, []);

  // Nạp lại tiếng đàn khi đổi bản nhạc hoặc khi người học chọn nhạc cụ khác.
  useEffect(() => {
    const synthControl = synthControlRef.current;
    const tune = tuneRef.current;
    if (!audioReady || !synthControl || !tune) return;

    // Phải truyền userAction=true để ép SynthController gọi lại go(), tức
    // build lại midiBuffer theo `program`/soundFontUrl mới. Gọi với false
    // (như trước) chỉ ghi đè self.options mà không nạp lại gì — nên sau
    // lần play đầu tiên, đổi nhạc cụ không có tác dụng vì self.isLoaded
    // đã true và play() không gọi go() nữa (xem runWhenReady trong abcjs).
    synthControl.setTune(tune, true, synthOptions(program)).then(boostVolume).catch((err) => {
      console.warn('Audio problem:', err);
    });
  }, [audioReady, program, abcNotation, boostVolume]);

  const handlePlayPause = useCallback(() => {
    const synthControl = synthControlRef.current;
    if (!synthControl) return;
    // play() tự lật giữa phát và dừng; onStart chỉ báo lúc bắt đầu nên khi tạm
    // dừng phải tự hạ cờ xuống. Lật ngay, không chờ promise, để nút phản hồi liền tay.
    synthControl.play();
    setIsPlaying((playing) => !playing);
  }, []);

  const handleRestart = useCallback(() => {
    synthControlRef.current?.restart();
    setProgress(0);
  }, []);

  const handleToggleLoop = useCallback(() => {
    synthControlRef.current?.toggleLoop();
    setIsLooping((looping) => !looping);
  }, []);

  const handleSeek = useCallback((next: number) => {
    (synthControlRef.current as SynthControllerInternals | null)?.seek?.(next);
    setProgress(next);
  }, []);

  const handleWarpChange = useCallback((next: number) => {
    const tune = tuneRef.current;
    setWarp(next);
    if (tune) setBpm(bpmAtWarp(tune, next));
    // setWarp dựng lại buffer từ đầu (destroy rồi go), nên phải kéo to lại.
    synthControlRef.current?.setWarp(next)?.then(boostVolume);
  }, [boostVolume]);

  const showPracticeButton = expected.length > 0 && !practiceOpen;

  return (
    <div className="sheet-music-wrapper" style={{ margin: '2rem 0', background: 'var(--mantine-color-body)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mantine-color-default-border)' }}>
      <div ref={paperRef} className="sheet-music-paper" style={{ background: '#fff', color: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}></div>
      {/* Thanh mặc định của abcjs — ẩn đi, chỉ giữ làm chỗ cho nó ghi trạng thái. */}
      <div ref={audioRef} className="sheet-music-audio" style={{ display: 'none' }}></div>

      {audioReady && (
        <SheetAudioControls
          isPlaying={isPlaying}
          isLooping={isLooping}
          progress={progress}
          totalMs={totalMs}
          warp={warp}
          bpm={bpm}
          onPlayPause={handlePlayPause}
          onRestart={handleRestart}
          onToggleLoop={handleToggleLoop}
          onSeek={handleSeek}
          onWarpChange={handleWarpChange}
        />
      )}

      {/* Canh đáy để nút thẳng hàng với ô chọn — ô chọn bị nhãn đẩy xuống thấp hơn. */}
      {(audioReady || showPracticeButton) && (
        <Group mt="sm" gap="sm" align="flex-end">
          {audioReady && (
            <Select
              size="xs"
              label="Tiếng đàn khi nghe mẫu"
              data={['Piano cơ', 'Piano điện', 'Khác'].map((group) => ({
                group,
                items: INSTRUMENTS.filter((i) => i.group === group).map((i) => ({
                  value: String(i.program),
                  label: i.label,
                })),
              }))}
              value={String(program)}
              allowDeselect={false}
              w={240}
              onChange={(value) => {
                if (!value) return;
                const next = Number(value);
                setProgram(next);
                saveProgram(next);
              }}
            />
          )}

          {showPracticeButton && (
            <Button
              variant="light"
              size="xs"
              leftSection={<IconDeviceGamepad2 size={16} />}
              onClick={() => setPracticeOpen(true)}
              data-testid="open-practice"
            >
              Tập bài này với đàn
            </Button>
          )}
        </Group>
      )}

      {practiceOpen && (
        <ScorePractice
          expected={expected}
          onResults={paintResults}
          onLiveMatch={paintLiveMatches}
          onWrongNote={flashWrongNote}
        />
      )}
    </div>
  );
}
