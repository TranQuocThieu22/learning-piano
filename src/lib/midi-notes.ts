/**
 * Bảng nốt và bộ chọn phạm vi cho bài luyện nhận nốt.
 *
 * Trước đây file này có ba mức cố định (khóa Sol, khóa Pha, thêm phím đen). Chủ
 * sản phẩm cần tập nốt nhảy rộng hơn, nên nay người học tự ghép ba thứ rời nhau:
 *
 * 1. **Tay nào** — khóa Sol, khóa Pha, hay cả hai (mỗi câu hỏi đổi khóa).
 * 2. **Quãng nào** — chọn được nhiều vùng cùng lúc, nốt sẽ nhảy qua lại giữa chúng.
 * 3. **Có dấu hoá không** — phím đen bật/tắt.
 *
 * Ba thứ đó nhân với nhau ra kho câu hỏi; chọn kiểu gì cũng không cần thêm mã.
 */

export interface DrillNote {
  /** Số hiệu nốt MIDI. Đô giữa (C4) = 60. */
  midi: number;
  /** Cách viết trong ký hiệu ABC để vẽ lên khuông nhạc. */
  abc: string;
  /** Tên tiếng Việt hiển thị cho người học. */
  name: string;
  /** Ký hiệu quốc tế, hiện kèm trong ngoặc. */
  scientific: string;
}

export type ClefName = 'treble' | 'bass';
export type Hands = 'right' | 'left' | 'both';

/** Một câu hỏi: nốt nào, vẽ trên khóa nào. Khóa đi theo câu chứ không theo buổi tập. */
export interface DrillQuestion {
  note: DrillNote;
  clef: ClefName;
}

/**
 * Cách viết của từng phím trong một quãng tám.
 *
 * **Phím đen có hai cách viết mà chỉ chọn được một.** Mi giáng hay Rê thăng là
 * cùng một phím; cách viết đúng phụ thuộc giọng của bản nhạc, mà bài luyện này
 * không có bản nhạc nào cả. Nên chốt lấy cách hay gặp nhất trong giáo trình sơ
 * cấp: thăng cho Đô, Pha, Sol (giọng Sol, Rê trưởng); giáng cho Mi, Si (giọng
 * Pha, Si giáng trưởng). Người học gặp cách viết kia trong bài thật thì vẫn là
 * phím đó — chỗ này chỉ dạy tay tìm phím, không dạy chính tả hoà thanh.
 */
const PITCH_SPELLING: { letter: string; accidental: '' | '^' | '_'; name: string; symbol: string }[] = [
  { letter: 'C', accidental: '', name: 'Đô', symbol: 'C' },
  { letter: 'C', accidental: '^', name: 'Đô thăng', symbol: 'C♯' },
  { letter: 'D', accidental: '', name: 'Rê', symbol: 'D' },
  { letter: 'E', accidental: '_', name: 'Mi giáng', symbol: 'E♭' },
  { letter: 'E', accidental: '', name: 'Mi', symbol: 'E' },
  { letter: 'F', accidental: '', name: 'Pha', symbol: 'F' },
  { letter: 'F', accidental: '^', name: 'Pha thăng', symbol: 'F♯' },
  { letter: 'G', accidental: '', name: 'Sol', symbol: 'G' },
  { letter: 'G', accidental: '^', name: 'Sol thăng', symbol: 'G♯' },
  { letter: 'A', accidental: '', name: 'La', symbol: 'A' },
  { letter: 'B', accidental: '_', name: 'Si giáng', symbol: 'B♭' },
  { letter: 'B', accidental: '', name: 'Si', symbol: 'B' },
];

/** Phím đen: đúng năm cái trong mỗi quãng tám. */
export function isBlackKey(midi: number): boolean {
  return PITCH_SPELLING[((midi % 12) + 12) % 12].accidental !== '';
}

/**
 * Dựng một nốt từ số MIDI.
 *
 * Chỗ dễ sai: **dấu quãng tám trong ABC bám theo CHỮ CÁI, không bám theo phím.**
 * Si giáng quãng 3 viết là `_B,` — dấu phẩy thuộc về chữ B. Tính quãng tám từ
 * `midi` rồi mới ghép dấu thì tự khắc đúng, kể cả với nốt giáng.
 */
