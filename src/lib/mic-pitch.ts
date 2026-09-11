/**
 * Nhận ra nốt đàn trong một đoạn âm thanh thu từ micro.
 *
 * File này chỉ làm toán trên mảng số — không đụng tới micro, trình duyệt hay
 * React — nên vitest kiểm được bằng tín hiệu tự dựng (`mic-pitch.test.ts`). Phần
 * nối với micro nằm ở `useMicInput.ts`, phần tìm lúc phím vừa được đánh xuống
 * nằm ở `mic-listener.ts`.
 *
 * **Cách làm, và vì sao không dùng cách đơn giản hơn.** Cách quen thuộc để dò
 * cao độ (tự tương quan, YIN) chỉ trả về MỘT tần số — đủ cho giọng hát, không đủ
 * cho piano: hai tay cùng đánh, hợp âm ba nốt ở Chương 7. Nên ở đây làm theo lối
 * "cộng hoạ âm rồi trừ dần":
 *
 * 1. Phổ tần số của đoạn âm thanh (FFT).
 * 2. Với mỗi phím đàn ứng viên, cộng biên độ ở đúng các vị trí hoạ âm của nó
 *    (f, 2f, 3f...). Nốt thật sự đang kêu thì mọi hoạ âm cùng sáng; nốt không kêu
 *    chỉ vớt được vài chỗ trùng ngẫu nhiên.
 * 3. Lấy ứng viên mạnh nhất, trừ các hoạ âm của nó ra khỏi phổ, rồi lặp lại để
 *    tìm nốt thứ hai, thứ ba... cho tới khi phần còn lại chỉ là tiếng ồn.
 *
 * Bước 3 trừ theo "độ trơn của phổ": mỗi hoạ âm chỉ bị trừ tới mức hai hoạ âm
 * bên cạnh cho phép. Lý do: hoạ âm thứ 3 của Đô3 trùng đúng nốt Sol4, nên nếu tay
 * trái giữ Đô3 và tay phải đánh Sol4 thì chỗ đó sáng hơn hẳn mức một mình Đô3 tạo
 * ra. Trừ sạch thì Sol4 biến mất theo; trừ vừa đủ thì phần dư vẫn còn cho lượt sau.
 *
 * **Giới hạn phải biết** (đã ghi cho người học ở `docs/07-doc-them/`):
 * - Hai nốt cách nhau đúng một quãng tám thì mọi hoạ âm của nốt cao nằm trọn trong
 *   nốt thấp — về lý thuyết không tách được. Chỗ bù cho trường hợp này nằm ở
 *   `mic-follow.ts`, không ở đây.
 * - Mọi con số chỉnh nằm ở `PITCH_TUNING` đầu file. Chúng được chỉnh trên tín hiệu
 *   tổng hợp, CHƯA chỉnh trên micro điện thoại thật đặt cạnh đàn thật.
 */

