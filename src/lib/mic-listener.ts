import {
  detectNotes, magnitudeSpectrum, rms, spectralRise, type DetectedNote, type DetectOptions,
} from './mic-pitch';

/**
 * Nghe dòng âm thanh liên tục từ micro và báo mỗi lần có phím được đánh xuống.
 *
 * Nhận từng khúc âm thanh nhỏ (`push`), không đụng tới micro hay trình duyệt —
 * nên vitest đưa tiếng đàn tổng hợp vào kiểm được y như lúc chạy thật. Phần nối
 * với micro nằm ở `src/hooks/useMicInput.ts`.
 *
 * Hai việc, tách hẳn nhau:
 *
 * 1. **Tìm lúc phím xuống** bằng "độ vọt của phổ": so phổ từng khung 21ms với
 *    khung cách đó hai bước, cộng mọi chỗ sáng lên. Tiếng búa gõ làm cả phổ vọt
 *    lên một nhịp, rõ hơn hẳn chuyện âm lượng to lên — nên đánh nốt mới trong lúc
 *    nốt cũ còn ngân vẫn bắt được, điều mà đo âm lượng thuần tuý bỏ lỡ. Bước này cố
 *    ý nhạy: báo nhầm một lần phím xuống thì bước 2 không tìm thấy nốt mới nào và
 *    bỏ qua, còn bỏ sót một lần phím xuống thì nốt đó mất hẳn.
 * 2. **Nhận nốt** ở đoạn ngay sau đó (`mic-pitch.ts`), chỉ nhận những phím to vọt
 *    lên so với ngay trước lúc phím xuống — nốt cũ đang ngân không bị báo lại.
 *
 * Độ chính xác đo trên vài trăm câu nhạc tổng hợp nằm ở `mic-accuracy.test.ts`.
 *
 * Độ trễ từ lúc phím xuống tới lúc báo: khoảng 25ms bỏ qua tiếng búa + 85ms nghe
 * = ~110ms. Đủ nhanh để thấy nốt xanh lên "ngay", mà vẫn đủ dài để phân biệt được
 * Đô3 với Đô thăng3 (hai nốt chỉ cách nhau 8Hz).
 *
 * Mọi con số chỉnh nằm ở `LISTENER_TUNING`. Chúng được chỉnh trên tín hiệu tổng
 * hợp, CHƯA chỉnh trên micro điện thoại thật.
 */

export const LISTENER_TUNING = {
  /** Khung dò lúc phím xuống, tính bằng giây. Ngắn để bắt kịp nốt nhanh. */
  onsetFrameSeconds: 0.021,
  /** Bỏ qua bao lâu sau lúc phím xuống: tiếng búa gõ là tiếng ồn, không có cao độ. */
  skipSeconds: 0.025,
  /** Đoạn nghe để nhận nốt. */
  analysisSeconds: 0.085,
  /** Khoảng hở giữa đoạn "trước" và lúc phím xuống, phòng ước lượng lúc phím xuống lệch. */
  preGapSeconds: 0.015,
  /**
   * Hai lần phím xuống gần nhau hơn mức này thì coi là một — hai tay không bao giờ
   * xuống cùng một mili giây, và một hợp âm không được thành hai lần đánh.
   */
  minInterOnsetSeconds: 0.06,
  /** Cùng một phím được báo lại trong khoảng này thì bỏ — đó là tiếng vọng của chính lần trước. */
  dedupeSeconds: 0.15,
  /** Độ vọt phải cao hơn trung vị gần đây bao nhiêu lần. */
  fluxOverMedian: 1.6,
  /** Cộng thêm vào ngưỡng độ vọt, để tiếng ồn đều đều không bao giờ vượt được. */
  fluxMinimum: 8,
  /** Khung phải to hơn mức ồn nền bao nhiêu lần mới xét. */
  levelOverNoise: 2.5,
  /** Bao nhiêu khung gần nhất dùng để tính trung vị độ vọt (~0.5 giây). */
  fluxHistory: 48,
} as const;

/** Một lần nghe thấy phím được đánh xuống. */
export interface HeardEvent {
  notes: DetectedNote[];
  /** Lúc phím xuống, tính bằng mẫu âm thanh kể từ khi bắt đầu nghe. */
  onsetSample: number;
  /**
   * Lúc phím xuống cách thời điểm báo bao nhiêu mili giây. Chỗ gọi trừ đi con số
   * này để ra đúng lúc người học đánh — phần chấm nhịp sau khi dừng cần nó.
   */
  ageMs: number;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Bộ nhớ vòng tròn giữ ~1.4 giây âm thanh gần nhất. */
class Ring {
  private readonly data: Float32Array;
  /** Tổng số mẫu đã ghi từ đầu — vị trí tuyệt đối của mẫu kế tiếp. */
  written = 0;

