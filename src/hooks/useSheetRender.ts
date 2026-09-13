'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import ABCJS from 'abcjs';
import type { NoteTimingEvent, TuneObject } from 'abcjs';
import type { EventResult, ScoreEvent } from '@/lib/score-compare';
import { bpmAtWarp } from '@/lib/sheet-tempo';
import { useNoteFlash } from './useNoteFlash';

/**
 * **Cửa VẼ của khung xem bản nhạc trong bài học.** Cửa còn lại là
 * `useSheetAudio.ts` (phần tiếng).
 *
 * abcjs chỉ được gọi ở **bốn hook**, không ở đâu khác trong repo: hai hook này
 * cho bài học, `useDrillStaff` cho bài luyện nhận nốt, `usePhrasePlayer` cho bài
 * luyện tai. Component không import abcjs.
 *
 * Vì sao tách: `AbcjsViewer.tsx` từng ôm cả vẽ, phát tiếng, phóng to, chế độ tập
 * trung và nối phím đàn trong 570 dòng — không ai nhìn ra gỡ abcjs ra thì đứt
 * những gì. Nay thư viện nằm sau hai hook, nên đổi thư viện (hoặc thêm thư viện
 * thứ hai cho một loại bản nhạc khác) là viết lại hai file này, không phải đọc
 * lại cả component.
 *
 * **Hook này vẽ và GIỮ LUÔN việc tô màu lên thứ vừa vẽ — cố ý gộp, đừng tách
 * ra.** Đó là bài học của bẫy 33: màu được đặt bằng cách thêm lớp CSS lên phần
 * tử SVG do abcjs sinh ra, mà mỗi lần vẽ lại là thư viện vứt hết phần tử cũ. Để
 * việc tô màu ở một chỗ khác thì chỗ đó phải nhớ bám theo mọi lần vẽ lại — đã
 * hỏng ba lần vì đúng lý do đó. Ai giữ phần tử thì người đó tô.
 */

/** abcjs gắn `noteTimings` lên tune sau khi gọi `setTiming`, nhưng chưa khai trong .d.ts. */
type TuneWithTimings = TuneObject & { noteTimings?: NoteTimingEvent[] };

/**
 * Bản nhạc đã dựng xong, theo tên của mình chứ không theo tên của thư viện.
 *
 * Phần còn lại của app chỉ chuyền nó qua lại (`useSheetAudio` cần để nạp tiếng)
 * mà không bao giờ gọi thẳng phương thức nào, nên khi đổi thư viện thì chỉ hai
 * hook này phải biết nó thật ra là cái gì.
 */
export type SheetTune = TuneObject;

const WRONG_CLASS = 'practice-wrong';
const MISSING_CLASS = 'practice-missing';
const CORRECT_CLASS = 'practice-correct';
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

export interface RenderedSheet {
  /** `null` cho tới khi vẽ xong. Chuyền thẳng cho `useSheetAudio`. */
  tune: SheetTune | null;
  /** Mốc từng nốt, để phần *Tập bài này với đàn* so với thứ người học đánh. */
  events: ScoreEvent[];
  /** Nhịp mỗi phút ở tốc độ `warp`. Trả 0 khi bản nhạc chưa dựng xong. */
  bpmAt: (warp: number) => number;
  /** Tô xanh những chỗ vừa đánh đúng. `null` là xoá hết màu. */
  paintLiveMatches: (matchedIndexes: number[] | null) => void;
  /** Tô kết quả sau khi bấm dừng: đỏ chỗ sai, xám chỗ bỏ sót. */
  paintResults: (results: EventResult[] | null) => void;
  /** Nháy đỏ nốt đang chờ khi người học bấm trượt. */
  flashWrongNote: (expectedIndex: number) => void;
}

export function useSheetRender(
  paperRef: RefObject<HTMLDivElement | null>,
  abcNotation: string,
): RenderedSheet {
  const elementsRef = useRef<HTMLElement[][]>([]);
  const { flash, clearFlashes } = useNoteFlash();
  const tuneRef = useRef<TuneObject | null>(null);

  const [tune, setTune] = useState<TuneObject | null>(null);
  const [events, setEvents] = useState<ScoreEvent[]>([]);

  const clearHighlights = useCallback(() => {
    clearFlashes();
    for (const group of elementsRef.current) {
      for (const el of group) el.classList?.remove(WRONG_CLASS, MISSING_CLASS, CORRECT_CLASS);
    }
  }, [clearFlashes]);

  useEffect(() => {
    if (!paperRef.current) return;

    const visualObj = ABCJS.renderAbc(paperRef.current, abcNotation, {
      responsive: 'resize',
      add_classes: true,
      /*
       * Tắt chuyện chạm vào nốt là chọn nốt.
       *
       * Mặc định của abcjs là cho chọn, và nốt được chọn bị tô ĐỎ rồi nằm đỏ mãi
       * tới khi chạm chỗ khác. Trên điện thoại thì chỉ cần vuốt trúng bản nhạc
       * lúc cuộn trang là dính, và người học thấy một nốt đỏ giữa bài mà không
       * hiểu mình vừa làm sai gì — đúng thứ màu app dùng để báo đánh sai.
       *
       * Không chỗ nào trong app dùng tới việc chọn nốt: tua bài đi bằng thanh
       * tiến trình, tô màu chấm bài đi bằng lớp CSS riêng.
       */
      selectTypes: false,
    });

    const score = extractScore(visualObj[0]);
    elementsRef.current = score.elements;
    tuneRef.current = visualObj[0];
    setTune(visualObj[0]);
    setEvents(score.events);
  }, [paperRef, abcNotation]);

  const bpmAt = useCallback((warp: number) => {
    const current = tuneRef.current;
    if (!current) return 0;
    return bpmAtWarp(current.millisecondsPerMeasure(), current.getBeatsPerMeasure(), warp);
  }, []);

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

  /** Nháy đỏ nốt người học đáng lẽ phải đánh. Phần máy móc ở `useNoteFlash`. */
  const flashWrongNote = useCallback((expectedIndex: number) => {
    flash(expectedIndex, elementsRef.current[expectedIndex] ?? []);
  }, [flash]);

  return { tune, events, bpmAt, paintLiveMatches, paintResults, flashWrongNote };
}
