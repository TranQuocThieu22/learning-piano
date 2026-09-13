import { noteAt } from './midi-notes';
import { isBlackPitch } from './pitch';

/**
 * Sinh bài tập ôn luyện cho Chương 1-5, bằng LUẬT chứ không bằng kho nhạc.
 *
 * **Vì sao phải tự sinh.** Đã đi tìm kho nhạc cổ điển miễn phí cho tầm này và
 * không có: thế tay 5 ngón một vị trí là phát minh của sách phương pháp hiện
 * đại, còn nhạc cổ điển thật bắt đầu từ chỗ hai tay đi khắp bàn phím. Kho
 * Mutopia có 324 nhạc sĩ nhưng bản dễ nhất — Czerny op. 821 "bài tập 8 ô nhịp"
 * — đã chạy từ Đô3 tới La6 với nốt móc kép. Các sách vỡ lòng đúng tầm (Beyer,
 * Köhler, Le Couppey) thì không có trong kho nào lấy được. Xem
 * `docs/_internal/ban-quyen-bai-hat.md`.
 *
 * **Vì sao sinh bằng luật chứ không nhờ AI sáng tác.** Bài tập ở đây không cần
 * hay, nó cần **đúng ràng buộc**: đúng tầm nốt của chương, đúng hình nốt đã
 * dạy, đủ phách mỗi ô nhịp. Luật thì kiểm được bằng test; nhạc do AI sinh thì
 * phải nghe từng bài, lại không có quyền tác giả nên ai chép cũng được.
 *
 * **Ba điều làm nên chất lượng bài tập, không phải sự ngẫu nhiên:**
 *
 * 1. **Đi liền bậc là chính, nhảy quãng là gia vị.** Bốc nốt hoàn toàn ngẫu
 *    nhiên thì ra một chuỗi nhảy lung tung, tay người mới không bấm nổi mà tai
 *    cũng không thấy giống nhạc.
 * 2. **Có hình, có kết.** Mỗi bài kết ở nốt Đô và ô cuối dài hơn — tai người
 *    học nghe ra "hết bài", chứ không phải bị cắt ngang.
 * 3. **Lặp lại có biến.** Ô nhịp thứ hai nhắc lại hình của ô thứ nhất ở cao độ
 *    khác. Đó là cách mọi bài hát thật được dựng, và cũng là thứ khiến bài tập
 *    nhớ được.
 *
 * Sinh ra **luôn giống nhau với cùng một số `seed`** — phải vậy thì trang mới
 * dựng được ở máy chủ mà không lệch với máy người học, và người soạn bài mới
 * gắn được một bài tập cố định vào một bài học.
 */

/** Đô giữa. Mọi con số trong file này tính bằng MIDI. */
const C4 = 60;
const C3 = 48;

export type HandName = 'right' | 'left';

/**
 * Một nốt trong bài tập. `midi` là `null` thì đó là dấu lặng.
 * `beats` tính bằng phách của nhịp 4/4 — 1 là nốt đen, 2 nốt trắng, 4 nốt tròn.
 */
export interface ExerciseNote {
  midi: number | null;
  beats: number;
  /**
   * Nốt này là phím đen nhưng **không ghi dấu hoá**, vì đã có một nốt cùng tên
   * mang dấu đứng trước nó trong cùng ô nhịp. Đây chính là luật Chương 4 đang
   * dạy — xem `themPhimDen`.
   */
  keoDauHoa?: boolean;
}

export type Bar = ExerciseNote[];

export interface ChapterRule {
  chapter: number;
  /** Nốt tay phải được phép, thấp tới cao. */
  right: number[];
  /** Nốt tay trái được phép. */
  left: number[];
  /** Hình nốt được phép, tính bằng phách. */
  beats: number[];
  /** Chương này đã dạy đánh hai tay cùng lúc chưa. */
  bothHands: boolean;
  /** Phím đen được phép chen vào chưa. */
  accidentals: boolean;
  /** Ký hiệu diễn tả được phép ghi lên bài. */
  marks: ('legato' | 'staccato' | 'dynamics')[];
}