export const PITCH_TUNING = {
  /** Phím thấp nhất được xét: Đô2. Thấp hơn nữa micro điện thoại gần như không thu. */
  midiMin: 36,
  /** Phím cao nhất được xét: Đô7. */
  midiMax: 96,
  /** Số hoạ âm cộng cho mỗi ứng viên. Cố định chứ không "tới hết dải tần" — xem `salienceOf`. */
  harmonics: 10,
  /** Không xét hoạ âm cao hơn mức này: micro điện thoại và tiếng ồn phòng làm phần trên nhiễu. */
  maxPartialHz: 6000,
  /**
   * Độ lệch cho phép quanh vị trí hoạ âm lý thuyết, tính bằng cent (1/100 cung).
   * Đàn thật hơi lệch chuẩn, đàn điện rẻ tiền lệch nhiều hơn.
   */
  toleranceCents: 35,
  /**
   * Hệ số "dây cứng" lớn nhất của dây đàn piano: hoạ âm cao bị đẩy lên hơi cao hơn
   * bội số chẵn của nốt gốc. Chỉ dùng để nới cửa sổ tìm về phía trên.
   */
  maxInharmonicity: 0.0004,
  /**
   * Trọng số của hoạ âm thứ h là 1 / h^mũ này. Phẳng quá thì nốt thấp hơn một
   * quãng tám "ăn ké" được mọi hoạ âm của nốt thật; dốc quá thì nốt gốc yếu (micro
   * điện thoại thu rất kém dưới 150Hz) khiến máy chọn nhầm lên quãng tám trên.
   */
  weightExponent: 0.55,
  /** Nốt đầu tiên phải mạnh hơn mức tiếng ồn nền này bao nhiêu lần mới tính. */
  minSalienceOverNoise: 6,
  /** Nốt thứ hai trở đi phải đạt ít nhất tỉ lệ này so với nốt mạnh nhất. */
  relativeThreshold: 0.3,
  /** Ngưỡng hạ xuống cho nốt đang được chờ trên bản nhạc (xem `hint`). */
  hintedRelativeThreshold: 0.15,
  /**
   * Kiểm tra chọn nhầm xuống quãng tám dưới: nếu các hoạ âm lẻ (1, 3, 5, 7) của
   * nốt vừa chọn yếu hơn mức này so với hoạ âm chẵn thì đó thực ra là nốt cao hơn
   * một quãng tám — nốt thấp chỉ vớt được hoạ âm chẵn trùng với nó.
   */
  oddToEvenMin: 0.3,
  /**
   * Một hoạ âm được coi là "có mặt" khi đạt tỉ lệ này so với hoạ âm mạnh nhất của
   * cùng phím. Phím nào có ít hơn hai hoạ âm có mặt thì không phải tiếng đàn: một
   * tiếng bíp (máy đánh nhịp, chuông điện thoại) chỉ có đúng một tần số.
   */
  partialPresence: 0.05,
  /** Biên độ hoạ âm mạnh nhất phải trên mức này (khoảng -66 dBFS), để phòng im tuyệt đối. */
  minPeak: 0.0005,
  /** Hoạ âm phải cao hơn bao nhiêu lần mức nền tại chỗ mới tính là đỉnh nhọn (xem `localBase`). */
  tonalMultiple: 3,
  /** Nốt phải to lên ít nhất ngần này lần so với ngay trước lúc phím xuống mới tính là vừa đánh. */
  riseRatio: 1.3,
} as const;

/** Tần số của phím đàn theo số hiệu MIDI (La4 = 69 = 440Hz). */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Phổ biên độ của một đoạn âm thanh. */
export interface Spectrum {
  /** Biên độ từng dải tần, đã chuẩn hoá để một sóng sin biên độ A cho đỉnh ≈ A/2. */
  mag: Float64Array;
  /** Mỗi dải rộng bao nhiêu Hz. */
  binHz: number;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** FFT cơ số 2 tại chỗ, trên hai mảng thực/ảo. Độ dài phải là luỹ thừa của 2. */
export function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Đảo bit
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    const half = len >> 1;
    for (let start = 0; start < n; start += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = start + k;
        const b = a + half;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nextCr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nextCr;
      }
    }
  }
}

/** Bộ nhớ đệm cửa sổ Hann theo độ dài, để khỏi tính lại cos mỗi lần. */
const hannCache = new Map<number, Float64Array>();

function hann(length: number): Float64Array {
  let w = hannCache.get(length);
  if (!w) {
    w = new Float64Array(length);
    for (let i = 0; i < length; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1));
    hannCache.set(length, w);
  }
  return w;
}

/**
 * Phổ biên độ của đoạn `samples`, qua cửa sổ Hann, đệm số 0 lên `fftSize`.
 *
 * Đệm số 0 không làm phổ phân giải hơn — thứ đó chỉ do độ dài đoạn quyết định —
 * nhưng làm lưới dày hơn, nên đỉnh của hoạ âm rơi gần đúng chỗ hơn khi đo.
 */
export function magnitudeSpectrum(
  samples: ArrayLike<number>,
  sampleRate: number,
  fftSize: number = nextPowerOfTwo(samples.length) * 2,
): Spectrum {
  const n = samples.length;
  const window = hann(n);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  let windowSum = 0;
  for (let i = 0; i < n; i++) {
    re[i] = samples[i] * window[i];
    windowSum += window[i];
  }
  fftInPlace(re, im);
  const bins = fftSize >> 1;
  const mag = new Float64Array(bins);
  const scale = windowSum > 0 ? 1 / windowSum : 0;
  for (let k = 0; k < bins; k++) mag[k] = Math.hypot(re[k], im[k]) * scale;
  return { mag, binHz: sampleRate / fftSize };
}