  constructor(size: number) {
    this.data = new Float32Array(size);
  }

  push(chunk: ArrayLike<number>): void {
    const size = this.data.length;
    for (let i = 0; i < chunk.length; i++) this.data[(this.written + i) % size] = chunk[i];
    this.written += chunk.length;
  }

  /** Chép đoạn [from, to) theo vị trí tuyệt đối. Phần đã trôi khỏi bộ nhớ (hoặc chưa có) là 0. */
  read(from: number, to: number): Float32Array {
    const out = new Float32Array(to - from);
    const size = this.data.length;
    const oldest = this.written - size;
    for (let i = from; i < to; i++) {
      if (i >= 0 && i >= oldest && i < this.written) out[i - from] = this.data[i % size];
    }
    return out;
  }
}

export class MicNoteListener {
  /** Những phím bản nhạc đang chờ — xem `DetectOptions.hint`. Chỗ gọi cập nhật mỗi khi con trỏ nhích. */
  hint: readonly number[] = [];
  /** Nhiều nhất bao nhiêu nốt một lần đánh. */
  maxNotes = 4;
  /** Chỉ xét phím trong khoảng này. Để trống là cả dải. */
  range: readonly [number, number] | undefined;

  readonly sampleRate: number;
  private readonly onNotes: (event: HeardEvent) => void;
  private readonly ring: Ring;
  private readonly frameSize: number;
  private readonly hop: number;
  private readonly analysisSize: number;

  private nextFrameEnd: number;
  /** Hai khung phổ gần nhất (đã nén), cũ trước mới sau. */
  private previousLogs: Float64Array[] = [];
  private fluxHistory: number[] = [];
  /** Hai khung gần nhất, để bắt đỉnh: khung giữa phải cao hơn hai bên. */
  private fluxPrev = 0;
  private fluxPrevPrev = 0;
  private prevFrameEnd = 0;
  private prevLevel = 0;
  private noiseLevel = 0;
  private lastOnset = -Infinity;
  private pending: number[] = [];
  private lastEmitted = new Map<number, number>();
  private level = 0;

  constructor(sampleRate: number, onNotes: (event: HeardEvent) => void) {
    this.sampleRate = sampleRate;
    this.onNotes = onNotes;
    this.frameSize = nextPowerOfTwo(Math.round(sampleRate * LISTENER_TUNING.onsetFrameSeconds));
    this.hop = this.frameSize >> 1;
    this.analysisSize = nextPowerOfTwo(Math.round(sampleRate * LISTENER_TUNING.analysisSeconds));
    this.ring = new Ring(nextPowerOfTwo(Math.round(sampleRate * 1.4)));
    this.nextFrameEnd = this.frameSize;
  }

  /** Âm lượng gần nhất, 0..1, có giữ đỉnh rồi hạ dần — cho thanh đo mức micro. */
  getLevel(): number {
    return this.level;
  }

  /** Quên hết trạng thái dò (khi vừa tạm dừng để app tự phát tiếng, chẳng hạn). */
  reset(): void {
    this.pending = [];
    this.previousLogs = [];
    this.fluxHistory = [];
    this.fluxPrev = 0;
    this.fluxPrevPrev = 0;
    this.lastOnset = this.ring.written;
  }

  push(chunk: ArrayLike<number>): void {
    this.ring.push(chunk);
    const chunkLevel = rms(chunk);
    this.level = Math.max(chunkLevel, this.level * 0.85);

    while (this.ring.written >= this.nextFrameEnd) {
      this.processFrame(this.nextFrameEnd);
      this.nextFrameEnd += this.hop;
    }

    const skip = Math.round(this.sampleRate * LISTENER_TUNING.skipSeconds);
    while (this.pending.length > 0 && this.ring.written >= this.pending[0] + skip + this.analysisSize) {
      this.analyse(this.pending.shift() as number);
    }
  }

