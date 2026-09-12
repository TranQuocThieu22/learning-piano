/**
 * Bảng nốt và bộ chọn phạm vi cho bài luyện nhận nốt.
 *
 * Trước đây file này có ba mức cố định (khóa Sol, khóa Pha, thêm phím đen). Chủ
 * sản phẩm cần tập nốt nhảy rộng hơn, nên nay người học tự ghép ba thứ rời nhau:
 *
 * 1. **Tay nào** — khóa Sol, khóa Pha, hay cả hai (mỗi câu hỏi đổi khóa).
 * 2. **Quãng nào** — chọn ngay trên hình bàn phím 88 phím, nhiều quãng cùng lúc.
 * 3. **Có nốt hoá bất thường không** — phím đen ngoài hoá biểu, bật/tắt.
 * 4. **Hoá biểu đổi mỗi câu hay không** — bật thì mỗi câu bốc một giọng.
 *
 * Mấy thứ đó nhân với nhau ra kho câu hỏi; chọn kiểu gì cũng không cần thêm mã.
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
  /**
   * Hoá biểu của riêng câu này.
   *
   * Đi theo CÂU chứ không theo buổi tập, vì mỗi câu bốc một giọng khác nhau. Để
   * nó ở đây thì chỗ vẽ và chỗ chấm không thể dùng hai giọng khác nhau được: cách
   * viết của từng nốt đã tính theo đúng giọng này ngay lúc bốc câu.
   */
  key: KeySignature;
}

/** Khoá nhận dạng một phần câu hỏi, để so xem hai câu có trùng nhau không. */
function partKey(part: DrillPart): string {
  return `${part.clef}:${part.note.midi}`;
}

/**
 * Hoá biểu — mấy dấu thăng giáng đứng ngay sau khoá nhạc.
 *
 * **Vì sao phải có, thay vì dán dấu hoá cạnh từng nốt:** bản nhạc thật không viết
 * thế. Giọng Sol trưởng ghi một dấu thăng ở đầu khuông, rồi mọi nốt Pha trong bài
 * đều là Pha thăng mà không có dấu nào bên cạnh. Đọc được điều đó là một kỹ năng
 * riêng, và là kỹ năng người học sẽ cần ngay khi mở một bản nhạc bất kỳ.
 *
 * Bảy giọng dưới đây đủ dùng cho Giai đoạn 1-2: từ không dấu tới ba dấu mỗi bên.
 * Thứ tự dấu thăng là Pha-Đô-Sol-Rê, thứ tự dấu giáng là Si-Mi-La-Rê.
 */
export interface KeySignature {
  id: string;
  /** Giá trị cho dòng `K:` của ABC. */
  abc: string;
  label: string;
  /** Chữ cái nào bị hoá sẵn, và hoá lên hay xuống. */
  alter: Record<string, number>;
  /** Giọng thăng hay giọng giáng — quyết cách viết nốt hoá bất thường. */
  prefersSharp: boolean;
  /**
   * Cách viết riêng cho từng phím đen, khi `prefersSharp` là chưa đủ.
   *
   * Giọng Đô trưởng không nghiêng về bên nào, nhưng giáo trình sơ cấp vẫn có
   * thói quen: **thăng cho Đô, Pha, Sol; giáng cho Mi, Si**. Đó là cách năm phím
   * đen hay được gọi tên nhất khi chưa nói tới giọng nào.
   */
  chromatic?: Record<number, 1 | -1>;
}

export const KEY_SIGNATURES: KeySignature[] = [
  {
    id: 'C',
    abc: 'C',
    label: 'Đô trưởng — không dấu',
    alter: {},
    prefersSharp: true,
    chromatic: { 1: 1, 3: -1, 6: 1, 8: 1, 10: -1 },
  },
  { id: 'G', abc: 'G', label: 'Sol trưởng — 1 thăng', alter: { F: 1 }, prefersSharp: true },
  { id: 'D', abc: 'D', label: 'Rê trưởng — 2 thăng', alter: { F: 1, C: 1 }, prefersSharp: true },
  { id: 'A', abc: 'A', label: 'La trưởng — 3 thăng', alter: { F: 1, C: 1, G: 1 }, prefersSharp: true },
  { id: 'F', abc: 'F', label: 'Pha trưởng — 1 giáng', alter: { B: -1 }, prefersSharp: false },
  { id: 'Bb', abc: 'Bb', label: 'Si giáng trưởng — 2 giáng', alter: { B: -1, E: -1 }, prefersSharp: false },
  { id: 'Eb', abc: 'Eb', label: 'Mi giáng trưởng — 3 giáng', alter: { B: -1, E: -1, A: -1 }, prefersSharp: false },
];

