/**
 * Bộ phát tiếng lúc người học **đang bấm phím**: đàn gửi nốt về, điện thoại kêu ngay.
 *
 * Khác hẳn phần nghe mẫu (`useSheetAudio`, abcjs): ở đó cả bản nhạc được hẹn lịch trước
 * nên chậm vài chục ms không ai biết, còn ở đây tiếng phải ra **ngay lúc ngón tay chạm
 * đáy phím**. Chậm quá 50ms là người học tưởng tay mình sai nhịp chứ không nghĩ máy chậm.
 * Vì vậy mọi thứ ở đây tránh việc nặng: mẫu âm giải mã sẵn, bấm phím chỉ còn dựng một nút
 * phát và bật nó.
 *
 * Đây cũng là phần app phải có trước khi tính tới cây đàn gập không phát tiếng — xem dòng
 * quyết định về phần cứng ở mục 1 của `docs/_internal/nhat-ky-quyet-dinh.md`.
 *
 * `AudioContext` nhận qua tham số, không tự dựng: quy tắc 2 của
 * `.claude/skills/code-standards/SKILL.md` — phần tính toán phải chạy được trong vitest ở
 * `environment: 'node'`, nên thứ thuộc về trình duyệt đi vào bằng cửa tham số.
 */

/** Tải mẫu âm một nốt. Trả `null` khi nốt đó không có mẫu. */
export type SampleLoader = (midi: number) => Promise<AudioBuffer | null>;

export interface LivePianoOptions {
  loadSample: SampleLoader;
  /** Tối đa bao nhiêu nốt cùng kêu. Vượt thì nốt cũ nhất bị dập. */
  maxVoices?: number;
  /**
   * Tiếng đi ra đâu. Bỏ trống là thẳng ra loa. Hook đặt một bộ nén ở đây để bấm cả
   * hợp âm không vỡ tiếng — dựng bộ nén là việc của trình duyệt nên không nằm trong file này.
   */
  output?: AudioNode;
}

/**
 * Tiếng tắt trong bao lâu sau khi nhả phím.
 *
 * Đây là cái hãm (damper) của cây piano thật rơi xuống dây: không tắt phụt, cũng không
 * ngân mãi. Ngắn hơn 0,1 giây nghe như bị cắt ngang; dài hơn 0,3 giây thì đánh nhanh
 * các nốt chồng lên nhau thành một đám.
 */
const RELEASE_SECONDS = 0.16;

/** Dập nhanh: bấm lại đúng phím đang kêu, hoặc phải nhường chỗ cho nốt mới. */
const FAST_RELEASE_SECONDS = 0.04;

/**
 * `setTargetAtTime` đi theo hàm mũ nên không bao giờ chạm 0. Nhân hằng số thời gian
 * với số này rồi mới tắt hẳn nguồn phát — lúc đó tiếng đã nhỏ hơn mức nghe thấy.
 */
const RELEASE_TAIL = 4;

/**
 * Trần số nốt cùng kêu. Điện thoại tầm trung bắt đầu rè khi quá nhiều nguồn phát chạy
 * cùng lúc, mà người học đạp pedal giữ cả một đoạn thì số nốt dồn lên rất nhanh.
 * 24 đủ cho hai tay cộng pedal; vượt nữa là tai cũng không tách ra nổi.
 */
const DEFAULT_MAX_VOICES = 24;

/**
 * Xa nhất bao nhiêu nửa cung thì còn cho mượn mẫu âm của nốt khác.
 *
 * Mượn xa hơn một quãng tám thì tiếng méo rõ (kéo tốc độ phát gấp đôi nghe ra ngay).
 * Thà im một nốt trong lúc mẫu âm đang tải còn hơn kêu ra một tiếng lạ.
 */
const MAX_BORROW_SEMITONES = 12;

/**
 * Lực bấm đổi thành âm lượng.
 *
 * Mẫu âm MusyngKite thu ở một mức lực duy nhất, nên "đánh nhẹ" ở đây là cùng tiếng ấy
 * phát nhỏ hơn, không phải tiếng búa chạm nhẹ. Số mũ 1,5 là chỗ cân: để tuyến tính
 * (mũ 1) thì đánh nhẹ vẫn to gần bằng đánh mạnh, mà bình phương thì nốt nhẹ mất hút.
 */
export function velocityGain(velocity: number): number {
  const v = Math.min(127, Math.max(0, velocity)) / 127;
  return v ** 1.5;
}

/** Phát mẫu âm của nốt `source` ở tốc độ nào để ra đúng cao độ nốt `target`. */
export function playbackRateFor(target: number, source: number): number {
  return 2 ** ((target - source) / 12);
}

/** Nốt đã có mẫu âm gần `midi` nhất, trong khoảng còn cho mượn. Không có thì `null`. */
export function nearestLoaded(loaded: Iterable<number>, midi: number): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (const candidate of loaded) {
    const distance = Math.abs(candidate - midi);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best !== null && bestDistance <= MAX_BORROW_SEMITONES ? best : null;
}

interface Voice {
  midi: number;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
}

export class LivePiano {
  private readonly ctx: AudioContext;
  private readonly loadSample: SampleLoader;
  private readonly maxVoices: number;
  private readonly master: GainNode;

  private readonly buffers = new Map<number, AudioBuffer>();
  private readonly loading = new Map<number, Promise<void>>();
  private voices: Voice[] = [];

  /** Đang đạp pedal ngân (CC64). */
  private pedalDown = false;
  /** Phím đã nhả nhưng còn kêu vì pedal đang giữ. */
  private readonly sustained = new Set<number>();