/**
 * Phần phổ MỚI xuất hiện giữa hai thời điểm: chỗ nào sau sáng hơn trước thì giữ
 * phần chênh, chỗ nào tối đi thì về 0.
 *
 * Đây là thứ giúp micro không báo lại nốt cũ còn đang ngân. Người học đánh Đô rồi
 * Rê liền tay thì lúc Rê vang lên Đô vẫn còn kêu; so với phổ ngay trước đó thì Đô
 * đang nhỏ dần nên bị loại, còn Rê vừa xuất hiện nên giữ lại. Đánh lại đúng nốt
 * vừa đánh cũng vẫn nhận ra, vì tiếng búa gõ làm nó to vọt lên.
 */
export function spectralRise(before: Spectrum, after: Spectrum): Spectrum {
  const mag = new Float64Array(after.mag.length);
  for (let k = 0; k < mag.length; k++) mag[k] = Math.max(0, after.mag[k] - before.mag[k]);
  return { mag, binHz: after.binHz };
}

/** Khoảng dải tần [lo, hi] cần dò cho hoạ âm thứ h của tần số gốc f0. */
function partialRange(f0: number, h: number, binHz: number, maxBin: number): [number, number] {
  const tol = 2 ** (PITCH_TUNING.toleranceCents / 1200);
  const stretch = Math.sqrt(1 + PITCH_TUNING.maxInharmonicity * h * h);
  const center = (h * f0) / binHz;
  let lo = Math.floor((h * f0) / tol / binHz);
  let hi = Math.ceil((h * f0 * stretch * tol) / binHz);
  // Nốt thấp thì cửa sổ cent hẹp hơn một dải — luôn cho ít nhất một dải mỗi bên.
  lo = Math.min(lo, Math.floor(center) - 1);
  hi = Math.max(hi, Math.ceil(center) + 1);
  return [Math.max(1, lo), Math.min(maxBin, hi)];
}

function peakIn(mag: Float64Array, lo: number, hi: number): number {
  let best = 0;
  for (let k = lo; k <= hi; k++) if (mag[k] > best) best = mag[k];
  return best;
}

/** Mức tiếng ồn nền: trung vị biên độ trong dải có nốt đàn. */
function noiseFloor(spectrum: Spectrum): number {
  const lo = Math.max(1, Math.floor(60 / spectrum.binHz));
  const hi = Math.min(spectrum.mag.length - 1, Math.ceil(PITCH_TUNING.maxPartialHz / spectrum.binHz));
  const values = Array.from(spectrum.mag.subarray(lo, hi + 1)).sort((a, b) => a - b);
  return values.length ? values[Math.floor(values.length / 2)] : 0;
}

const WEIGHTS = Array.from({ length: PITCH_TUNING.harmonics }, (_, i) => 1 / (i + 1) ** PITCH_TUNING.weightExponent);
const WEIGHT_SUM = WEIGHTS.reduce((a, b) => a + b, 0);

/**
 * Mức nền ngay hai bên một hoạ âm: phân vị 25% của vài dải tần nằm ngoài đỉnh.
 *
 * Lấy nền tại chỗ chứ không lấy một mức ồn chung cho cả phổ, vì tiếng ồn thật
 * không phẳng: quạt và xe cộ dồn ở âm trầm, tiếng xì của micro dồn ở âm cao. Một
 * tiếng "tách" hay tiếng bíp bị ngắt đột ngột cũng toé ra thành một dải rộng —
 * đo so với nền tại chỗ thì mấy thứ đó thành phẳng lì, còn hoạ âm của nốt đàn thì
 * vẫn nhô hẳn lên. Phân vị 25% thay vì trung vị để hoạ âm của nốt khác trong cùng
 * hợp âm lỡ rơi vào hai bên cũng không kéo nền lên.
 */
function localBase(mag: Float64Array, lo: number, hi: number): number {
  const guard = 4; // nửa bề rộng đỉnh của cửa sổ Hann, tính theo dải sau khi đệm số 0
  const width = 8;
  const values: number[] = [];
  for (let k = lo - guard - width; k < lo - guard; k++) if (k >= 1) values.push(mag[k]);
  for (let k = hi + guard + 1; k <= hi + guard + width; k++) if (k < mag.length) values.push(mag[k]);
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 4)];
}

