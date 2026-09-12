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

/** Một nốt nằm trên một khóa. Khóa đi theo nốt chứ không theo buổi tập. */
export interface DrillPart {
  note: DrillNote;
  clef: ClefName;
}

/**
 * Một câu hỏi: **một hoặc hai nốt**.
 *
 * Hai nốt thì mỗi nốt một khóa — một cho tay phải, một cho tay trái, bấm cùng
 * lúc. Đây là bước gần bản nhạc thật nhất mà bài luyện này làm được: đọc bản
 * nhạc piano là đọc hai khuông một lúc, không phải đọc lần lượt.
 */
export interface DrillQuestion {
  parts: DrillPart[];
}

/** Khoá nhận dạng một phần câu hỏi, để so xem hai câu có trùng nhau không. */
function partKey(part: DrillPart): string {
  return `${part.clef}:${part.note.midi}`;
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
  /**
   * Mỗi câu hỏi mấy nốt. Chỉ có nghĩa khi tập cả hai tay.
   *
   * - `one` — một nốt, nằm ở khuông nào thì đọc khuông đó.
   * - `both` — hai nốt cùng lúc, mỗi khuông một nốt; phải bấm đủ cả hai mới xong.
   * - `mixed` — khi một khi hai, không đoán trước được. Đây là kiểu sát bản nhạc
   *   thật nhất: có chỗ chỉ một tay đánh, có chỗ hai tay cùng đánh.
   */
  notesPerQuestion: NotesPerQuestion;
}

export type NotesPerQuestion = 'one' | 'both' | 'mixed';

/** Nốt cao nhất của thế tay 5 ngón, tính từ nốt Đô của quãng: Đô-Rê-Mi-Pha-Sol. */
const FIVE_FINGER_SEMITONES = 7;

