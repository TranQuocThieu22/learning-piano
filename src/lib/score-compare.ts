/**
 * So bản ghi từ đàn với bản nhạc trên khuông.
 *
 * Cố ý KHÔNG chấm điểm trong lúc người học đang đánh. Toàn bộ việc so sánh diễn
 * ra sau khi bấm "Dừng" — xem lại chứ không phải chạy đua. Đây là ràng buộc sản
 * phẩm, không phải lựa chọn kỹ thuật (xem AGENTS.md).
 */

/** Một thời điểm trong bản nhạc: có thể là một nốt, hoặc nhiều nốt cùng vang (hai tay). */
export interface ScoreEvent {
  index: number;
  /** Vị trí trong bản nhạc, tính bằng mili giây ở tốc độ ghi trong bài. */
  ms: number;
  pitches: number[];
  measureNumber?: number;
}

export interface PlayedNote {
  midi: number;
  /** Mốc thời gian lúc bấm, tính bằng mili giây kể từ khi bắt đầu ghi. */
  time: number;
}

export interface PlayedEvent {
  ms: number;
  pitches: number[];
}

/**
 * Gom các nốt bấm gần như cùng lúc thành một hợp âm.
 *
 * Người thật không bao giờ bấm hai tay đúng cùng một mili giây; nếu không gom
 * lại thì mọi hợp âm đều bị coi là chuỗi nốt rời và kết quả chấm sẽ sai hết.
 */
export function groupPlayedNotes(notes: PlayedNote[], windowMs = 90): PlayedEvent[] {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const events: PlayedEvent[] = [];
  for (const note of sorted) {
    const last = events[events.length - 1];
    if (last && note.time - last.ms <= windowMs) {
      if (!last.pitches.includes(note.midi)) last.pitches.push(note.midi);
    } else {
      events.push({ ms: note.time, pitches: [note.midi] });
    }
  }
  return events.map((e) => ({ ...e, pitches: [...e.pitches].sort((a, b) => a - b) }));
}

export type EventStatus = 'correct' | 'wrong' | 'missing';

export interface EventResult {
  expectedIndex: number;
  measureNumber?: number;
  status: EventStatus;
  expectedPitches: number[];
  /** Rỗng khi status là 'missing'. */
  playedPitches: number[];
  /** Chỉ số của sự kiện tương ứng trong bản ghi, dùng để tính nhịp. */
  playedIndex: number | null;
}

export interface TimingReport {
  /** Số nốt lệch nhịp đáng kể so với tốc độ trung bình của chính người học. */
  offBeatCount: number;
  /** Người học chơi nhanh hay chậm hơn tốc độ ghi trong bài, tính theo lần. */
  tempoRatio: number | null;
  /** Đủ dữ liệu để nói về nhịp hay chưa. */
  measurable: boolean;
}

export interface ComparisonResult {
  results: EventResult[];
  /** Những chỗ bấm thừa, không khớp với nốt nào trong bản nhạc. */
  extras: PlayedEvent[];
  correctCount: number;
  totalExpected: number;
  /** Phần trăm nốt đúng, 0-100. */
  accuracy: number;
  timing: TimingReport;
}

/** Số nốt lệch nhau giữa hai thời điểm. 0 nghĩa là khớp hoàn toàn. */
function pitchDistance(a: number[], b: number[]): number {
  const setB = new Set(b);
  let diff = 0;
  for (const p of a) if (!setB.has(p)) diff += 1;
  const setA = new Set(a);
  for (const p of b) if (!setA.has(p)) diff += 1;
  return diff;
}

const GAP_PENALTY = 1.5;

/**
 * Căn khớp hai chuỗi bằng quy hoạch động (kiểu Needleman-Wunsch).
 *
 * Không thể so từng cặp theo thứ tự được: chỉ cần người học bỏ sót một nốt ở
 * đầu bài là toàn bộ phần sau lệch một bậc và bị chấm sai hết, dù họ đánh đúng.
 * Thuật toán này cho phép chèn/bỏ để tìm cách khớp hợp lý nhất.
 */