interface Partials {
  /** Hoạ âm cao hơn mức ồn chung bao nhiêu — thứ dùng để cộng độ nổi. */
  values: number[];
  /** Biên độ đỉnh thật trên phổ — thứ dùng khi trừ nốt ra khỏi phổ. */
  peaks: number[];
  /** Hoạ âm này có nhô thành đỉnh nhọn so với nền tại chỗ không (xem `localBase`). */
  tonal: boolean[];
}

/**
 * Các hoạ âm của một phím trên `spectrum`. Hoạ âm vượt quá dải tần cho phép thì là 0.
 *
 * Độ nổi đo so với mức ồn CHUNG chứ không so với nền tại chỗ: đã thử, và nốt trầm
 * hỏng ngay — hoạ âm của Đô2 chỉ cách nhau 65Hz, nên "hai bên" một hoạ âm lại chính
 * là hoạ âm kế bên, nền bị đội lên và phím sát cạnh thắng. Nền tại chỗ chỉ dùng cho
 * câu hỏi có/không ở `tonal`.
 *
 * `base` khác `spectrum` khi dò trên phần phổ mới xuất hiện: phần đó đã trừ đi
 * gần hết tiếng ồn nên nền của nó gần như 0 — phải đo nền trên phổ gốc.
 */
function partialsOf(spectrum: Spectrum, midi: number, base: Spectrum = spectrum, floor = noiseFloor(base)): Partials {
  const f0 = midiToFreq(midi);
  const maxBin = spectrum.mag.length - 1;
  const values: number[] = [];
  const peaks: number[] = [];
  const tonal: boolean[] = [];
  for (let h = 1; h <= PITCH_TUNING.harmonics; h++) {
    if (h * f0 > PITCH_TUNING.maxPartialHz) {
      values.push(0);
      peaks.push(0);
      tonal.push(false);
      continue;
    }
    const [lo, hi] = partialRange(f0, h, spectrum.binHz, maxBin);
    const peak = peakIn(spectrum.mag, lo, hi);
    peaks.push(peak);
    values.push(Math.max(0, peak - floor));
    tonal.push(peak > PITCH_TUNING.tonalMultiple * localBase(base.mag, lo, hi));
  }
  return { values, peaks, tonal };
}

/**
 * Độ nổi của một phím: tổng có trọng số của các hoạ âm.
 *
 * Số hoạ âm cố định cho mọi phím (chứ không "tới hết dải tần") là có chủ ý: nếu
 * nốt thấp được cộng nhiều hoạ âm hơn nốt cao thì Đô2 luôn thắng Đô3 khi người học
 * đánh Đô3 — mọi hoạ âm của Đô3 đều là hoạ âm chẵn của Đô2.
 */
function salienceOf(partials: number[]): number {
  let s = 0;
  for (let i = 0; i < partials.length; i++) s += WEIGHTS[i] * partials[i];
  return s;
}

/** Tỉ lệ hoạ âm lẻ (1, 3, 5, 7) so với hoạ âm chẵn (2, 4, 6, 8). */
function oddToEven(partials: number[]): number {
  let odd = 0;
  let even = 0;
  for (let i = 0; i < 8 && i < partials.length; i++) {
    if (i % 2 === 0) odd += partials[i];
    else even += partials[i];
  }
  return even > 0 ? odd / even : Infinity;
}

/**
 * Phím này có hình dạng của một nốt đàn thật không.
 *
 * Hai điều kiện, mỗi cái chặn một kiểu nhận nhầm:
 *
 * - **Nốt gốc phải có tiếng.** Đánh hợp âm Đô4-Mi4-Sol4 thì Đô3 trông rất giống
 *   nốt thật: hoạ âm chẵn của nó trùng Đô4, còn hoạ âm lẻ thứ 3 và thứ 5 lại trùng
 *   Sol4 và Mi5. Chỉ riêng chỗ nốt gốc 130Hz là trống trơn. Micro điện thoại thu nốt
 *   gốc trầm rất yếu, nhưng yếu vẫn khác với không có gì.
 * - **Ít nhất hai hoạ âm.** Tiếng bíp chỉ có một tần số, và tần số đó luôn trùng
 *   một hoạ âm nào đó của vài phím đàn.
 */