/**
 * Luật của từng chương — **thêm chương mới là thêm một dòng ở đây**, không phải
 * thêm một nhánh `if` ở dưới.
 *
 * Tầm nốt chép đúng `RANGE_5_FINGER` trong `scripts/check-lessons.mjs`: tay phải
 * Đô4-Sol4, tay trái Đô3-Sol3. Lệch khỏi đó là bộ kiểm giáo trình báo đỏ, và nó
 * báo đúng — Chương 6 mới là chương dạy đi quá thế tay 5 ngón.
 */
const FIVE_FINGER_RIGHT = [0, 2, 4, 5, 7].map((s) => C4 + s);
const FIVE_FINGER_LEFT = [0, 2, 4, 5, 7].map((s) => C3 + s);

export const CHAPTER_RULES: ChapterRule[] = [
  {
    chapter: 1,
    right: FIVE_FINGER_RIGHT,
    left: FIVE_FINGER_LEFT,
    // Chương 1 chỉ đếm "một phím một nhịp"; hình nốt là bài của Chương 2.
    beats: [1],
    bothHands: false,
    accidentals: false,
    marks: [],
  },
  {
    chapter: 2,
    right: FIVE_FINGER_RIGHT,
    left: FIVE_FINGER_LEFT,
    beats: [1, 2, 4],
    bothHands: true,
    accidentals: false,
    marks: [],
  },
  {
    chapter: 3,
    right: FIVE_FINGER_RIGHT,
    left: FIVE_FINGER_LEFT,
    beats: [1, 2, 4],
    bothHands: true,
    accidentals: false,
    marks: [],
  },
  {
    chapter: 4,
    right: FIVE_FINGER_RIGHT,
    left: FIVE_FINGER_LEFT,
    beats: [1, 2, 4],
    bothHands: true,
    // Chương 4 là chương phím đen. Chỉ chen một nốt hoá mỗi bài — xem `themPhimDen`.
    accidentals: true,
    marks: [],
  },
  {
    chapter: 5,
    right: FIVE_FINGER_RIGHT,
    left: FIVE_FINGER_LEFT,
    beats: [1, 2, 4],
    bothHands: true,
    accidentals: true,
    marks: ['legato', 'staccato', 'dynamics'],
  },
];

export function ruleForChapter(chapter: number): ChapterRule {
  const rule = CHAPTER_RULES.find((r) => r.chapter === chapter);
  if (!rule) {
    throw new ExerciseGenError(
      `chưa có luật cho Chương ${chapter} — bộ sinh này chỉ làm Chương 1-5`,
    );
  }
  return rule;
}

export class ExerciseGenError extends Error {}

/**
 * Bộ bốc số có hạt giống.
 *
 * Dùng mulberry32: ngắn, không cần thư viện, và **cùng một hạt giống thì cùng
 * một kết quả trên mọi máy** — điều kiện bắt buộc để trang dựng ở máy chủ không
 * lệch với trang vẽ ở máy người học.
 */
