/**
 * Bảng nốt dùng cho bài luyện nhận nốt qua đàn MIDI.
 *
 * Cố ý viết tay từng nốt thay vì suy ra từ số MIDI: cách viết nốt trên khuông
 * (Mi giáng hay Rê thăng — cùng một phím đen) phụ thuộc vào ngữ cảnh bản nhạc,
 * máy không đoán đúng được. Bảng này bám đúng cách viết đang dùng trong giáo trình.
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

/** Tay phải — 5 nốt khóa Sol, đúng thế tay Đô của Chương 1. */
export const TREBLE_C_POSITION: DrillNote[] = [
  { midi: 60, abc: 'C', name: 'Đô', scientific: 'C4' },
  { midi: 62, abc: 'D', name: 'Rê', scientific: 'D4' },
  { midi: 64, abc: 'E', name: 'Mi', scientific: 'E4' },
  { midi: 65, abc: 'F', name: 'Pha', scientific: 'F4' },
  { midi: 67, abc: 'G', name: 'Sol', scientific: 'G4' },
];

/** Tay trái — 5 nốt khóa Pha, đúng thế tay Đô của Chương 1. */
export const BASS_C_POSITION: DrillNote[] = [
  { midi: 48, abc: 'C,', name: 'Đô', scientific: 'C3' },
  { midi: 50, abc: 'D,', name: 'Rê', scientific: 'D3' },
  { midi: 52, abc: 'E,', name: 'Mi', scientific: 'E3' },
  { midi: 53, abc: 'F,', name: 'Pha', scientific: 'F3' },
  { midi: 55, abc: 'G,', name: 'Sol', scientific: 'G3' },
];

/** Hai phím đen duy nhất đã dạy tới Chương 4. */
export const ACCIDENTALS: DrillNote[] = [
  { midi: 63, abc: '_E', name: 'Mi giáng', scientific: 'E♭4' },
  { midi: 66, abc: '^F', name: 'Pha thăng', scientific: 'F♯4' },
];

export type ClefName = 'treble' | 'bass';

export interface DrillLevel {
  id: string;
  label: string;
  /** Câu mô tả ngắn hiện dưới nút chọn mức. */
  hint: string;
  clef: ClefName;
  notes: DrillNote[];
}

export const DRILL_LEVELS: DrillLevel[] = [
  {
    id: 'treble',
    label: 'Khóa Sol (tay phải)',
    hint: 'Năm nốt Đô–Sol của thế tay Đô, Chương 1.',
    clef: 'treble',
    notes: TREBLE_C_POSITION,
  },
  {
    id: 'bass',
    label: 'Khóa Pha (tay trái)',
    hint: 'Năm nốt Đô–Sol quãng thấp, Chương 1.',
    clef: 'bass',
    notes: BASS_C_POSITION,
  },
  {
    id: 'accidentals',
    label: 'Thêm phím đen',
    hint: 'Khóa Sol, có thêm Mi giáng và Pha thăng của Chương 4.',
    clef: 'treble',
    notes: [...TREBLE_C_POSITION, ...ACCIDENTALS],
  },
];

export function findLevel(id: string): DrillLevel {
  return DRILL_LEVELS.find((l) => l.id === id) ?? DRILL_LEVELS[0];
}

/** Dựng đoạn ABC vẽ đúng một nốt tròn, không có số chỉ nhịp cho đỡ rối. */
export function singleNoteAbc(note: DrillNote, clef: ClefName): string {
  return ['X:1', 'L:1/1', 'M:none', `K:C clef=${clef}`, note.abc].join('\n');
}

/**
 * Chọn nốt kế tiếp, tránh lặp lại ngay nốt vừa rồi để người học không đoán mò.
 * `random` tách ra thành tham số để kiểm thử được.
 */
export function pickNextNote(
  notes: DrillNote[],
  previous: DrillNote | null,
  random: () => number = Math.random,
): DrillNote {
  if (notes.length === 0) throw new Error('Danh sách nốt rỗng');
  if (notes.length === 1) return notes[0];
  const pool = previous ? notes.filter((n) => n.midi !== previous.midi) : notes;
  return pool[Math.floor(random() * pool.length) % pool.length];
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