function looksLikeANote({ values, peaks, tonal }: Partials, fundamentalMayBeWeak = false): boolean {
  if (values[0] <= 0 && !fundamentalMayBeWeak) return false;
  if (Math.max(...peaks) < PITCH_TUNING.minPeak) return false;
  const strongest = Math.max(...values);
  let present = 0;
  let sharp = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < strongest * PITCH_TUNING.partialPresence) continue;
    present += 1;
    if (tonal[i]) sharp += 1;
  }
  // Tiếng "tách", tiếng bíp bị ngắt đột ngột, tiếng ồn: toé ra thành một mảng
  // phẳng, chỗ nào cũng có mà không chỗ nào nhô lên. Nốt đàn thì hoạ âm nhọn hoắt.
  return present >= 2 && sharp >= 2;
}

/**
 * Trừ phần của một nốt đã nhận ra khỏi phổ, theo độ trơn: mỗi hoạ âm chỉ bị trừ
 * tới mức trung bình của nó với hai hoạ âm kề bên. Phần dư lại là của nốt khác
 * trùng hoạ âm (xem đầu file).
 */
function subtractNote(mag: Float64Array, binHz: number, midi: number, { values, peaks }: Partials): void {
  const f0 = midiToFreq(midi);
  const maxBin = mag.length - 1;
  for (let i = 0; i < values.length; i++) {
    const a = values[i];
    if (a <= 0 || peaks[i] <= 0) continue;
    const neighbours = [values[i - 1], a, values[i + 1]].filter((v) => v !== undefined) as number[];
    const smooth = Math.min(a, neighbours.reduce((x, y) => x + y, 0) / neighbours.length);
    const keep = Math.max(0, 1 - smooth / peaks[i]);
    // Nới thêm hai dải mỗi bên để trừ luôn phần "vạt" của đỉnh do cửa sổ Hann.
    const [lo, hi] = partialRange(f0, i + 1, binHz, maxBin);
    for (let k = Math.max(1, lo - 2); k <= Math.min(maxBin, hi + 2); k++) mag[k] *= keep;
  }
}

/**
 * Phím này vừa được đánh, hay chỉ đang ngân dần? Trả về tỉ lệ "sau / trước" của
 * nó quanh lúc phím xuống — trên 1 là to lên, dưới 1 là đang nhỏ dần.
 *
 * Hai điều đã học được bằng cách đo, đừng bỏ:
 *
 * - **Chỉ xét hoạ âm không trùng nốt khác** (`use`). Đánh Rê4 ngay sau Pha4 thì hoạ
 *   âm thứ 6 của Rê (1762Hz) rơi trúng hoạ âm thứ 5 của Pha (1746Hz), cùng vài cặp
 *   khác — tính gộp thì Pha trông như vừa to lên, trong khi thật ra nó đang tắt dần.
 * - **Lấy trung vị tỉ lệ của từng hoạ âm, không lấy tỉ lệ của tổng.** Đánh lại đúng
 *   phím còn đang ngân thì tiếng cũ và tiếng mới cộng vào nhau lệch pha: vài hoạ âm
 *   (hay gặp nhất là nốt gốc) có khi còn nhỏ đi. Tổng thì bị nốt gốc chi phối nên
 *   ra "không mới"; trung vị thì một hai hoạ âm bị triệt không kéo được cả nốt xuống.
 */