function taoBocSo(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type BocSo = () => number;

const bocMot = <T>(rng: BocSo, list: T[]): T => list[Math.floor(rng() * list.length)];

/**
 * Dựng một câu đi liền bậc, thỉnh thoảng nhảy một bậc.
 *
 * Đây là chỗ quyết định bài tập nghe được hay nghe như bốc thăm: **đi liền bậc
 * là chính**. Tỉ lệ nhảy quãng để thấp vì tay người mới còn phải nhìn xuống mới
 * bấm trúng, mà mỗi lần nhảy là một lần phải nhìn.
 *
 * Trả về **số thứ tự bậc trong thang**, không trả về số MIDI: nhắc lại một hình
 * ở cao độ khác chỉ là cộng thêm vào số thứ tự, còn làm trên MIDI thì phải tự dò
 * xem nốt mới có nằm trong thang không.
 */
function cauLienBac(rng: BocSo, size: number, soNot: number, batDau = 0): number[] {
  const out = [batDau];
  let i = batDau;
  for (let n = 1; n < soNot; n += 1) {
    const nhay = rng() < 0.25 ? 2 : 1;
    const len = rng() < 0.5;
    let j = i + (len ? nhay : -nhay);
    // Chạm mép thì quay đầu, không kẹp cứng — kẹp thì ra hai nốt giống nhau.
    if (j < 0 || j >= size) j = i - (len ? nhay : -nhay);
    if (j < 0 || j >= size) j = i;
    out.push(j);
    i = j;
  }
  return out;
}

/**
 * Ba ô nhịp có hình: **nêu — nhắc lại ở cao độ khác — quay về**.
 *
 * Bản đầu bốc liền một mạch mười hai nốt và ra thứ như `Đô Rê Đô Mi | Rê Mi Đô
 * Rê | Pha Mi Sol Pha` — đúng luật nhưng đi lang thang, không có hình nào để
 * nhớ. Mọi bài tập của Czerny hay Burgmüller đều dựng theo lối này, và nó cũng
 * là lý do người học thuộc bài sau vài lần chứ không phải đọc lại từ đầu mỗi lần.
 *
 * Ô cuối kết ở bậc thứ hai (nốt Rê) để bước xuống nốt Đô của ô kết — tai nghe ra
 * "về nhà" thay vì bị cắt ngang.
 */
function cauBaO(rng: BocSo, size: number): number[] {
  const hinh = cauLienBac(rng, size, 4, Math.floor(rng() * 2));
  // Nhắc lại ở cao độ khác, đi lên nếu còn chỗ, không thì đi xuống.
  const cao = Math.max(...hinh);
  const doi = cao + 1 < size ? 1 : -1;
  const nhacLai = hinh.map((b) => b + doi);
  // Ô ba đi ngược hình đầu rồi dừng ở bậc hai, để bước xuống nốt Đô ở ô kết.
  const quayVe = [...hinh].reverse().slice(0, 3).concat(1);
  return [...hinh, ...nhacLai, ...quayVe];
}

/** Đổi số thứ tự bậc thành số MIDI theo thang của tay đang đánh. */
function theoThang(bac: number[], thang: number[]): number[] {
  return bac.map((b) => thang[Math.min(Math.max(b, 0), thang.length - 1)]);
}

/** Cắt một chuỗi nốt thành các ô nhịp 4/4, mỗi nốt một phách. */
function oNhipDen(notes: number[]): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < notes.length; i += 4) {
    bars.push(notes.slice(i, i + 4).map((midi) => ({ midi, beats: 1 })));
  }
  return bars;
}

/** Ô nhịp cuối: một nốt tròn ở nốt Đô, để tai nghe ra bài đã hết. */
function oKet(thang: number[]): Bar {
  return [{ midi: thang[0], beats: 4 }];
}

/**
 * Chữ cái + dấu quãng tám của một nốt khi VIẾT ra ABC, đã bỏ dấu hoá đi.
 *
 * Hỏi `noteAt` thay vì tự suy từ số MIDI, vì **cùng một phím có hai cách viết**:
 * phím 63 được viết `_E` chứ không phải `^D`. Bản đầu tự suy chữ cái bằng một
 * bảng riêng, ra chữ D, nên tưởng `_E` không đụng nốt Mi đứng sau nó trong cùng
 * ô nhịp — và bài tập Chương 4 vang ra Mi giáng ở chỗ bản nhạc vẽ nốt Mi trắng.
 */
function chuViet(midi: number): string {
  return noteAt(midi).abc.replace(/^[\^_=]+/, '');
}