export function noteAt(midi: number): DrillNote {
  const spelling = PITCH_SPELLING[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;

  let letter = octave >= 5 ? spelling.letter.toLowerCase() : spelling.letter;
  if (octave >= 6) letter += "'".repeat(octave - 5);
  if (octave <= 3) letter += ','.repeat(4 - octave);

  return {
    midi,
    abc: spelling.accidental + letter,
    name: spelling.name,
    scientific: `${spelling.symbol}${octave}`,
  };
}

/**
 * Một vùng nốt người học chọn được.
 *
 * `perClef` nói vùng này vẽ được trên khóa nào và từ nốt nào tới nốt nào. Vùng
 * nào khóa nào không đọc nổi thì bỏ hẳn khỏi khóa đó — Đô quãng 6 viết ở khóa
 * Pha phải kẻ thêm bảy dòng phụ, đọc được thì cũng chẳng ai đọc thế.
 */
export interface DrillRange {
  id: string;
  label: string;
  detail: string;
  perClef: Partial<Record<ClefName, [number, number]>>;
}

export const DRILL_RANGES: DrillRange[] = [
  {
    id: 'the-tay-do',
    label: 'Thế tay Đô',
    detail: 'Năm nốt Đô–Sol của Chương 1',
    // Cùng một thế tay, nhưng tay phải đặt ở Đô giữa còn tay trái thấp hơn một
    // quãng tám — đúng như hai bài tập của Chương 1.
    perClef: { treble: [60, 67], bass: [48, 55] },
  },
  {
    id: 'quang-do-giua',
    label: 'Quãng Đô giữa',
    detail: 'Đô4–Si4, vùng cả hai tay đều với tới',
    perClef: { treble: [60, 71], bass: [60, 71] },
  },
  {
    id: 'quang-duoi',
    label: 'Quãng dưới',
    detail: 'Đô3–Si3, vùng quen của tay trái',
    perClef: { bass: [48, 59] },
  },
  {
    id: 'quang-tram',
    label: 'Quãng trầm',
    detail: 'Đô2–Si2, phía trái bàn phím',
    perClef: { bass: [36, 47] },
  },
  {
    id: 'quang-tren',
    label: 'Quãng trên',
    detail: 'Đô5–Si5, vùng quen của tay phải',
    perClef: { treble: [72, 83] },
  },
  {
    id: 'quang-cao',
    label: 'Quãng cao',
    detail: 'Đô6–Si6, phía phải bàn phím',
    perClef: { treble: [84, 95] },
  },
];

export interface DrillOptions {
  hands: Hands;
  /** Mã các vùng đang chọn. Chọn được nhiều vùng để nốt nhảy qua lại giữa chúng. */
  rangeIds: string[];
  /** Có đưa phím đen vào không. */
  accidentals: boolean;
}

export const DEFAULT_OPTIONS: DrillOptions = {
  hands: 'right',
  rangeIds: ['the-tay-do'],
  accidentals: false,
};

export function clefsFor(hands: Hands): ClefName[] {
  if (hands === 'right') return ['treble'];
  if (hands === 'left') return ['bass'];
  return ['treble', 'bass'];
}

/** Những vùng chọn được với tay đang chọn — vùng nào khóa đó không vẽ nổi thì ẩn. */
export function rangesFor(hands: Hands): DrillRange[] {
  const clefs = clefsFor(hands);
  return DRILL_RANGES.filter((r) => clefs.some((c) => r.perClef[c]));
}

/**
 * Kho câu hỏi suy ra từ lựa chọn của người học.
 *
 * Trả về mảng đã **bỏ trùng theo cặp (khóa, nốt)**: hai vùng chồng lên nhau —
 * thế tay Đô nằm trong quãng Đô giữa chẳng hạn — thì nốt chung chỉ xuất hiện một
 * lần, không thì nó bị hỏi dày gấp đôi các nốt khác.
 *
 * Xếp theo khóa rồi tới cao độ để thứ tự ổn định, tiện cho test và cho việc suy
 * ra tầm nghe của micro.
 */
export function questionsForOptions(options: DrillOptions): DrillQuestion[] {
  const seen = new Set<string>();
  const out: DrillQuestion[] = [];

  for (const clef of clefsFor(options.hands)) {
    for (const range of DRILL_RANGES) {
      if (!options.rangeIds.includes(range.id)) continue;
      const bounds = range.perClef[clef];
      if (!bounds) continue;
      for (let midi = bounds[0]; midi <= bounds[1]; midi++) {
        if (!options.accidentals && isBlackKey(midi)) continue;
        const key = `${clef}:${midi}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ note: noteAt(midi), clef });
      }
    }
  }

  return out.sort((a, b) => (a.clef === b.clef ? a.note.midi - b.note.midi : a.clef < b.clef ? 1 : -1));
}

/** Dựng đoạn ABC vẽ đúng một nốt tròn, không có số chỉ nhịp cho đỡ rối. */
export function singleNoteAbc(note: DrillNote, clef: ClefName): string {
  return ['X:1', 'L:1/1', 'M:none', `K:C clef=${clef}`, note.abc].join('\n');
}

/**
 * Chọn câu hỏi kế tiếp, tránh lặp lại ngay câu vừa rồi để người học không đoán mò.
 * `random` tách ra thành tham số để kiểm thử được.
 */
export function pickNextQuestion(
  pool: DrillQuestion[],
  previous: DrillQuestion | null,
  random: () => number = Math.random,
): DrillQuestion {
  if (pool.length === 0) throw new Error('Kho câu hỏi rỗng');
  if (pool.length === 1) return pool[0];
  const rest = previous
    ? pool.filter((q) => q.note.midi !== previous.note.midi || q.clef !== previous.clef)
    : pool;
  const usable = rest.length > 0 ? rest : pool;
  return usable[Math.floor(random() * usable.length) % usable.length];
}

export type AnswerVerdict = 'correct' | 'wrong-octave' | 'wrong';

/**
 * So nốt vừa bấm với nốt đang hỏi.
 *
 * Tách riêng 'wrong-octave' vì đây là lỗi rất khác về bản chất: người học ĐÃ
 * đọc đúng tên nốt, chỉ đặt tay nhầm quãng — nói rõ điều đó hữu ích hơn nhiều
 * so với một chữ "Sai".
 */
export function checkAnswer(played: number, target: number): AnswerVerdict {
  if (played === target) return 'correct';
  if (((played - target) % 12 + 12) % 12 === 0) return 'wrong-octave';
  return 'wrong';
}

const PITCH_CLASS_NAMES = ['Đô', 'Đô♯/Rê♭', 'Rê', 'Rê♯/Mi♭', 'Mi', 'Pha', 'Pha♯/Sol♭', 'Sol', 'Sol♯/La♭', 'La', 'La♯/Si♭', 'Si'];
const PITCH_CLASS_LATIN = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

/** Mô tả nốt bất kỳ người học bấm phải, kể cả nốt ngoài phạm vi bài. */
export function describeMidiNote(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASS_NAMES[pc]} (${PITCH_CLASS_LATIN[pc]}${octave})`;
}