export function compareToScore(expected: ScoreEvent[], played: PlayedEvent[]): ComparisonResult {
  const n = expected.length;
  const m = played.length;

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) cost[i][0] = i * GAP_PENALTY;
  for (let j = 1; j <= m; j++) cost[0][j] = j * GAP_PENALTY;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = cost[i - 1][j - 1] + pitchDistance(expected[i - 1].pitches, played[j - 1].pitches);
      const del = cost[i - 1][j] + GAP_PENALTY;
      const ins = cost[i][j - 1] + GAP_PENALTY;
      cost[i][j] = Math.min(sub, del, ins);
    }
  }

  const results: EventResult[] = [];
  const extras: PlayedEvent[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0
      && cost[i][j] === cost[i - 1][j - 1] + pitchDistance(expected[i - 1].pitches, played[j - 1].pitches)) {
      const exact = pitchDistance(expected[i - 1].pitches, played[j - 1].pitches) === 0;
      results.push({
        expectedIndex: i - 1,
        measureNumber: expected[i - 1].measureNumber,
        status: exact ? 'correct' : 'wrong',
        expectedPitches: expected[i - 1].pitches,
        playedPitches: played[j - 1].pitches,
        playedIndex: j - 1,
      });
      i -= 1;
      j -= 1;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + GAP_PENALTY) {
      results.push({
        expectedIndex: i - 1,
        measureNumber: expected[i - 1].measureNumber,
        status: 'missing',
        expectedPitches: expected[i - 1].pitches,
        playedPitches: [],
        playedIndex: null,
      });
      i -= 1;
    } else {
      extras.push(played[j - 1]);
      j -= 1;
    }
  }
  results.reverse();
  extras.reverse();

  const correctCount = results.filter((r) => r.status === 'correct').length;
  return {
    results,
    extras,
    correctCount,
    totalExpected: n,
    accuracy: n === 0 ? 0 : Math.round((correctCount / n) * 100),
    timing: analyseTiming(expected, played, results),
  };
}

/**
 * Đánh giá nhịp SAU khi đã căn khớp nốt.
 *
 * Tốc độ được suy ra từ chính bản ghi chứ không lấy tốc độ ghi trong bài: người
 * mới gần như luôn chơi chậm hơn, và chậm đều thì không phải lỗi. Cái đáng chỉ
 * ra là chỗ nhanh chậm thất thường so với chính họ.
 */
function analyseTiming(expected: ScoreEvent[], played: PlayedEvent[], results: EventResult[]): TimingReport {
  const pairs = results
    .filter((r) => r.playedIndex !== null)
    .map((r) => ({ exp: expected[r.expectedIndex].ms, act: played[r.playedIndex as number].ms }));

  if (pairs.length < 4) return { offBeatCount: 0, tempoRatio: null, measurable: false };

  const ratios: number[] = [];
  for (let k = 1; k < pairs.length; k++) {
    const expGap = pairs[k].exp - pairs[k - 1].exp;
    const actGap = pairs[k].act - pairs[k - 1].act;
    if (expGap > 20 && actGap > 20) ratios.push(actGap / expGap);
  }
  if (ratios.length < 3) return { offBeatCount: 0, tempoRatio: null, measurable: false };

  const sorted = [...ratios].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // Lệch quá 35% so với tốc độ trung bình của chính người học thì mới coi là thất thường.
  const offBeatCount = ratios.filter((r) => Math.abs(r - median) / median > 0.35).length;

  return { offBeatCount, tempoRatio: median, measurable: true };
}

const PITCH_CLASS_VI = ['Đô', 'Đô♯', 'Rê', 'Mi♭', 'Mi', 'Pha', 'Pha♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];

/** Đọc tên một hoặc nhiều nốt cùng lúc thành chuỗi tiếng Việt. */
export function describePitchList(pitches: number[]): string {
  if (pitches.length === 0) return 'không có nốt nào';
  return pitches
    .map((p) => {
      const pc = ((p % 12) + 12) % 12;
      return `${PITCH_CLASS_VI[pc]}${Math.floor(p / 12) - 1}`;
    })
    .join(' + ');
}
