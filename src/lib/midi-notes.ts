/**
 * Bảng nốt và bộ chọn phạm vi cho bài luyện nhận nốt.
 *
 * Trước đây file này có ba mức cố định (khóa Sol, khóa Pha, thêm phím đen). Chủ
 * sản phẩm cần tập nốt nhảy rộng hơn, nên nay người học tự ghép ba thứ rời nhau:
 *
 * 1. **Tay nào** — khóa Sol, khóa Pha, hay cả hai (mỗi câu hỏi đổi khóa).
 * 2. **Quãng nào** — chọn ngay trên hình bàn phím 88 phím, nhiều quãng cùng lúc.
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
 * Quãng tám nào đọc được ở khóa nào.
 *
 * Không phải cấm đoán vô cớ: Đô quãng 6 viết ở khóa Pha phải kẻ bảy dòng kẻ phụ,
 * còn Đô quãng 1 ở khóa Sol cũng vậy. Người học tập đọc nốt chứ không tập đếm
 * dòng kẻ phụ, nên quãng nào khóa đó không đọc nổi thì ẩn hẳn khỏi bàn phím chọn.
 *
 * Quãng 4 — quãng của Đô giữa — thuộc về cả hai khóa, đúng như trên bản nhạc thật.
 */
export const OCTAVES_BY_CLEF: Record<ClefName, number[]> = {
  treble: [4, 5, 6, 7],
  bass: [1, 2, 3, 4],
};

export interface DrillOptions {
  hands: Hands;
  /** Các quãng tám đang chọn. Chọn nhiều quãng cách xa nhau thì nốt nhảy qua lại. */
  octaves: number[];
  /**
   * Chỉ lấy năm nốt Đô–Sol của mỗi quãng đã chọn.
   *
   * Đây là thế tay 5 ngón của Chương 1, và là mặc định cho người mới: cả bàn tay
   * đứng yên một chỗ, không phải với. Tắt đi thì lấy trọn bảy nốt Đô–Si.
   */
  fiveFinger: boolean;
  /** Có đưa phím đen vào không. */
  accidentals: boolean;
}

/** Nốt cao nhất của thế tay 5 ngón, tính từ nốt Đô của quãng: Đô-Rê-Mi-Pha-Sol. */
const FIVE_FINGER_SEMITONES = 7;

export const DEFAULT_OPTIONS: DrillOptions = {
  hands: 'right',
  octaves: [4],
  fiveFinger: true,
  accidentals: false,
};

export function clefsFor(hands: Hands): ClefName[] {
  if (hands === 'right') return ['treble'];
  if (hands === 'left') return ['bass'];
  return ['treble', 'bass'];
}

/**
 * Tên quãng hiện cho người học.
 *
 * Gọi theo nốt Đô mở đầu quãng chứ không theo số thứ tự khoa học, vì trên bàn
 * phím người học tìm nốt Đô trước rồi mới đếm — và quãng 4 luôn gọi là "Đô giữa",
 * cái mốc duy nhất ai cũng biết.
 */
export function octaveLabel(octave: number): string {
  return octave === 4 ? 'Đô giữa' : `Đô${octave}`;
}

/** Những quãng chọn được với tay đang chọn, thấp tới cao. */
export function octavesFor(hands: Hands): number[] {
  const all = clefsFor(hands).flatMap((clef) => OCTAVES_BY_CLEF[clef]);
  return [...new Set(all)].sort((a, b) => a - b);
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
    for (const octave of [...options.octaves].sort((a, b) => a - b)) {
      if (!OCTAVES_BY_CLEF[clef].includes(octave)) continue;
      const first = (octave + 1) * 12;
      const last = first + (options.fiveFinger ? FIVE_FINGER_SEMITONES : 11);
      for (let midi = first; midi <= last; midi++) {
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

/**
 * Dựng đoạn ABC vẽ đúng một nốt tròn, không có số chỉ nhịp cho đỡ rối.
 *
 * `grandStaff` bật thì vẽ **cả hai khuông như bản nhạc piano thật**: khóa Sol ở
 * trên, khóa Pha ở dưới, nốt nằm ở khuông của nó còn khuông kia để trống. Đây là
 * chế độ cho người chọn tập cả hai tay — việc đọc được nốt nằm ở khuông NÀO cũng
 * là một phần của bài, mà vẽ mỗi một khuông thì mất hẳn phần đó.
 *
 * Khuông trống dùng `x` (lặng ẩn) chứ không dùng `z`: dấu lặng vẽ ra giữa khuông
 * trông như một ký hiệu phải đọc, mà ở đây nó không mang nghĩa gì.
 */
export function singleNoteAbc(note: DrillNote, clef: ClefName, grandStaff = false): string {
  if (!grandStaff) {
    return ['X:1', 'L:1/1', 'M:none', `K:C clef=${clef}`, note.abc].join('\n');
  }
  return [
    'X:1',
    'L:1/1',
    'M:none',
    '%%staves {1 2}',
    'K:C',
    'V:1 clef=treble',
    clef === 'treble' ? note.abc : 'x',
    'V:2 clef=bass',
    clef === 'bass' ? note.abc : 'x',
  ].join('\n');
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
