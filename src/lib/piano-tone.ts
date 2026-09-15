/**
 * Nắn tiếng piano cho **êm và vang** — thứ người ta nghe thấy trong nhạc buồn.
 *
 * **Vì sao phải nắn thay vì kiếm mẫu âm khác:** họ Piano của General MIDI chỉ có
 * tám số hiệu (0-7) và app đã lấy đủ cả tám. Mà cái làm nên tiếng piano trong
 * nhạc buồn lại không nằm ở cây đàn: nó nằm ở **căn phòng** (tiếng vang đuôi dài)
 * và ở **cách chạm phím nhẹ** (búa gõ nhẹ thì phần cao của tiếng bớt hẳn). Mẫu âm
 * nào cũng thu khô trong phòng tiêu âm, nên không bộ mẫu âm nào có sẵn hai thứ đó.
 *
 * **Chỉ đụng tới âm sắc, không đụng tới nốt.** Cao độ, trường độ, mạnh nhẹ giữa
 * các nốt đều giữ nguyên — đây là bộ lọc chạy trên tiếng đã dựng xong, không phải
 * bộ sinh nhạc. Đổi tiếng không bao giờ đổi bản nhạc người học đang đọc.
 *
 * Toán thuần trên `Float32Array`, không chạm `window`: chạy được trong vitest
 * (`environment: 'node'`), đúng quy tắc 2 của `.claude/skills/code-standards/SKILL.md`.
 */

export interface PianoVoicing {
  /**
   * Bớt phần cao đi bao nhiêu, 0 tới 1. `0` là để nguyên, `1` là tối hẳn.
   *
   * Đây là phần "êm": tiếng chói của piano nằm ở tiếng búa gõ lúc vừa bấm, mà
   * tiếng búa toàn là phần cao. Hạ phần cao xuống nghe đúng như người chạm phím
   * nhẹ hơn.
   */
  soften: number;
  /**
   * Hạ riêng vùng 1-2kHz đi bao nhiêu, 0 tới 1. `0` là để nguyên.
   *
   * Đây là phần "trong trẻo", và nó **khác hẳn `soften`**: `soften` hạ tất cả
   * phần cao nên tiếng tối đi, còn cái này chỉ khoét đúng vùng 1-2kHz — chỗ
   * tiếng "đanh" của piano nằm. Bỏ vùng đó đi thì tiếng tròn và sạch, mà phần
   * cao vẫn còn nguyên nên tai nghe ra là *trong*, không phải *bị bịt*.
   *
   * Đo được từ một bản ghi piano thật mà chủ sản phẩm gửi làm mẫu: nó có **cùng
   * trọng tâm phổ** với mẫu âm của app (384Hz so với 390Hz) nhưng vùng 1-2kHz
   * chỉ còn 2,4% thay vì 7,6%. Khác biệt duy nhất nằm đúng ở đó.
   */
  roundness?: number;
  /**
   * Vang bao nhiêu, 0 tới 1. `0` là khô như thu trong phòng tiêu âm.
   *
   * Đây là phần "vang": tiếng dội lại của căn phòng, thứ làm nốt nhạc còn ngân
   * sau khi tay đã rời phím.
   */
  reverb: number;
}

/**
 * Tần số bắt đầu hạ của bộ lọc phần cao, tính bằng Hz.
 *
 * Con số này đã dò ba lần, và hai lần đầu đều sai theo hai hướng ngược nhau —
 * ghi lại để khỏi dò lại:
 *
 * - **1600Hz, một cực:** hạ hết cỡ cũng chỉ bớt 19% độ sáng, tai không nhận ra.
 * - **1100Hz, hai cực:** êm thật, nhưng Đô6 chỉ còn 52% mức cũ. Đô6 là nốt cao
 *   nhất giáo trình dùng, mà **giai điệu thường nằm ở bè cao nhất** — hạ nó đi
 *   là giai điệu tay phải chìm xuống dưới bè đệm tay trái. Nghe êm hơn thật, chỉ
 *   là không còn nghe ra bài.
 * - **2200Hz, hai cực:** tiếng cơ bản của mọi nốt (tới 1047Hz) giữ được trên
 *   80%, còn vùng 4-6kHz — chỗ tiếng búa gõ vào dây — hạ còn một phần tư.
 *
 * Bài học chung: cái làm piano chói **không phải cao độ của nốt**, mà là tiếng
 * búa nằm cao hơn nốt hai ba quãng tám. Cắt đúng chỗ đó thì tiếng êm mà bản nhạc
 * vẫn nguyên.
 */