export function findKey(id: string): KeySignature {
  return KEY_SIGNATURES.find((k) => k.id === id) ?? KEY_SIGNATURES[0];
}

/** Những giọng câu hỏi được phép bốc trúng, theo lựa chọn đang bật. */
export function keysForOptions(options: DrillOptions): KeySignature[] {
  return options.randomKeys ? KEY_SIGNATURES : [KEY_SIGNATURES[0]];
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_NAME: Record<string, string> = {
  C: 'Đô', D: 'Rê', E: 'Mi', F: 'Pha', G: 'Sol', A: 'La', B: 'Si',
};

/** Phím đen: đúng năm cái trong mỗi quãng tám. */
export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

/** Dấu quãng tám của ABC, bám theo CHỮ CÁI chứ không theo phím. */
function abcLetter(letter: string, octave: number): string {
  let out = octave >= 5 ? letter.toLowerCase() : letter;
  if (octave >= 6) out += "'".repeat(octave - 5);
  if (octave <= 3) out += ','.repeat(4 - octave);
  return out;
}

/**
 * Dựng một nốt từ số MIDI, viết theo hoá biểu đang dùng.
 *
 * Thứ tự ưu tiên khi chọn cách viết — đúng thứ tự một người chép nhạc nghĩ:
 *
 * 1. **Nốt đã nằm sẵn trong hoá biểu** thì viết trơn, không dấu gì bên cạnh. Đây
 *    là cả điểm của hoá biểu: giọng Sol trưởng thì mọi nốt Pha là Pha thăng.
 * 2. **Nốt trắng mà hoá biểu có hoá chữ cái đó** thì phải ghi **dấu bình** — ví
 *    dụ Pha thường trong giọng Sol trưởng viết là `=F`.
 * 3. Còn lại là nốt hoá bất thường: giọng thăng viết dấu thăng, giọng giáng viết
 *    dấu giáng. Chép nhạc thật cũng theo thói quen đó.
 *
 * Chỗ dễ sai: **dấu quãng tám bám theo chữ cái, không theo phím.** Si giáng quãng
 * 3 viết là `_B,` — dấu phẩy thuộc về chữ B.
 */
export function noteAt(midi: number, key: KeySignature = KEY_SIGNATURES[0]): DrillNote {
  const pitchClass = ((midi % 12) + 12) % 12;

  /** Mọi cách viết ra đúng phím này, kèm thứ hạng ưu tiên — nhỏ hơn là hợp hơn. */
  const cachViet = LETTERS.flatMap((letter) => [0, 1, -1].map((alter) => {
    if ((LETTER_SEMITONE[letter] + alter + 12) % 12 !== pitchClass) return null;
    const cuaGiong = key.alter[letter] ?? 0;
    if (alter === cuaGiong) return { letter, alter, hang: 0 };
    if (alter === 0) return { letter, alter, hang: 1 };
    const quenViet = key.chromatic?.[pitchClass] ?? (key.prefersSharp ? 1 : -1);
    if (alter === quenViet) return { letter, alter, hang: 2 };
    return { letter, alter, hang: 3 };
  })).filter((c) => c !== null);

  const chon = cachViet.sort((a, b) => a.hang - b.hang)[0];
  const cuaGiong = key.alter[chon.letter] ?? 0;

  /*
   * Quãng tám tính theo CHỮ CÁI, không tính thẳng từ số MIDI. Si giáng quãng 3
   * mang số MIDI 58; lấy 58 chia ra thì vẫn ra quãng 3, nhưng trừ đi dấu giáng
   * trước rồi mới chia mới đúng với mọi trường hợp.
   */
  const octave = Math.floor((midi - chon.alter) / 12) - 1;

  /*
   * Dấu viết cạnh nốt. Nốt đã nằm trong hoá biểu thì KHÔNG có dấu nào — đó là cả
   * điểm của hoá biểu. Nốt trắng mà hoá biểu có hoá chữ cái đó thì phải ghi dấu
   * bình, không thì người đọc vẫn hiểu là nốt đã hoá.
   */
  const dauCanhNot = chon.alter === cuaGiong ? ''
    : chon.alter === 1 ? '^'
      : chon.alter === -1 ? '_'
        : '=';

  const ten = chon.alter === 1 ? `${LETTER_NAME[chon.letter]} thăng`
    : chon.alter === -1 ? `${LETTER_NAME[chon.letter]} giáng`
      : LETTER_NAME[chon.letter];
  const kyHieu = chon.alter === 1 ? `${chon.letter}♯`
    : chon.alter === -1 ? `${chon.letter}♭`
      : chon.letter;

  return {
    midi,
    abc: dauCanhNot + abcLetter(chon.letter, octave),
    name: ten,
    scientific: `${kyHieu}${octave}`,
  };
}

/**
 * Quãng tám nào đọc được ở khóa nào.
 *
 * Không phải cấm đoán vô cớ: Đô quãng 6 viết ở khóa Pha phải kẻ bảy dòng kẻ phụ,
 * còn Đô quãng 1 ở khóa Sol cũng vậy. Người học tập đọc nốt chứ không tập đếm
 * dòng kẻ phụ, nên quãng nào khóa đó không đọc nổi thì ẩn hẳn khỏi bàn phím chọn.
 *
 * **Hai quãng rìa đàn (1 và 7) cũng bỏ luôn**, kể cả ở khóa đọc được chúng: Si
 * quãng 7 phải kẻ chín dòng kẻ phụ, vẽ ra cao gấp rưỡi khuông nhạc nên hoặc bị
 * cắt hoặc phải thu nhỏ — mà thu nhỏ thì kích thước chữ nhạc lại nhảy mỗi câu
 * một kiểu, đúng cái vừa sửa xong. Chúng vẫn hiện trên hình bàn phím, chỉ là
 * không chọn được.
 *
 * Quãng 4 — quãng của Đô giữa — thuộc về cả hai khóa, đúng như trên bản nhạc thật.
 */
export const OCTAVES_BY_CLEF: Record<ClefName, number[]> = {
  treble: [4, 5, 6],
  bass: [2, 3, 4],
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
  /**
   * Có đưa **nốt hoá bất thường** vào không — phím đen nằm ngoài hoá biểu, viết
   * dấu ngay cạnh nốt như bản nhạc thật vẫn làm.
   */
  accidentals: boolean;
  /**
   * Mỗi câu một hoá biểu khác, bốc ngẫu nhiên trong `KEY_SIGNATURES`.
   *
   * **Vì sao ngẫu nhiên chứ không cho chọn một giọng rồi giữ nguyên:** chọn cố
   * định thì sau vài câu người học thuộc lòng "bài này đang Sol trưởng" và thôi
   * không nhìn đầu khuông nữa — mà nhìn hoá biểu rồi nhớ nó chính là kỹ năng cần
   * rèn. Mở một bản nhạc lạ cũng vậy: giọng gì là phải tự đọc ra.
   *
   * Tắt thì mọi câu là Đô trưởng, không dấu nào ở đầu khuông.
   */
  randomKeys: boolean;
  /**
   * Mỗi câu hỏi mấy nốt. Chỉ có nghĩa khi tập cả hai tay.
   *
   * - `one` — một nốt, nằm ở khuông nào thì đọc khuông đó.
   * - `both` — hai nốt cùng lúc, mỗi khuông một nốt; phải bấm đủ cả hai mới xong.
   * - `mixed` — khi một khi hai, không đoán trước được. Đây là kiểu sát bản nhạc
   *   thật nhất: có chỗ chỉ một tay đánh, có chỗ hai tay cùng đánh.
   */
  notesPerQuestion: NotesPerQuestion;
  /**
   * Mỗi khuông tối đa mấy nốt — bấm chồng lên nhau như hợp âm.
   *
   * 1 là mỗi khuông một nốt như cũ. Từ 2 trở lên thì mỗi câu bốc ngẫu nhiên từ
   * một tới chừng này nốt cho mỗi khuông, nên bài có lúc dễ lúc khó chứ không
   * phải câu nào cũng đủ chồng — đọc bản nhạc thật cũng thế.
   */
  maxPerStaff: number;
}

export type NotesPerQuestion = 'one' | 'both' | 'mixed';

/** Trần số nốt mỗi khuông. Bốn nốt là chồng tối đa một bàn tay với tới được. */
export const MAX_PER_STAFF = 4;

/** Nốt cao nhất của thế tay 5 ngón, tính từ nốt Đô của quãng: Đô-Rê-Mi-Pha-Sol. */
const FIVE_FINGER_SEMITONES = 7;

export const DEFAULT_OPTIONS: DrillOptions = {
  hands: 'right',
  octaves: [4],
  fiveFinger: true,
  accidentals: false,
  notesPerQuestion: 'one',
  maxPerStaff: 1,
  randomKeys: false,
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
export function notePoolForOptions(options: DrillOptions, key?: KeySignature): DrillPart[] {
  /*
   * Không truyền giọng thì gộp kho của MỌI giọng đang bật, bỏ trùng theo phím.
   * Đây là cái màn hình cần: "đang tập bao nhiêu nốt" và vùng bôi trên hình đàn
   * nói về cả buổi tập, mà cả buổi thì người học gặp hết các giọng. Lúc bốc câu
   * thì ngược lại — phải là kho của đúng một giọng, không thì cùng một câu có nốt
   * viết theo giọng này, nốt viết theo giọng kia.
   */
  const keys = key ? [key] : keysForOptions(options);
  const seen = new Set<string>();
  const out: DrillPart[] = [];

  for (const giong of keys) {
    for (const clef of clefsFor(options.hands)) {
      for (const octave of [...options.octaves].sort((a, b) => a - b)) {
        if (!OCTAVES_BY_CLEF[clef].includes(octave)) continue;
        const first = (octave + 1) * 12;
        const last = first + (options.fiveFinger ? FIVE_FINGER_SEMITONES : 11);
        for (let midi = first; midi <= last; midi++) {
          const note = noteAt(midi, giong);
          /*
           * Lọc theo CÁCH VIẾT chứ không theo phím trắng đen. Trong giọng Sol
           * trưởng, Pha thăng là nốt bình thường của giọng — nó nằm trong hoá
           * biểu, viết trơn không dấu, nên phải có mặt kể cả khi người học tắt
           * nốt hoá bất thường. Ngược lại, Pha thường trong giọng đó lại là nốt
           * hoá bất thường (phải ghi dấu bình), dù nó là phím trắng.
           */
          const laHoaBatThuong = note.abc.startsWith('^') || note.abc.startsWith('_') || note.abc.startsWith('=');
          if (!options.accidentals && laHoaBatThuong) continue;
          const daCo = `${clef}:${midi}`;
          if (seen.has(daCo)) continue;
          seen.add(daCo);
          out.push({ note, clef });
        }
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
  const key = question.key;

  /*
   * Nhiều nốt cùng khuông gom vào một cặp ngoặc vuông — cú pháp hợp âm của ABC.
   * Xếp từ thấp lên cao cho giống cách bản nhạc thật viết chồng nốt.
   */
  const noteOn = (clef: ClefName) => {
    const cua = question.parts
      .filter((p) => p.clef === clef)
      .sort((a, b) => a.note.midi - b.note.midi);
    if (cua.length === 0) return 'x';
    if (cua.length === 1) return cua[0].note.abc;
    return `[${cua.map((p) => p.note.abc).join('')}]`;
  };

  if (!grandStaff) {
    const clef = question.parts[0].clef;
    return [...head, `K:${key.abc} clef=${clef}`, noteOn(clef)].join('\n');
  }

  return [
    ...head,
    '%%staves {1 2}',
    `K:${key.abc}`,
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

/** Khoảng với tới của một bàn tay, tính bằng nửa cung: đúng một quãng tám. */
const HAND_SPAN = 12;
/** Hai nốt trong cùng một chồng phải cách nhau ít nhất chừng này nửa cung. */
const MIN_GAP = 2;

/**
 * Bốc một chồng nốt cho **một khuông**, tối đa `limit` nốt.
 *
 * Hai luật, và cả hai đều là chuyện bàn tay chứ không phải chuyện hoà thanh:
 *
 * - **Không quá một quãng tám** từ nốt thấp nhất tới nốt cao nhất. Rộng hơn thì
 *   một bàn tay không với tới, mà bài này là để bấm chứ không phải để ngắm.
 * - **Không có hai nốt cách nhau một nửa cung.** Chồng kiểu đó nghe như đặt nhầm
 *   tay và nhìn cũng không giống bản nhạc thật; tránh đi thì cái còn lại đều là
 *   những chồng gặp được trong bài thật.
 *
 * Không đủ nốt hợp lệ thì trả về ít hơn `limit` — thà chồng hai nốt còn hơn
 * không ra câu nào.
 */
function pickStack(
  list: DrillPart[],
  limit: number,
  avoid: Set<string>,
  random: () => number,
): DrillPart[] {
  const first = pickPart(list, avoid, random);
  if (limit <= 1) return [first];

  const stack = [first];
  const muon = 1 + Math.floor(random() * limit) % limit;

  while (stack.length < muon) {
    const hopLe = list.filter((p) => {
      if (stack.some((c) => c.note.midi === p.note.midi)) return false;
      if (stack.some((c) => Math.abs(c.note.midi - p.note.midi) < MIN_GAP)) return false;
      const lows = [...stack.map((c) => c.note.midi), p.note.midi];
      return Math.max(...lows) - Math.min(...lows) <= HAND_SPAN;
    });
    if (hopLe.length === 0) break;
    stack.push(hopLe[Math.floor(random() * hopLe.length) % hopLe.length]);
  }

  return stack.sort((a, b) => a.note.midi - b.note.midi);
}

/**
 * Chọn câu hỏi kế tiếp, tránh lặp lại ngay câu vừa rồi.
 *
 * Câu hỏi gồm **hoá biểu và mấy nốt viết theo đúng hoá biểu đó**. Bật
 * `randomKeys` thì mỗi câu một giọng khác, né giọng của câu vừa rồi.
 *
 * Số nốt mỗi câu do `options.notesPerQuestion` quyết, nhưng **luôn có đường lùi**:
 * đòi hai nốt mà kho chỉ có một khóa (đang tập một tay, hoặc quãng đã chọn chỉ
 * đọc được ở một khóa) thì ra câu một nốt, chứ không trả về câu rỗng.
 *
 * `random` tách ra thành tham số để kiểm thử được.
 */
export function pickNextQuestion(
  options: DrillOptions,
  previous: DrillQuestion | null,
  random: () => number = Math.random,
): DrillQuestion | null {
  /*
   * Giọng bốc trước, kho nốt dựng sau — vì cách viết của từng nốt phụ thuộc vào
   * giọng. Giọng nào dựng ra kho rỗng thì thử giọng kế tiếp, thà đổi giọng còn
   * hơn không có câu nào để hỏi.
   */
  for (const key of thuTuGiong(options, previous, random)) {
    const pool = notePoolForOptions(options, key);
    if (pool.length === 0) continue;
    return { key, parts: bocNot(pool, previous, options, random) };
  }
  return null;
}

/**
 * Thứ tự thử các giọng: giọng bốc trúng đứng đầu, còn lại là đường lùi.
 *
 * **Né giọng của câu vừa rồi** khi còn giọng khác để chọn. Bốc trúng lại chính
 * nó thì người học tưởng hoá biểu đứng yên và thôi không nhìn đầu khuông nữa —
 * mà nhìn hoá biểu mới là việc cần rèn.
 */
function thuTuGiong(
  options: DrillOptions,
  previous: DrillQuestion | null,
  random: () => number,
): KeySignature[] {
  const all = keysForOptions(options);
  if (all.length === 1) return all;
  const khac = previous ? all.filter((k) => k.id !== previous.key.id) : all;
  const list = khac.length > 0 ? khac : all;
  const chon = list[Math.floor(random() * list.length) % list.length];
  return [chon, ...all.filter((k) => k !== chon)];
}

/** Bốc phần nốt của câu hỏi trong kho của MỘT giọng. */
function bocNot(
  pool: DrillPart[],
  previous: DrillQuestion | null,
  options: DrillOptions,
  random: () => number,
): DrillPart[] {
  const avoid = new Set((previous?.parts ?? []).map(partKey));
  const limit = Math.max(1, Math.min(MAX_PER_STAFF, options.maxPerStaff));

  const muonHai = options.notesPerQuestion === 'both'
    || (options.notesPerQuestion === 'mixed' && random() < 0.5);

  if (muonHai) {
    const treble = pool.filter((p) => p.clef === 'treble');
    const bass = pool.filter((p) => p.clef === 'bass');
    if (treble.length > 0 && bass.length > 0) {
      return [
        ...pickStack(treble, limit, avoid, random),
        ...pickStack(bass, limit, avoid, random),
      ];
    }
  }

  /*
   * Một khuông thôi: chồng nốt phải nằm trong CÙNG một khuông, không thì nó
   * thành câu hai khuông trá hình. Bốc khuông trước rồi mới bốc nốt trong đó.
   */
  const first = pickPart(pool, avoid, random);
  const cungKhuong = pool.filter((p) => p.clef === first.clef);
  return pickStack(cungKhuong, limit, avoid, random);
}

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