export const DEFAULT_OPTIONS: DrillOptions = {
  hands: 'right',
  octaves: [4],
  fiveFinger: true,
  accidentals: false,
  notesPerQuestion: 'one',
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
 * Kho nốt suy ra từ lựa chọn của người học — mỗi phần tử là một nốt trên một khóa.
 *
 * Trả về mảng đã **bỏ trùng theo cặp (khóa, nốt)**: hai vùng chồng lên nhau —
 * thế tay Đô nằm trong quãng Đô giữa chẳng hạn — thì nốt chung chỉ xuất hiện một
 * lần, không thì nó bị hỏi dày gấp đôi các nốt khác.
 *
 * Xếp theo khóa rồi tới cao độ để thứ tự ổn định, tiện cho test và cho việc suy
 * ra tầm nghe của micro.
 */
export function notePoolForOptions(options: DrillOptions): DrillPart[] {
  const seen = new Set<string>();
  const out: DrillPart[] = [];

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
 * Dựng đoạn ABC vẽ câu hỏi, mỗi nốt một hình tròn, không có số chỉ nhịp cho đỡ rối.
 *
 * `grandStaff` bật thì vẽ **cả hai khuông như bản nhạc piano thật**: khóa Sol ở
 * trên, khóa Pha ở dưới, nốt nằm ở khuông của nó còn khuông kia để trống. Câu hai
 * nốt thì mỗi khuông một nốt, thẳng hàng nhau — đúng như hai tay bấm cùng lúc.
 *
 * Khuông trống dùng `x` (lặng ẩn) chứ không dùng `z`: dấu lặng vẽ ra giữa khuông
 * trông như một ký hiệu phải đọc, mà ở đây nó không mang nghĩa gì.
 */
export function questionAbc(question: DrillQuestion, grandStaff = false): string {
  const head = ['X:1', 'L:1/1', 'M:none'];
  const noteOn = (clef: ClefName) => question.parts.find((p) => p.clef === clef)?.note.abc ?? 'x';

  if (!grandStaff) {
    const only = question.parts[0];
    return [...head, `K:C clef=${only.clef}`, only.note.abc].join('\n');
  }

  return [
    ...head,
    '%%staves {1 2}',
    'K:C',
    'V:1 clef=treble',
    noteOn('treble'),
    'V:2 clef=bass',
    noteOn('bass'),
  ].join('\n');
}

/**
 * Bốc một nốt trong danh sách, né những nốt vừa hỏi xong.
 *
 * Né hết mà không còn gì thì lấy cả danh sách: kho chỉ có một nốt vẫn phải hỏi
 * được, thà hỏi lại còn hơn không có câu nào.
 */
function pickPart(list: DrillPart[], avoid: Set<string>, random: () => number): DrillPart {
  const free = list.filter((p) => !avoid.has(partKey(p)));
  const usable = free.length > 0 ? free : list;
  return usable[Math.floor(random() * usable.length) % usable.length];
}

/**
 * Chọn câu hỏi kế tiếp từ kho nốt, tránh lặp lại ngay câu vừa rồi.
 *
 * Số nốt mỗi câu do `options.notesPerQuestion` quyết, nhưng **luôn có đường lùi**:
 * đòi hai nốt mà kho chỉ có một khóa (đang tập một tay, hoặc quãng đã chọn chỉ
 * đọc được ở một khóa) thì ra câu một nốt, chứ không trả về câu rỗng.
 *
 * `random` tách ra thành tham số để kiểm thử được.
 */
export function pickNextQuestion(
  pool: DrillPart[],
  previous: DrillQuestion | null,
  options: DrillOptions,
  random: () => number = Math.random,
): DrillQuestion | null {
  if (pool.length === 0) return null;
  const avoid = new Set((previous?.parts ?? []).map(partKey));

  const muonHai = options.notesPerQuestion === 'both'
    || (options.notesPerQuestion === 'mixed' && random() < 0.5);

  if (muonHai) {
    const treble = pool.filter((p) => p.clef === 'treble');
    const bass = pool.filter((p) => p.clef === 'bass');
    if (treble.length > 0 && bass.length > 0) {
      return { parts: [pickPart(treble, avoid, random), pickPart(bass, avoid, random)] };
    }
  }

  return { parts: [pickPart(pool, avoid, random)] };
}

/**
 * Kết quả của một lần bấm phím vào câu hỏi đang chờ.
 *
 * Trả về luôn danh sách nốt đã đúng sau lần bấm này, thay vì bắt chỗ gọi tự cộng
 * dồn. Lý do rất cụ thể: **micro nghe cả hai nốt trong cùng một lần**, nên chỗ
 * gọi xử lý hai phím liền nhau trong một nhịp. Nếu nó phải đọc state React để
 * biết đã đúng nốt nào thì lần thứ hai vẫn đọc ra giá trị cũ — cả hai lần đều
 * thấy "còn thiếu nốt kia" và câu không bao giờ xong.
 */
export type AnswerOutcome =
  | { kind: 'partial'; done: DrillPart; collected: number[] }
  | { kind: 'correct'; collected: number[] }
  /** Nốt này đã đúng từ trước — bỏ qua, không khen lại cũng không tính sai. */
  | { kind: 'again' }
  | { kind: 'wrong-octave' }
  | { kind: 'wrong' };

/**
 * So phím vừa bấm với câu hỏi đang chờ.
 *
 * Câu hai nốt **không bắt bấm đúng thứ tự**: hai tay đặt xuống bàn phím không
 * bao giờ chạm cùng một mili giây, mà ai chạm trước là tuỳ người.
 */
export function answerQuestion(
  question: DrillQuestion,
  collected: number[],
  played: number,
): AnswerOutcome {
  const conThieu = question.parts.filter((p) => !collected.includes(p.note.midi));
  if (conThieu.length === 0) return { kind: 'correct', collected };

  /*
   * Nốt đã đúng mà nghe lại lần nữa thì im lặng bỏ qua.
   *
   * Không có nhánh này thì micro báo sai oan liên tục: người học bấm nốt thứ
   * nhất rồi GIỮ NGUYÊN ngón trong lúc tìm nốt thứ hai, mà tiếng đàn còn ngân
   * thì lần nghe nào micro cũng nghe lại nốt đó.
   */
  if (collected.includes(played)) return { kind: 'again' };

  const trung = conThieu.find((p) => p.note.midi === played);
  if (trung) {
    const next = [...collected, trung.note.midi];
    return conThieu.length === 1
      ? { kind: 'correct', collected: next }
      : { kind: 'partial', done: trung, collected: next };
  }

  const saiQuangTam = conThieu.some((p) => checkAnswer(played, p.note.midi) === 'wrong-octave');
  return saiQuangTam ? { kind: 'wrong-octave' } : { kind: 'wrong' };
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
