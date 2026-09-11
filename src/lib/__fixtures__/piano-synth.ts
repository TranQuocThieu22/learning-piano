/**
 * Tiếng đàn tổng hợp cho test của phần nghe qua micro.
 *
 * Cố ý KHÔNG dùng sóng sin trơn: test qua được với sóng sin thì chẳng nói lên gì
 * về tiếng đàn thật. Ở đây dựng những thứ làm việc nhận nốt khó lên:
 *
 * - Nhiều hoạ âm, hoạ âm cao tắt nhanh hơn hoạ âm thấp.
 * - Dây đàn "cứng": hoạ âm cao hơi cao hơn bội số chẵn (hệ số B).
 * - Tiếng búa gõ: một nhát ồn rất ngắn lúc phím xuống.
 * - Micro điện thoại thu kém âm trầm: cắt dần dưới 200Hz, nên nốt gốc của các nốt
 *   tay trái yếu hẳn đi — đúng chỗ dễ nhận nhầm quãng tám nhất.
 * - Tiếng ồn nền của căn phòng.
 *
 * Vẫn chỉ là mô phỏng. Qua được ở đây là điều kiện cần, không phải bằng chứng là
 * chạy tốt trên điện thoại đặt cạnh cây đàn thật.
 */

export const SAMPLE_RATE = 48000;

/** Sinh số giả ngẫu nhiên có hạt giống, để test lần nào chạy cũng ra một kết quả. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NoteSpec {
  midi: number;
  /** Lúc phím xuống, giây. */
  at: number;
  /** Nhả phím lúc nào, giây kể từ lúc xuống. Mặc định ngân tới hết đoạn. */
  duration?: number;
  /** Biên độ đỉnh, 0..1. Mặc định 0.2 (khoảng -14 dBFS). */
  velocity?: number;
}

export interface SynthOptions {
  seconds: number;
  sampleRate?: number;
  /** Biên độ tiếng ồn nền. Mặc định 0.001 (khoảng -60 dBFS). */
  noise?: number;
  /** Cắt âm trầm như micro điện thoại. Mặc định bật. */
  phoneMic?: boolean;
  seed?: number;
}

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Độ khuếch đại của micro điện thoại ở tần số f: tụt dần dưới 200Hz. */
function phoneMicGain(f: number): number {
  return f >= 200 ? 1 : (f / 200) ** 2;
}

export function synthPiano(notes: NoteSpec[], options: SynthOptions): Float32Array {
  const sr = options.sampleRate ?? SAMPLE_RATE;
  const length = Math.round(options.seconds * sr);
  const out = new Float64Array(length);
  const random = seededRandom(options.seed ?? 1);
  const phoneMic = options.phoneMic ?? true;

  for (const note of notes) {
    const f0 = midiToFreq(note.midi);
    const velocity = note.velocity ?? 0.2;
    const start = Math.round(note.at * sr);
    const end = note.duration === undefined ? length : Math.min(length, start + Math.round(note.duration * sr));
    // Nốt trầm dây cứng ít hơn nốt cao một chút — đủ để có lệch mà không quá tay.
    const B = 0.00008 + 0.00002 * Math.max(0, note.midi - 48) / 12;

    const partials: { f: number; amp: number; decay: number; phase: number }[] = [];
    for (let h = 1; h <= 16; h++) {
      const f = h * f0 * Math.sqrt(1 + B * h * h);
      if (f > sr / 2 - 1000) break;
      // Hoạ âm giảm dần nhưng không đều, như đàn thật.
      const amp = (1 / h ** 1.1) * (0.6 + 0.8 * random()) * (phoneMic ? phoneMicGain(f) : 1);
      const decay = 1.2 + 0.35 * h; // mỗi giây tắt bớt e^-decay
      partials.push({ f, amp, decay, phase: random() * 2 * Math.PI });
    }
    const norm = partials.reduce((s, p) => s + p.amp, 0) || 1;

    // Cộng từng hoạ âm một bằng phép quay số phức thay vì gọi sin/exp cho từng mẫu:
    // nhanh hơn cả chục lần. Bộ test đo độ chính xác sinh hàng trăm câu nhạc, mà
    // lệnh build trên Vercel chạy luôn vitest — chậm ở đây là chậm mỗi lần deploy.
    const voice = new Float64Array(end - start);
    for (const p of partials) {
      const w = (2 * Math.PI * p.f) / sr;
      const damp = Math.exp(-p.decay / sr);
      const cr = Math.cos(w) * damp;
      const ci = Math.sin(w) * damp;
      let re = p.amp * Math.sin(p.phase);
      let im = p.amp * Math.cos(p.phase);
      for (let i = 0; i < voice.length; i++) {
        voice[i] += re;
        const next = re * cr + im * ci;
        im = im * cr - re * ci;
        re = next;
      }
    }
    for (let i = start; i < end; i++) {
      const t = (i - start) / sr;
      // Tiếng lên trong 4ms rồi tắt dần; nhả phím thì tắt nhanh trong 60ms.
      const attack = Math.min(1, t / 0.004);
      const release = end - i < 0.06 * sr ? (end - i) / (0.06 * sr) : 1;
      out[i] += (velocity * attack * release * voice[i - start]) / norm;
      // Nhát búa: tiếng ồn rất ngắn, tắt trong khoảng 8ms.
      if (t < 0.02) out[i] += velocity * 0.15 * (random() * 2 - 1) * Math.exp(-t / 0.008);
    }
  }

  const noise = options.noise ?? 0.001;
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) result[i] = out[i] + noise * (random() * 2 - 1) * 1.7;
  return result;
}