  constructor(ctx: AudioContext, options: LivePianoOptions) {
    this.ctx = ctx;
    this.loadSample = options.loadSample;
    this.maxVoices = options.maxVoices ?? DEFAULT_MAX_VOICES;
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(options.output ?? ctx.destination);
  }

  /** Đã có sẵn mẫu âm của bao nhiêu nốt. */
  get loadedCount(): number {
    return this.buffers.size;
  }

  setVolume(value: number) {
    this.master.gain.value = Math.min(1, Math.max(0, value));
  }

  /**
   * Tải trước mẫu âm cho một dãy nốt.
   *
   * Tải trước chứ không đợi lúc bấm: giải mã mp3 mất vài chục ms, đúng bằng khoảng
   * trễ mà cả tính năng này đang cố tránh.
   */
  async preload(midis: number[], onProgress?: (done: number, total: number) => void): Promise<void> {
    let done = 0;
    // Sáu tệp một lượt: đủ nhanh trên 4G, không làm nghẽn những việc khác của trang.
    const queue = [...midis];
    const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
      for (let midi = queue.shift(); midi !== undefined; midi = queue.shift()) {
        await this.ensureLoaded(midi);
        done++;
        onProgress?.(done, midis.length);
      }
    });
    await Promise.all(workers);
  }

  private ensureLoaded(midi: number): Promise<void> {
    if (this.buffers.has(midi)) return Promise.resolve();
    const running = this.loading.get(midi);
    if (running) return running;

    const job = this.loadSample(midi)
      .then((buffer) => {
        if (buffer) this.buffers.set(midi, buffer);
      })
      .catch(() => {
        // Tải trượt một nốt không được làm hỏng cả buổi tập: nốt đó mượn mẫu âm nốt bên
        // cạnh, và lần bấm sau sẽ thử tải lại.
      })
      .finally(() => {
        this.loading.delete(midi);
      });

    this.loading.set(midi, job);
    return job;
  }

  /**
   * Một phím vừa xuống. Trả `false` khi chưa có mẫu âm nào đủ gần để kêu — lúc đó mẫu âm
   * được tải ngầm, phím sau đã có tiếng.
   */
  noteOn(midi: number, velocity = 100): boolean {
    void this.ensureLoaded(midi);

    const sourceMidi = this.buffers.has(midi) ? midi : nearestLoaded(this.buffers.keys(), midi);
    if (sourceMidi === null) return false;
    const buffer = this.buffers.get(sourceMidi);
    if (!buffer) return false;

    // Bấm lại phím đang kêu: dập tiếng cũ trước, đúng như cái hãm rơi xuống rồi búa gõ lại.
    this.releaseNote(midi, FAST_RELEASE_SECONDS);
    this.sustained.delete(midi);
    this.trimVoices();

    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.value = velocityGain(velocity);
    gain.connect(this.master);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRateFor(midi, sourceMidi);
    source.connect(gain);
    source.start();

    const voice: Voice = { midi, source, gain, startedAt: now };
    source.onended = () => {
      gain.disconnect();
      this.voices = this.voices.filter((v) => v !== voice);
    };
    this.voices.push(voice);
    return true;
  }

  /** Một phím vừa nhả. Đang đạp pedal thì nốt còn ngân tới lúc nhả pedal. */
  noteOff(midi: number) {
    if (this.pedalDown) {
      this.sustained.add(midi);
      return;
    }
    this.releaseNote(midi, RELEASE_SECONDS);
  }

  /** Pedal ngân (CC64). Nhả pedal thì mọi nốt đang chờ tắt cùng lúc, như cây đàn thật. */
  setPedal(down: boolean) {
    this.pedalDown = down;
    if (down) return;
    for (const midi of this.sustained) this.releaseNote(midi, RELEASE_SECONDS);
    this.sustained.clear();
  }

  /** Tắt mọi tiếng đang kêu — dùng khi rời trang hoặc đổi tiếng đàn. */
  allNotesOff() {
    for (const voice of [...this.voices]) this.stopVoice(voice, FAST_RELEASE_SECONDS);
    this.sustained.clear();
  }

  /**
   * Dọn hẳn. Phải gọi khi component bị gỡ: thứ dựng ngoài React vẫn sống sau khi rời
   * trang, vì điều hướng Next.js không tải lại trang (bẫy 15).
   */
  dispose() {
    this.allNotesOff();
    this.master.disconnect();
    this.buffers.clear();
  }

  private releaseNote(midi: number, seconds: number) {
    for (const voice of this.voices.filter((v) => v.midi === midi)) this.stopVoice(voice, seconds);
  }

  private stopVoice(voice: Voice, seconds: number) {
    const now = this.ctx.currentTime;
    const level = voice.gain.gain;
    level.cancelScheduledValues(now);
    // Giữ đúng mức đang kêu rồi mới hạ: bỏ dòng này thì tiếng nhảy về mức mặc định 1
    // trước khi tắt, tức là nốt đánh nhẹ lại kêu to lên lúc nhả phím.
    level.setValueAtTime(level.value, now);
    level.setTargetAtTime(0, now, seconds);
    try {
      voice.source.stop(now + seconds * RELEASE_TAIL);
    } catch {
      // Nốt đã dừng rồi thì gọi lại `stop` ném lỗi — không có gì phải làm.
    }
    this.voices = this.voices.filter((v) => v !== voice);
  }

  /** Quá nhiều nốt cùng kêu thì dập nốt cũ nhất. */
  private trimVoices() {
    while (this.voices.length >= this.maxVoices) {
      const oldest = this.voices.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b));
      this.stopVoice(oldest, FAST_RELEASE_SECONDS);
    }
  }
}