const CUT_HZ = 2200;

/**
 * Bộ lọc hai cực nối tiếp (12dB mỗi quãng tám), trộn lại với tiếng gốc theo `soften`.
 *
 * Vì sao hai cực chứ không một: một cực thoai thoải tới mức phải hạ tần số cắt
 * xuống rất thấp mới nghe ra khác, mà xuống thấp thì ăn vào cả tiếng chính của
 * nốt. Hai cực dốc gấp đôi nên cắt được tiếng búa mà vẫn chừa nguyên cao độ.
 *
 * Vẫn **trộn** với tiếng gốc chứ không thay hẳn: thay hẳn thì nghe ra ngay là
 * "đã bị lọc", còn trộn thì giống cách cây đàn thật tối đi khi chạm phím nhẹ.
 */
function lowpassMix(data: Float32Array, sampleRate: number, soften: number): void {
  if (soften <= 0) return;
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * CUT_HZ);
  const alpha = dt / (rc + dt);
  const mix = Math.min(1, soften);

  let mot = 0;
  let hai = 0;
  for (let i = 0; i < data.length; i++) {
    mot += alpha * (data[i] - mot);
    hai += alpha * (mot - hai);
    data[i] = data[i] * (1 - mix) + hai * mix;
  }
}

/**
 * Vùng tiếng "đanh" của piano: quanh 1500Hz, rộng khoảng một quãng tám.
 *
 * Đã thử 2000Hz để tránh xa Đô6 (1047Hz) cho an toàn — **nhưng lệch chỗ**: bản
 * ghi mẫu khác mẫu âm của app rõ nhất đúng ở dải 800-1600Hz, dời lên 2000Hz là
 * khoét trượt ra ngoài chỗ cần khoét, và tiếng nghe tròn hơn nhưng không giống
 * bản mẫu hơn.
 *
 * `Q = 1,2` là chỗ cân được: đủ hẹp để Đô6 còn 70% mức cũ, đủ rộng để phủ vùng
 * đanh. Hẹp hơn thì nghe như điện thoại; rộng hơn thì ăn sang tiếng cơ bản của
 * nốt và thành tối tiếng — việc đó `soften` đã lo, không cần làm hai lần.
 */
const HARSH_HZ = 1500;
const HARSH_Q = 1.2;

/** Hạ sâu nhất bao nhiêu dB khi `roundness` bằng 1. */
const HARSH_MAX_DB = -12;

/**
 * Bộ lọc chuông hạ một vùng tần số, theo công thức RBJ — cùng công thức mọi bàn
 * trộn và mọi bộ chỉnh âm trong trình duyệt đang dùng.
 *
 * Viết tay ở đây chứ không gọi `BiquadFilterNode` của Web Audio vì cùng lý do với
 * bộ vang: phần tính toán của repo này phải chạy được trong vitest ở node.
 */
function dipHarsh(data: Float32Array, sampleRate: number, roundness: number): void {
  if (!roundness || roundness <= 0) return;
  const gainDb = HARSH_MAX_DB * Math.min(1, roundness);
  const A = 10 ** (gainDb / 40);
  const w0 = (2 * Math.PI * HARSH_HZ) / sampleRate;
  const alpha = Math.sin(w0) / (2 * HARSH_Q);
  const cos = Math.cos(w0);

  const b0 = (1 + alpha * A) / (1 + alpha / A);
  const b1 = (-2 * cos) / (1 + alpha / A);
  const b2 = (1 - alpha * A) / (1 + alpha / A);
  const a1 = (-2 * cos) / (1 + alpha / A);
  const a2 = (1 - alpha / A) / (1 + alpha / A);

  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    data[i] = y0;
  }
}

/**
 * Độ trễ của tám bộ lọc lược và bốn bộ lọc toàn thông, tính bằng mẫu ở 44100Hz.
 *
 * Đây là bộ số của Freeverb (Jezar, 2000) — bộ vang kinh điển, và là bộ duy nhất
 * đủ nhẹ để chạy bằng JavaScript trên điện thoại. Các số nguyên tố cùng nhau cố
 * ý: trùng ước là các tiếng dội chồng lên nhau thành tiếng "kim loại".
 *
 * **Không dùng ConvolverNode của Web Audio** dù nó có sẵn và chạy nhanh hơn: nó
 * là thứ của trình duyệt, mà phần tính toán của repo này phải test được ở node.
 */
