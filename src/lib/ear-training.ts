/**
 * Luyện tai: app phát nốt, người học mò trên cây đàn thật cho tới khi trúng.
 *
 * **Vì sao có bài này.** Cả phần còn lại của app dạy đúng một chiều — **mắt →
 * tay**: nhìn nốt trên khuông rồi bấm phím. Không có gì dạy **tai → tay**. Với
 * người tự học không có thầy thì đó lại chính là thứ họ muốn làm được: nghe một
 * bài mình thích rồi mò ra nó trên đàn. Người học có thầy được rèn cái này mỗi
 * buổi; người tự học thì không ai rèn cho.
 *
 * **Cách rèn ở đây không phải "đoán tên nốt".** Người học ngồi sẵn trước cây đàn
 * thật, nên việc đúng phải làm là **mò**: bấm một phím, nghe xem mình đang ở trên
 * hay dưới nốt cần tìm, rồi đi tiếp. App chỉ trả lời **cao hơn / thấp hơn** —
 * đúng thứ một người thầy nói, và đúng thứ dạy ra cảm giác quãng. Nói thẳng tên
 * nốt là làm hộ toàn bộ phần cần rèn.
 *
 * Bốn luật chống áp lực của `AGENTS.md` áp nguyên: nghe lại bao nhiêu lần cũng
 * được, không đếm giờ, bấm trượt chỉ là một lời chỉ đường chứ không trừ gì, và
 * có nút bỏ qua khi kẹt.
 */

/** Nốt mẫu phát trước mỗi câu ở các mức dễ: Đô giữa (C4). */
export const REFERENCE_MIDI = 60;

/** Nốt cao nhất của thế tay 5 ngón, tính từ nốt Đô của quãng: Đô-Rê-Mi-Pha-Sol. */
const FIVE_FINGER_SEMITONES = 7;

/** Hai nốt liền nhau trong một câu không cách nhau quá một quãng tám. */
const MAX_LEAP = 12;