/**
 * Chen phím đen vào câu, cho Chương 4.
 *
 * Nâng lên nửa cung chứ không hạ xuống, vì đàn nào cũng có phím đen ngay bên phải
 * bốn trong năm nốt của thế tay Đô.
 *
 * **Chọn chỗ đặt dấu hoá là toàn bộ cái khó của hàm này.** Chương 4 dạy "dấu hoá
 * có hiệu lực tới hết ô nhịp", nên bài tập phải bắt người học DÙNG tới luật đó,
 * mà không được phép vẽ ra một bản nhạc vang khác với thứ nó vẽ (bẫy 25 và 36).
 * Vì vậy ưu tiên theo hai bậc:
 *
 * 1. **Ô nhịp có cùng một nốt xuất hiện hai lần** — nâng cả hai lên, nhưng chỉ
 *    ghi dấu ở lần đầu. Lần thứ hai nhìn là nốt trắng mà vẫn phải bấm phím đen:
 *    đó đúng là luật chương này dạy, và người học chỉ đánh đúng nếu còn nhớ nó.
 * 2. Không có ô nào như vậy thì chen một nốt hoá lẻ, miễn là trong ô không còn
 *    nốt nào **viết cùng chữ cái** đứng sau nó. Bài lúc này chỉ có thêm màu phím
 *    đen chứ chưa dùng tới luật, nhưng thà vậy còn hơn đặt dấu bình — dấu bình là
 *    bài của phần sau trong chính chương này.
 *
 * Cả hai bậc đều so bằng **chữ cái đã viết của nốt sau khi nâng** (`chuViet(midi
 * + 1)`), không phải chữ của nốt gốc: nâng nốt Rê lên thì bản nhạc ghi `_E`, nên
 * nó đụng nốt Mi chứ không đụng nốt Rê. Đó là bẫy 36.
 */
function themPhimDen(rng: BocSo, bars: Bar[]): Bar[] {
  /** Mọi chỗ đặt được dấu hoá, kèm danh sách nốt phải nâng theo. */
  const dungDuoc = bars.flatMap((bar, b) => bar.map((_, n) => ({ b, n })))
    .map(({ b, n }) => {
      const note = bars[b][n];
      if (note.midi === null) return null;
      // Mi và Si không có phím đen ngay bên phải.
      if (!isBlackPitch(note.midi + 1)) return null;

      const sau = bars[b].slice(n + 1);
      // Phải còn nốt sau nó trong cùng ô: nốt hoá đứng cuối ô thì chỉ là một vệt
      // màu, không ai phải nhớ gì cả.
      if (sau.length === 0) return null;

      const chu = chuViet(note.midi + 1);
      /*
       * Trong ô KHÔNG ĐƯỢC có nốt nào viết cùng chữ cái đứng TRƯỚC nó.
       *
       * Nốt đứng trước không bị dấu hoá ảnh hưởng, nên máy vẫn phát đúng — nhưng
       * ô nhịp `E _E F E` bày ra cho người mới hai nốt nhìn y hệt là chữ E mà một
       * nốt bấm phím trắng, một nốt bấm phím đen. Người học Chương 4 chưa có gì để
       * gỡ chỗ đó ra, nên loại hẳn ô như vậy thay vì ghi dấu bình.
       */
      if (bars[b].slice(0, n).some((x) => x.midi !== null && chuViet(x.midi) === chu)) return null;
      // Nốt CÙNG CAO ĐỘ đứng sau: nâng theo, và để trống dấu hoá của nó.
      const theo = sau.flatMap((x, i) => (x.midi === note.midi ? [n + 1 + i] : []));
      // Nốt chỉ TRÙNG CHỮ CÁI mà khác cao độ: ô này phải loại hẳn, vì dấu hoá ăn
      // tới hết ô nhịp sẽ làm nốt ấy vang sai so với mặt giấy.
      const dung = sau.some((x, i) => !theo.includes(n + 1 + i)
        && x.midi !== null && chuViet(x.midi) === chu);
      if (dung) return null;

      return { b, n, theo };
    })
    .filter((c) => c !== null);
  if (dungDuoc.length === 0) return bars;

  // Ưu tiên bậc 1: chỗ có nốt cùng cao độ đứng sau để luật được dùng tới thật.
  const dayLuat = dungDuoc.filter((c) => c.theo.length > 0);
  const { b, n, theo } = bocMot(rng, dayLuat.length > 0 ? dayLuat : dungDuoc);
  const goc = bars[b][n].midi!;
  return bars.map((bar, i) => (i !== b ? bar : bar.map((note, j) => {
    if (j === n) return { ...note, midi: goc + 1 };
    if (theo.includes(j)) return { ...note, midi: goc + 1, keoDauHoa: true };
    return note;
  })));
}