function riseOf(
  onset: { before: Spectrum; after: Spectrum },
  midi: number,
  use: boolean[],
  floors: { before: number; after: number },
): number {
  // So trên biên độ đỉnh thật, KHÔNG trừ mức ồn: mức ồn của đoạn trước và đoạn
  // sau khác nhau (đoạn sau có thêm nốt mới), và với hoạ âm yếu thì trừ hai mức
  // khác nhau đủ đẩy một hoạ âm đang tắt dần lên tỉ lệ 1.34 — đo được ở Pha4 ma.
  const after = partialsOf(onset.after, midi, onset.after, floors.after).peaks;
  const before = partialsOf(onset.before, midi, onset.before, floors.before).peaks;
  const noise = 3 * Math.max(floors.before, floors.after);
  const strongest = Math.max(0, ...after.filter((_, i) => use[i]));
  const ratios: number[] = [];
  for (let i = 0; i < after.length; i++) {
    // Bỏ hoạ âm quá yếu hoặc chìm trong ồn: tỉ lệ giữa hai con số gần 0 chỉ là
    // tiếng ồn. Ngưỡng để thấp (3%): nốt gốc thường to gấp chục lần phần còn lại,
    // đặt cao là chỉ còn mỗi nốt gốc — đúng hoạ âm dễ bị "đập" nhất.
    if (!use[i] || after[i] < strongest * 0.03 || after[i] < noise) continue;
    ratios.push(after[i] / Math.max(before[i], noise / 3));
  }
  if (ratios.length === 0) return 0;
  ratios.sort((a, b) => a - b);
  // Số hoạ âm chẵn thì lấy trung vị phía dưới — thà sót một nốt đánh lại còn hơn
  // báo một nốt ma, vì nốt ma thì nháy đỏ oan người học.
  return ratios[Math.floor((ratios.length - 1) / 2)];
}

/**
 * Hai tần số gần nhau hơn chừng này dải (sau khi đệm số 0) thì nằm chung đỉnh của
 * cửa sổ Hann — độ to đo được của cái này bị cái kia làm dao động theo.
 */
const BEAT_BINS = 4.5;

/**
 * Hoạ âm nào của `midi` không trùng hoạ âm nào của các nốt `others`. `minBins` là
 * khoảng cách tối thiểu tính theo dải, cho những chỗ cần xa hơn mức "trùng".
 */
function unsharedPartials(midi: number, others: readonly number[], binHz: number, minBins = 3): boolean[] {
  const f0 = midiToFreq(midi);
  const minGapHz = minBins * binHz;
  const out: boolean[] = [];
  for (let h = 1; h <= PITCH_TUNING.harmonics; h++) {
    const f = h * f0;
    if (f > PITCH_TUNING.maxPartialHz) {
      out.push(false);
      continue;
    }
    const tolHz = Math.max(minGapHz, f * (2 ** ((2 * PITCH_TUNING.toleranceCents) / 1200) - 1));
    out.push(!others.some((o) => {
      const g = midiToFreq(o);
      // Xét hết hoạ âm của nốt kia trong dải đang dùng, không chỉ 10 cái đầu: Rê5
      // có hoạ âm thứ 7 ở 4111Hz, trùng hoạ âm thứ 14 của Rê4 — dừng ở 10 là sót.
      const k = Math.round(f / g);
      return k >= 1 && Math.abs(k * g - f) < tolHz;
    }));
  }
  return out;
}

export interface DetectedNote {
  midi: number;
  /** Độ nổi so với nốt mạnh nhất trong cùng lần nghe, 0..1. Nốt mạnh nhất là 1. */
  strength: number;
}

export interface DetectOptions {
  /**
   * Những phím bản nhạc đang chờ. Chỉ dùng để HẠ ngưỡng dừng cho đúng các phím
   * đó (nốt nhỏ trong hợp âm dễ lọt), KHÔNG bao giờ biến một phím không kêu thành
   * phím có kêu — phím được gợi ý vẫn phải là đỉnh nổi thật sự trên phổ.
   */
  hint?: readonly number[];
  /** Nhiều nhất bao nhiêu nốt một lần. */
  maxNotes?: number;
  /** Chỉ xét phím trong khoảng này (mặc định cả dải `PITCH_TUNING`). */
  range?: readonly [number, number];
  /**
   * Phổ ngay TRƯỚC lúc phím xuống, và phổ ngay SAU (chưa trừ gì). Có hai thứ này
   * thì chỉ nhận những phím thật sự to vọt lên — nốt cũ đang ngân bị loại dù phần
   * phổ mới xuất hiện có lỡ vớt được vài mảnh của nó (xem `cleanSalience`).
   */
  onset?: { before: Spectrum; after: Spectrum };
}

/**
 * Tìm các nốt đang kêu trong phổ. Trả về theo thứ tự mạnh tới yếu.
 *
 * `reference` là phổ dùng để đo mức nền — cả nền chung lẫn nền tại chỗ của từng
 * hoạ âm. Khi dò trên phần phổ mới xuất hiện (`spectralRise`) thì phần ồn đã bị
 * trừ gần hết, nền gần như bằng 0 — lúc đó phải lấy nền của phổ gốc làm mốc,
 * không thì tiếng ồn cũng thành nốt.
 */