const COMB_DELAYS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_DELAYS = [556, 441, 341, 225];

/** Lệch độ trễ giữa hai tai, để tiếng vang mở ra hai bên chứ không dính giữa đầu. */
const STEREO_SPREAD = 23;

/**
 * Tiếng dội mỗi vòng mất bao nhiêu phần cao. Phòng thật hút phần cao trước.
 *
 * Để 0,55 chứ không phải mức nhẹ 0,28 của Freeverb gốc, vì **đuôi vang phải TỐI
 * hơn tiếng gốc**. Thử mức nhẹ thì tiếng vang còn làm bản nhạc sáng thêm 5-8% —
 * ngược hẳn thứ đang cần, và nghe ra là tiếng vang nhân tạo.
 */
const DAMP = 0.55;

/**
 * Vòng hồi tiếp lớn nhất, ứng với đuôi vang khoảng 2,4 giây.
 *
 * Đây là cỡ một khán phòng nhỏ — đúng thứ nghe thấy trong các bản piano nhạc
 * buồn. Cao hơn nữa thì hai nốt liền nhau dính vào nhau và người mới tập không
 * nghe ra mình vừa đánh mấy nốt, nên dừng ở đây.
 */
const MAX_FEEDBACK = 0.92;

class Comb {
  private readonly buf: Float32Array;
  private at = 0;
  private loc = 0;

  constructor(size: number, private readonly feedback: number, private readonly damp: number) {
    this.buf = new Float32Array(Math.max(1, size));
  }

  step(input: number): number {
    const out = this.buf[this.at];
    this.loc = out * (1 - this.damp) + this.loc * this.damp;
    this.buf[this.at] = input + this.loc * this.feedback;
    this.at = (this.at + 1) % this.buf.length;
    return out;
  }
}

class Allpass {
  private readonly buf: Float32Array;
  private at = 0;

  constructor(size: number, private readonly feedback = 0.5) {
    this.buf = new Float32Array(Math.max(1, size));
  }

  step(input: number): number {
    const cu = this.buf[this.at];
    const out = -input + cu;
    this.buf[this.at] = input + cu * this.feedback;
    this.at = (this.at + 1) % this.buf.length;
    return out;
  }
}

/**
 * Thêm tiếng vang vào một kênh, trộn thẳng lên chính nó.
 *
 * `channel` là số thứ tự tai (0 trái, 1 phải): hai tai lệch nhau `STEREO_SPREAD`
 * mẫu, đúng cách Freeverb mở rộng không gian.
 */
function addReverb(data: Float32Array, sampleRate: number, amount: number, channel: number): void {
  if (amount <= 0) return;
  const wet = Math.min(1, amount) * 0.75;
  const ti = sampleRate / 44100;
  const lech = channel === 0 ? 0 : STEREO_SPREAD;
  const feedback = MAX_FEEDBACK * (0.85 + 0.15 * Math.min(1, amount));

  const combs = COMB_DELAYS.map((d) => new Comb(Math.round((d + lech) * ti), feedback, DAMP));
  const allpasses = ALLPASS_DELAYS.map((d) => new Allpass(Math.round((d + lech) * ti)));

  for (let i = 0; i < data.length; i++) {
    const kho = data[i];
    let uot = 0;
    // Tám bộ lược chạy SONG SONG rồi cộng lại: mỗi bộ là một hướng tường.
    for (const comb of combs) uot += comb.step(kho);
    uot /= combs.length;
    // Bốn bộ toàn thông chạy NỐI TIẾP: làm tiếng dội dày lên mà không đổi âm sắc.
    for (const allpass of allpasses) uot = allpass.step(uot);
    data[i] = kho + uot * wet;
  }
}

/**
 * Nắn một kênh tiếng theo cách chơi đã chọn. Sửa thẳng trên mảng.
 *
 * Nắn tiếng của cây đàn TRƯỚC rồi mới thêm vang, đúng thứ tự của đời thật: cây
 * đàn phát ra tiếng thế nào thì căn phòng dội lại tiếng đó. Làm ngược lại thì
 * tiếng vang bị lọc mất phần cao và nghe đục.
 */
export function voiceChannel(
  data: Float32Array,
  sampleRate: number,
  voicing: PianoVoicing,
  channel = 0,
): void {
  dipHarsh(data, sampleRate, voicing.roundness ?? 0);
  lowpassMix(data, sampleRate, voicing.soften);
  addReverb(data, sampleRate, voicing.reverb, channel);
}