export interface ExerciseKind {
  id: string;
  /** Tên hiện cho người học, trên tiêu đề bản nhạc. */
  label: string;
  /** Một câu nói bài này rèn cái gì. Hiện dưới bản nhạc. */
  hint: string;
  /** Chương sớm nhất tập được kiểu này. */
  from: number;
  /** Tay nào đánh. `both` cần chương đã dạy hai tay. */
  hands: HandName | 'both';
  build: (rng: BocSo, rule: ChapterRule) => { right: Bar[]; left: Bar[] };
}

/** Bốn ô nhịp nốt đen ở một tay, ô cuối là nốt tròn. */
function motTay(rng: BocSo, rule: ChapterRule, hand: HandName) {
  const thang = hand === 'right' ? rule.right : rule.left;
  const bars = [...oNhipDen(theoThang(cauBaO(rng, thang.length), thang)), oKet(thang)];
  const trong = bars.map(() => []);
  return hand === 'right' ? { right: bars, left: trong } : { right: trong, left: bars };
}

/**
 * Bảng kiểu bài tập — **thêm kiểu mới là thêm một dòng**, không sửa hàm nào.
 *
 * Mỗi kiểu rèn đúng một việc và nói thẳng việc đó ra ở `hint`. Bài tập không nói
 * mình rèn gì thì người học tập xong vẫn không biết mình vừa khá lên ở chỗ nào.
 */