export function detectNotes(
  spectrum: Spectrum,
  options: DetectOptions = {},
  reference: Spectrum = spectrum,
): DetectedNote[] {
  const maxNotes = options.maxNotes ?? 4;
  const [lo, hi] = options.range ?? [PITCH_TUNING.midiMin, PITCH_TUNING.midiMax];
  const hint = new Set(options.hint ?? []);
  const floor = noiseFloor(reference);
  // Mức mà tiếng ồn thuần tuý cộng lên được qua cùng công thức.
  const noiseSalience = Math.max(floor, 1e-9) * WEIGHT_SUM;

  const residual = { mag: Float64Array.from(spectrum.mag), binHz: spectrum.binHz };
  const found: { midi: number; salience: number }[] = [];
  let first = 0;
  /** Phím đã xét và bị loại vì không to vọt lên — không xét lại ở lượt sau. */
  const stale = new Set<number>();
  const onset = options.onset;
  const floorBefore = onset ? noiseFloor(onset.before) : 0;
  const floorAfter = onset ? noiseFloor(onset.after) : 0;
  /**
   * Phím đang ngân từ trước lúc phím xuống. Với những phím này, nốt gốc được phép
   * yếu trên phần phổ mới sáng lên: đánh lại đúng phím còn đang ngân thì tiếng cũ
   * và tiếng mới cộng lệch pha, ở nốt gốc phần "mới" có khi gần bằng 0 — trong
   * khi các hoạ âm trên đã tắt bớt nên vẫn vọt lên rõ. Thiếu chỗ này thì Sol3
   * đánh lại bị nhận thành Sol4 + Rê5 (đo được trên câu nhạc ngẫu nhiên).
   */
  const ringing = new Set(onset
    ? detectNotes(onset.before, { maxNotes: 6, range: options.range }).map((n) => n.midi)
    : []);
  const floors = { before: floorBefore, after: floorAfter };
  const isNew = (m: number) => {
    if (!onset) return true;
    const newOnes = found.map((f) => f.midi);
    const others = [...newOnes, ...stale];
    const clean = unsharedPartials(m, others, onset.after.binHz);
    if (clean.some(Boolean)) {
      // Khi đo độ vọt thì bỏ thêm những hoạ âm nằm SÁT hoạ âm của nốt khác đang
      // ngân: hai tần số gần nhau "đập" vào nhau trong đoạn nghe 85ms, độ to đo được
      // cứ dao động lên xuống. Pha4 (349Hz) cạnh Mi4 (330Hz) đang ngân là ví dụ đo
      // được — nốt gốc của Pha trông như to lên 1.34 lần dù nó đang tắt dần.
      const neighbours = [...ringing].filter((r) => r !== m);
      const calm = unsharedPartials(m, neighbours, onset.after.binHz, BEAT_BINS);
      const use = clean.map((c, i) => c && calm[i]);
      return riseOf(onset, m, use.some(Boolean) ? use : clean, floors) >= PITCH_TUNING.riseRatio;
    }
    // Mọi hoạ âm đều trùng nốt khác — nó có thể chỉ là cái bóng của nốt đó.
    // Trùng với một nốt cũ đang ngân: chắc chắn là bóng. Trùng với nốt vừa đánh
    // thì không tách được bằng tai máy: Sol4 cùng Đô3 (hoạ âm thứ 3) là hai tay
    // thật, còn Sol4 khi đánh lại Sol3 (hoạ âm thứ 2) chỉ là bóng — phổ hai ca y
    // hệt nhau. Nên chỉ nhận khi bản nhạc đang chờ đúng phím đó.
    const onlyStale = unsharedPartials(m, newOnes, onset.after.binHz).some(Boolean);
    if (onlyStale || !hint.has(m)) return false;
    return riseOf(onset, m, clean.map(() => true), floors) >= PITCH_TUNING.riseRatio;
  };

  // Giới hạn số vòng: mỗi vòng hoặc nhận thêm một nốt, hoặc loại hẳn một phím cũ.
  // Chừa nhiều vòng cho phím cũ: tay trái giữ hợp âm ba nốt thì cả ba lần lượt bị
  // xét và loại trước khi tới được nốt tay phải vừa đánh.
  for (let round = 0; found.length < maxNotes && round < maxNotes + 6; round++) {
    const saliences = new Map<number, number>();
    const partialsByMidi = new Map<number, Partials>();
    for (let m = lo - 1; m <= hi + 1; m++) {
      const partials = partialsOf(residual, m, reference, floor);
      partialsByMidi.set(m, partials);
      saliences.set(m, salienceOf(partials.values));
    }

    let bestMidi = -1;
    let bestSalience = 0;
    for (let m = lo; m <= hi; m++) {
      if (stale.has(m) || found.some((f) => f.midi === m)) continue;
      const s = saliences.get(m) ?? 0;
      // Phải là đỉnh so với hai phím kề bên: một nốt kêu thật thì phím sát cạnh
      // chỉ vớt được phần "vạt" của nó. Chặn đúng kiểu lỗi đánh Pha bị nhận thành Mi.
      if (s < (saliences.get(m - 1) ?? 0) || s < (saliences.get(m + 1) ?? 0)) continue;
      const candidate = partialsByMidi.get(m);
      if (!candidate || !looksLikeANote(candidate, ringing.has(m))) continue;
      const passes = found.length === 0
        ? s > noiseSalience * PITCH_TUNING.minSalienceOverNoise
        : s >= first * (hint.has(m) ? PITCH_TUNING.hintedRelativeThreshold : PITCH_TUNING.relativeThreshold)
          && s > noiseSalience * (PITCH_TUNING.minSalienceOverNoise / 2);
      if (passes && s > bestSalience) {
        bestSalience = s;
        bestMidi = m;
      }
    }
    if (bestMidi < 0) break;

    // Chọn nhầm xuống quãng tám dưới? Nốt thấp hơn một quãng tám chỉ có hoạ âm
    // chẵn trùng với nốt thật, còn hoạ âm lẻ của nó rơi vào chỗ trống.
    let chosen = partialsByMidi.get(bestMidi) as Partials;
    const up = bestMidi + 12;
    if (up <= hi && oddToEven(chosen.values) < PITCH_TUNING.oddToEvenMin && !found.some((f) => f.midi === up)) {
      const upPartials = partialsOf(residual, up, reference, floor);
      if (looksLikeANote(upPartials)) {
        bestMidi = up;
        bestSalience = salienceOf(upPartials.values);
        chosen = upPartials;
      }
    }

    // Nốt cũ còn đang ngân: vẫn trừ phần của nó ra khỏi phổ để mảnh vụn của nó
    // không thành nốt ma ở lượt sau, nhưng không báo, và không lấy làm mốc so sánh.
    if (!isNew(bestMidi)) {
      stale.add(bestMidi);
      subtractNote(residual.mag, residual.binHz, bestMidi, chosen);
      continue;
    }

    if (found.length === 0) first = bestSalience;
    found.push({ midi: bestMidi, salience: bestSalience });
    subtractNote(residual.mag, residual.binHz, bestMidi, chosen);
  }

  // Lượt dọn cuối cho quy tắc "cái bóng" ở `isNew`: nốt nào mọi hoạ âm đều nằm
  // trọn trong một nốt thấp hơn cũng vừa nhận ra thì bỏ, trừ khi bản nhạc đang chờ
  // đúng nó. Phải làm lại ở đây vì thứ tự xét không cố định: đánh lại Mi4 còn đang
  // ngân thì Mi5 (hoạ âm thứ 2) có khi được xét TRƯỚC Mi4 và lọt qua `isNew`.
  const kept = onset
    ? found.filter((f) => {
      if (hint.has(f.midi)) return true;
      const lower = found.filter((o) => o.midi < f.midi).map((o) => o.midi);
      return lower.length === 0 || unsharedPartials(f.midi, lower, spectrum.binHz).some(Boolean);
    })
    : found;
  const top = kept.length > 0 ? Math.max(...kept.map((f) => f.salience)) : 0;
  return kept.map((f) => ({ midi: f.midi, strength: top > 0 ? f.salience / top : 0 }));
}

/** Âm lượng trung bình (RMS) của một đoạn, 0..1. */
export function rms(samples: ArrayLike<number>, from = 0, to = samples.length): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return to > from ? Math.sqrt(sum / (to - from)) : 0;
}