  private processFrame(end: number): void {
    const frame = this.ring.read(end - this.frameSize, end);
    const level = rms(frame);

    // Mức ồn nền: hạ xuống ngay khi gặp khung yên hơn, nâng lên thật chậm (~5%/giây).
    if (this.noiseLevel === 0 || level < this.noiseLevel) this.noiseLevel = level;
    else this.noiseLevel *= 1 + 0.05 * (this.hop / this.sampleRate);

    const spectrum = magnitudeSpectrum(frame, this.sampleRate, this.frameSize);
    const lo = Math.max(1, Math.floor(60 / spectrum.binHz));
    const hi = Math.min(spectrum.mag.length - 1, Math.ceil(8000 / spectrum.binHz));
    // Nén theo mức ồn của chính căn phòng này: tiếng ồn nền luôn rơi quanh cùng một
    // mức sau khi nén, dù phòng yên hay ồn, dù micro to hay nhỏ. Nén theo một hằng
    // số cố định thì phòng ồn sinh ra độ vọt ồn to gấp mấy lần phòng yên, và ngưỡng
    // bị kéo lên cao tới mức nuốt luôn nốt nhẹ — đúng lỗi đã gặp khi chỉnh.
    const noisePerBin = Math.max(this.noiseLevel, 1e-5) * Math.sqrt(1.5 / this.frameSize);
    const scale = 1 / (noisePerBin * 4);
    const log = new Float64Array(spectrum.mag.length);
    for (let k = lo; k <= hi; k++) log[k] = Math.log1p(spectrum.mag[k] * scale);

    // So với khung cách hai bước chứ không phải khung liền trước: tiếng búa gõ dài
    // hơn một bước nhảy nên bị chia đôi cho hai khung, mỗi khung chỉ thấy nửa độ
    // vọt. Nốt đánh nhẹ khi đó lọt dưới ngưỡng — đo được là chỉ còn 25 so với ngưỡng 32.
    let flux = 0;
    const older = this.previousLogs[0];
    if (older) {
      for (let k = lo; k <= hi; k++) flux += Math.max(0, log[k] - older[k]);
    }
    this.previousLogs.push(log);
    if (this.previousLogs.length > 2) this.previousLogs.shift();

    // Khung TRƯỚC là đỉnh nếu nó cao hơn khung trước nó và không thấp hơn khung này.
    const history = this.fluxHistory;
    const threshold = median(history) * LISTENER_TUNING.fluxOverMedian + LISTENER_TUNING.fluxMinimum;
    const isPeak = this.fluxPrev > threshold && this.fluxPrev > this.fluxPrevPrev && this.fluxPrev >= flux;
    const loudEnough = Math.max(this.prevLevel, level) > this.noiseLevel * LISTENER_TUNING.levelOverNoise;
    const minGap = this.sampleRate * LISTENER_TUNING.minInterOnsetSeconds;
    // Lúc phím xuống rơi vào nửa sau của khung đỉnh — lấy giữa khung làm mốc.
    const onset = this.prevFrameEnd - (this.frameSize >> 1);

    if (isPeak && loudEnough && onset - this.lastOnset >= minGap) {
      this.lastOnset = onset;
      this.pending.push(onset);
    }

    history.push(flux);
    if (history.length > LISTENER_TUNING.fluxHistory) history.shift();
    this.fluxPrevPrev = this.fluxPrev;
    this.fluxPrev = flux;
    this.prevFrameEnd = end;
    this.prevLevel = level;
  }

  private analyse(onset: number): void {
    const sr = this.sampleRate;
    const n = this.analysisSize;
    const gap = Math.round(sr * LISTENER_TUNING.preGapSeconds);
    const skip = Math.round(sr * LISTENER_TUNING.skipSeconds);

    const before = magnitudeSpectrum(this.ring.read(onset - gap - n, onset - gap), sr);
    const after = magnitudeSpectrum(this.ring.read(onset + skip, onset + skip + n), sr);
    const options: DetectOptions = {
      hint: this.hint,
      maxNotes: this.maxNotes,
      range: this.range,
      onset: { before, after },
    };
    // Nhận nốt trên phần phổ MỚI sáng lên, để nốt tay trái đang giữ không chen vào
    // chỗ của nốt tay phải vừa đánh. Đã thử nhận trên phổ đầy đủ rồi lọc sau: hợp
    // âm tệ hẳn đi, vì nốt cũ to lấn át nốt mới nhẹ. Ca khó của cách này — đánh lại
    // đúng phím còn đang ngân — được lo riêng ở `detectNotes` (xem `ringing`).
    const detected = detectNotes(spectralRise(before, after), options, after);

    const dedupe = sr * LISTENER_TUNING.dedupeSeconds;
    const notes = detected.filter((note) => {
      const last = this.lastEmitted.get(note.midi);
      return last === undefined || onset - last > dedupe;
    });
    if (notes.length === 0) return;
    for (const note of notes) this.lastEmitted.set(note.midi, onset);

    this.onNotes({
      notes,
      onsetSample: onset,
      ageMs: ((this.ring.written - onset) / sr) * 1000,
    });
  }
}