export const EXERCISE_KINDS: ExerciseKind[] = [
  {
    id: 'tay-phai',
    label: 'Tay phải, năm nốt',
    hint: 'Đi liền bậc trong thế tay Đô. Đừng nhìn xuống tay — tìm phím bằng cảm giác.',
    from: 1,
    hands: 'right',
    build: (rng, rule) => motTay(rng, rule, 'right'),
  },
  {
    id: 'tay-trai',
    label: 'Tay trái, năm nốt',
    hint: 'Cùng hình dạng với bài tay phải, nhưng đọc ở khóa Pha.',
    from: 1,
    hands: 'left',
    build: (rng, rule) => motTay(rng, rule, 'left'),
  },
  {
    id: 'hinh-not',
    label: 'Trộn hình nốt',
    hint: 'Nốt đen, nốt trắng, nốt tròn trong cùng một bài. Đếm thành tiếng khi tập.',
    from: 2,
    hands: 'right',
    build: (rng, rule) => {
      const bars: Bar[] = [];
      for (let b = 0; b < 3; b += 1) {
        const bar: Bar = [];
        let conLai = 4;
        while (conLai > 0) {
          const duoc = rule.beats.filter((v) => v <= conLai);
          const beats = bocMot(rng, duoc);
          bar.push({ midi: 0, beats });
          conLai -= beats;
        }
        bars.push(bar);
      }
      // Điền cao độ sau, để phần tiết tấu và phần cao độ không giành nhau.
      const caoDo = theoThang(cauLienBac(rng, rule.right.length, bars.flat().length), rule.right);
      let k = 0;
      for (const bar of bars) for (const note of bar) { note.midi = caoDo[k]; k += 1; }
      return { right: [...bars, oKet(rule.right)], left: bars.map(() => []) };
    },
  },
  {
    id: 'hai-tay',
    label: 'Hai tay cùng lúc',
    hint: 'Tay phải đi, tay trái giữ một nốt dài. Đọc theo chiều dọc: nốt nào thẳng hàng thì bấm cùng lúc.',
    from: 2,
    hands: 'both',
    build: (rng, rule) => {
      const right = [...oNhipDen(theoThang(cauBaO(rng, rule.right.length), rule.right)), oKet(rule.right)];
      // Tay trái giữ nốt tròn: việc mới ở đây là hai tay cùng xuống, không phải
      // hai bè cùng chạy. Chạy cả hai là bài của giai đoạn sau.
      const left = right.map(() => [{ midi: rule.left[0], beats: 4 }]);
      return { right, left };
    },
  },
  {
    id: 'doi-dap',
    label: 'Hai tay thay phiên',
    hint: 'Mỗi tay một ô nhịp, đổi tay ở vạch nhịp. Mắt phải nhảy giữa hai khuông.',
    from: 3,
    hands: 'both',
    build: (rng, rule) => {
      const right: Bar[] = [];
      const left: Bar[] = [];
      for (let b = 0; b < 4; b += 1) {
        const tayPhai = b % 2 === 0;
        const thang = tayPhai ? rule.right : rule.left;
        const bar = oNhipDen(theoThang(cauLienBac(rng, thang.length, 4), thang))[0];
        right.push(tayPhai ? bar : []);
        left.push(tayPhai ? [] : bar);
      }
      right.push(oKet(rule.right));
      left.push([]);
      return { right, left };
    },
  },
  {
    id: 'phim-den',
    label: 'Có một phím đen',
    hint: 'Đúng một nốt được nâng lên nửa cung. Nhớ: dấu hoá có hiệu lực tới hết ô nhịp.',
    from: 4,
    hands: 'right',
    build: (rng, rule) => {
      const bars = oNhipDen(theoThang(cauBaO(rng, rule.right.length), rule.right));
      return { right: [...themPhimDen(rng, bars), oKet(rule.right)], left: bars.map(() => []) };
    },
  },
  {
    id: 'luyen-va-nay',
    label: 'Luyến và nảy',
    hint: 'Ô đầu đánh liền mạch, ô sau nảy gọn. Cùng nốt, khác hẳn cách chạm phím.',
    from: 5,
    hands: 'right',
    build: (rng, rule) => {
      const bars = oNhipDen(theoThang(cauBaO(rng, rule.right.length), rule.right).slice(0, 8));
      return { right: [...bars, oKet(rule.right)], left: bars.map(() => []) };
    },
  },
];

export function kindsForChapter(chapter: number): ExerciseKind[] {
  const rule = ruleForChapter(chapter);
  return EXERCISE_KINDS.filter((k) => (
    k.from <= chapter && (k.hands !== 'both' || rule.bothHands)
  ));
}

/**
 * Độ dài viết theo `L: 1/4` — nốt đen là 1, trắng là 2, tròn là 4.
 * Dấu lặng dùng `z`, cùng luật độ dài.
 */
function abcNote(note: ExerciseNote): string {
  const dai = note.beats === 1 ? '' : String(note.beats);
  if (note.midi === null) return `z${dai}`;
  // Dùng lại bộ đổi nốt của bài luyện nhận nốt: nó đã có test cho dấu hoá và
  // dấu quãng tám, hai chỗ sai là bản nhạc vẽ ra sai mà không ai báo.
  const abc = noteAt(note.midi).abc;
  return `${note.keoDauHoa ? abc.replace(/^[\^_=]+/, '') : abc}${dai}`;
}

/** Một ô nhịp rỗng của tay không đánh: nốt lặng cho đủ bốn phách. */
function abcBar(bar: Bar): string {
  return bar.length === 0 ? 'z4' : bar.map(abcNote).join(' ');
}