/** Phím đen: đúng năm cái trong mỗi quãng tám. */
function isBlack(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export interface EarOptions {
  /** Mấy nốt mỗi câu. Nhiều hơn một thì phải đánh lại ĐÚNG THỨ TỰ. */
  noteCount: number;
  /** Những quãng tám được bốc. Nhiều quãng thì nốt nhảy xa hơn. */
  octaves: number[];
  /** Chỉ năm nốt Đô–Sol của mỗi quãng, thế tay 5 ngón của Chương 1. */
  fiveFinger: boolean;
  /** Có bốc trúng phím đen không. */
  blackKeys: boolean;
  /**
   * Phát nốt Đô giữa làm mốc trước mỗi câu.
   *
   * Người mới chưa có mốc nào trong đầu thì nghe một nốt trơ trọi là vô nghĩa.
   * Tắt đi ở mức khó vì người học lúc đó tự tìm mốc được — bấm đại một phím
   * trên chính cây đàn của mình cũng là một mốc.
   */
  reference: boolean;
}

export interface EarPreset {
  id: string;
  label: string;
  hint: string;
  options: EarOptions;
}

/**
 * Bốn mức, cùng lối với bài luyện nhận nốt: mỗi bậc chỉ thêm hai tới ba thứ.
 *
 * Trục khó ở đây khác bài nhận nốt — không phải đọc ký hiệu mà là **giữ được âm
 * thanh trong đầu**: thêm một nốt phải nhớ là khó hơn hẳn thêm một quãng.
 */
export const EAR_PRESETS: EarPreset[] = [
  {
    id: 'de',
    label: 'Dễ',
    hint: 'Một nốt trong năm nốt Đô–Sol, có phát nốt Đô làm mốc trước. Mò trên đàn tới khi trúng — app chỉ nói cao hơn hay thấp hơn.',
    options: {
      noteCount: 1,
      octaves: [4],
      fiveFinger: true,
      blackKeys: false,
      reference: true,
    },
  },
  {
    id: 'trung-binh',
    label: 'Trung bình',
    hint: 'Một nốt trong trọn bảy nốt Đô–Si, vẫn có nốt Đô làm mốc. Tầm rộng gấp rưỡi nên phải nghe kỹ hơn mới đoán được hướng.',
    options: {
      noteCount: 1,
      octaves: [4],
      fiveFinger: false,
      blackKeys: false,
      reference: true,
    },
  },
  {
    id: 'kho',
    label: 'Khó',
    hint: 'Hai nốt liên tiếp, phải đánh lại đúng thứ tự, và không còn nốt mốc. Đây là lúc bắt đầu giống việc mò một câu nhạc thật.',
    options: {
      noteCount: 2,
      octaves: [3, 4],
      fiveFinger: false,
      blackKeys: false,
      reference: false,
    },
  },
  {
    id: 'rat-kho',
    label: 'Rất khó',
    hint: 'Ba nốt liên tiếp, có cả phím đen, trải ba quãng. Nhớ được ba nốt rồi mò lại đủ cả ba là đã mò được phần lớn câu nhạc thường gặp.',
    options: {
      noteCount: 3,
      octaves: [3, 4, 5],
      fiveFinger: false,
      blackKeys: true,
      reference: false,
    },
  },
];

/** Mặc định là mức Dễ. Trỏ thẳng vào bảng mức, không chép lại giá trị. */
export const DEFAULT_EAR_OPTIONS: EarOptions = EAR_PRESETS[0].options;

/** Lựa chọn hiện tại khớp mức nào, `null` nếu không khớp mức nào. */
export function earPresetOf(options: EarOptions): EarPreset | null {
  return EAR_PRESETS.find((p) => sameOptions(p.options, options)) ?? null;
}

function sameOptions(a: EarOptions, b: EarOptions): boolean {
  const quang = (o: EarOptions) => [...o.octaves].sort((x, y) => x - y).join(',');
  return a.noteCount === b.noteCount
    && quang(a) === quang(b)
    && a.fiveFinger === b.fiveFinger
    && a.blackKeys === b.blackKeys
    && a.reference === b.reference;
}

/** Những nốt được phép bốc trúng, thấp tới cao. */
export function earNotePool(options: EarOptions): number[] {
  const out: number[] = [];
  for (const octave of [...options.octaves].sort((a, b) => a - b)) {
    const first = (octave + 1) * 12;
    const last = first + (options.fiveFinger ? FIVE_FINGER_SEMITONES : 11);
    for (let midi = first; midi <= last; midi++) {
      if (!options.blackKeys && isBlack(midi)) continue;
      out.push(midi);
    }
  }
  return out;
}

/**
 * Bốc câu kế tiếp: một dãy nốt, đánh lại theo đúng thứ tự.
 *
 * Hai ràng buộc, cả hai đều để câu nghe ra được là một câu nhạc chứ không phải
 * một dãy số ngẫu nhiên:
 *
 * - **Hai nốt liền nhau không trùng nhau.** Trùng thì người học nghe ra một nốt
 *   ngân dài, không nghe ra hai nốt.
 * - **Không nhảy quá một quãng tám** giữa hai nốt liền nhau. Nhảy rộng hơn thì
 *   tai mất mốc hoàn toàn, mà bài này rèn cảm giác quãng chứ không rèn trí nhớ
 *   tuyệt đối.
 *
 * `random` tách ra thành tham số để kiểm thử được.
 */
export function pickEarQuestion(
  options: EarOptions,
  previous: number[] | null,
  random: () => number = Math.random
): number[] | null {
  const pool = earNotePool(options);
  if (pool.length === 0) return null;

  const soNot = Math.max(1, Math.round(options.noteCount));
  const notes: number[] = [];

  for (let i = 0; i < soNot; i++) {
    const truoc = notes.at(-1);
    /*
     * Nốt đầu né nốt đầu của câu vừa rồi; những nốt sau né chính nốt liền trước
     * và giữ trong tầm một quãng tám. Lọc ra rỗng thì lấy cả kho — thà hỏi lại
     * còn hơn trả về câu cụt.
     */
    const hopLe = pool.filter((m) => {
      if (truoc === undefined) return m !== previous?.[0];
      return m !== truoc && Math.abs(m - truoc) <= MAX_LEAP;
    });
    const list = hopLe.length > 0 ? hopLe : pool;
    notes.push(list[Math.floor(random() * list.length) % list.length]);
  }

  return notes;
}

export interface EarJudgement {
  correct: boolean;
  /**
   * Nốt cần tìm nằm **cao hơn** hay **thấp hơn** phím vừa bấm. `null` khi đã
   * trúng. Đây là toàn bộ phần app nói ra — tên nốt thì không, vì nói tên là làm
   * hộ đúng phần cần rèn.
   */
  direction: 'higher' | 'lower' | null;
  /** Bấm trúng tên nốt nhưng lệch quãng tám. Lỗi khác hẳn về bản chất, nói riêng. */
  sameNoteName: boolean;
  /** Cách nhau mấy nửa cung, để màn hình biết lúc nào nên nói "gần lắm rồi". */
  distance: number;
}

/** So phím vừa bấm với nốt đang cần tìm. */
export function judgeEar(target: number, played: number): EarJudgement {
  const distance = Math.abs(target - played);
  if (played === target) {
    return { correct: true, direction: null, sameNoteName: false, distance: 0 };
  }
  return {
    correct: false,
    direction: played < target ? 'higher' : 'lower',
    sameNoteName: distance % 12 === 0,
    distance,
  };
}

/** Cách nhau bao nhiêu nửa cung thì coi là "gần lắm rồi". */
export const NEAR_SEMITONES = 2;
