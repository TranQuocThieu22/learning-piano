'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import type { NoteTimingEvent, TuneObject } from 'abcjs';
import 'abcjs/abcjs-audio.css';
import { Button, Group } from '@mantine/core';
import { IconDeviceGamepad2 } from '@tabler/icons-react';
import { ScorePractice } from './ScorePractice';
import type { EventResult, ScoreEvent } from '@/lib/score-compare';

/** abcjs gắn noteTimings lên tune sau khi gọi setTiming, nhưng chưa khai báo trong .d.ts. */
type TuneWithTimings = TuneObject & { noteTimings?: NoteTimingEvent[] };

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

export function AbcjsViewer({ abcNotation }: { abcNotation: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLElement[][]>([]);

  const [expected, setExpected] = useState<ScoreEvent[]>([]);
  const [practiceOpen, setPracticeOpen] = useState(false);

  const clearHighlights = useCallback(() => {
    for (const group of elementsRef.current) {
      for (const el of group) el.classList?.remove(WRONG_CLASS, MISSING_CLASS);
    }
  }, []);

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
    setExpected(score.events);
    setPracticeOpen(false);

    // Audio render
    if (ABCJS.synth.supportsAudio()) {
      const synthControl = new ABCJS.synth.SynthController();

      const clearPlaybackHighlight = () => {
        paperRef.current?.querySelectorAll('.abcjs-highlight').forEach((e) => e.classList.remove('abcjs-highlight'));
      };

      const cursorControl = {
        onStart: clearPlaybackHighlight,
        onEvent: (ev: NoteTimingEvent) => {
          clearPlaybackHighlight();
          for (const group of ev.elements ?? []) {
            for (const el of group) el.classList?.add('abcjs-highlight');
          }
        },
        onFinished: clearPlaybackHighlight,
      };

      synthControl.load(audioRef.current, cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true
      });

      const midiBuffer = new ABCJS.synth.CreateSynth();
      midiBuffer.init({
        visualObj: visualObj[0]
      }).then(() => {
        synthControl.setTune(visualObj[0], false);
      }).catch(err => {
        console.warn("Audio problem:", err);
      });
    }
  }, [abcNotation]);

  return (
    <div className="sheet-music-wrapper" style={{ margin: '2rem 0', background: 'var(--mantine-color-body)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mantine-color-default-border)' }}>
      <div ref={paperRef} className="sheet-music-paper" style={{ background: '#fff', color: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}></div>
      <div ref={audioRef} className="sheet-music-audio" style={{ marginTop: '1rem' }}></div>

      {expected.length > 0 && (
        <>
          {!practiceOpen && (
            <Group mt="sm">
              <Button
                variant="light"
                size="xs"
                leftSection={<IconDeviceGamepad2 size={16} />}
                onClick={() => setPracticeOpen(true)}
                data-testid="open-practice"
              >
                Tập bài này với đàn
              </Button>
            </Group>
          )}
          {practiceOpen && <ScorePractice expected={expected} onResults={paintResults} />}
        </>
      )}
    </div>
  );
}