/**
 * Gắn ký hiệu diễn tả cho Chương 5.
 *
 * Chỉ gắn khi bài **có ít nhất hai ô nhạc thật**, và luôn theo cặp đối nhau —
 * một ô luyến, một ô nảy. Nghe hai cách chạm phím cạnh nhau mới thấy khác; ghi
 * mỗi dấu luyến lên cả bài thì người học không có gì để so.
 */
function themKyHieu(bars: string[], kind: ExerciseKind, rule: ChapterRule): string[] {
  if (kind.id !== 'luyen-va-nay' || !rule.marks.includes('legato')) return bars;
  return bars.map((bar, i) => {
    if (i === 0) return `!p! (${bar})`;
    if (i === 1) return `!f! ${bar.split(' ').map((n) => `.${n}`).join(' ')}`;
    return bar;
  });
}

export interface GeneratedExercise {
  /** Mã kiểu bài, để gắn cố định một bài tập vào một bài học. */
  kindId: string;
  title: string;
  hint: string;
  /** Chuỗi ABC hoàn chỉnh, vẽ được ngay bằng khối ```abc. */
  abc: string;
  /** Mọi nốt có trong bài, để test soi tầm nốt mà không phải đọc lại ABC. */
  midis: number[];
}

export interface GenerateOptions {
  chapter: number;
  /** Bỏ trống thì lấy kiểu đầu tiên hợp với chương. */
  kindId?: string;
  /** Cùng một số thì cùng một bài, trên mọi máy. */
  seed: number;
}

/**
 * Sinh một bài tập hoàn chỉnh.
 *
 * Trả về cả `midis` chứ không chỉ chuỗi ABC: test soi tầm nốt bằng danh sách đó,
 * khỏi phải phân tích lại chuỗi — mà phân tích lại chính là chỗ dễ sai nhất.
 */
export function generateExercise({ chapter, kindId, seed }: GenerateOptions): GeneratedExercise {
  const rule = ruleForChapter(chapter);
  const kinds = kindsForChapter(chapter);
  const kind = kindId ? kinds.find((k) => k.id === kindId) : kinds[0];
  if (!kind) {
    throw new ExerciseGenError(
      `Chương ${chapter} không có kiểu bài "${kindId}" — các kiểu dùng được: ${kinds.map((k) => k.id).join(', ')}`,
    );
  }

  const rng = taoBocSo(seed);
  const { right, left } = kind.build(rng, rule);
  /*
   * Kiểu khuông do BẢNG KIỂU BÀI quyết, không suy từ dữ liệu.
   *
   * Bản đầu suy bằng "tay trái có ô nhạc nào không" và ra sai ngay: bài một tay
   * trái cũng có ô nhạc ở tay trái, nên nó dựng khuông đôi với khuông Sol trống
   * trơn. Test bắt được, nhưng cái sai gốc là hỏi dữ liệu một câu mà chỉ bảng
   * kiểu bài trả lời được.
   */
  const haiKhuong = kind.hands === 'both';

  const rightAbc = themKyHieu(right.map(abcBar), kind, rule);
  const leftAbc = left.map(abcBar);

  const dau = [
    `X: ${seed % 1000}`,
    `T: Chương ${chapter} - ${kind.label}`,
    'M: 4/4',
    'L: 1/4',
  ];

  const abc = haiKhuong
    ? [
      ...dau,
      '%%score { 1 | 2 }',
      'K: C',
      'V:1 clef=treble',
      'V:2 clef=bass',
      `[V:1] ${rightAbc.join(' | ')} |]`,
      `[V:2] ${leftAbc.join(' | ')} |]`,
    ].join('\n')
    : [
      ...dau,
      'K: C',
      ...(kind.hands === 'left' ? ['V:1 clef=bass'] : []),
      `${(kind.hands === 'left' ? leftAbc : rightAbc).join(' | ')} |]`,
    ].join('\n');

  const midis = [...right, ...left].flat()
    .map((n) => n.midi)
    .filter((m): m is number => m !== null);

  return { kindId: kind.id, title: `Chương ${chapter} - ${kind.label}`, hint: kind.hint, abc, midis };
}
