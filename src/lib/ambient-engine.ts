import { chordAt, midiToFreq } from './ambient';

/**
 * Bộ phát nhạc nền, dựng trực tiếp bằng Web Audio — không có tệp nhạc nào được
 * tải về. Lý do chọn cách này ghi ở đầu `ambient.ts`.
 *
 * Cách tạo tiếng, và vì sao từng chỗ lại như vậy:
 *
 * - **Mỗi nốt là hai bộ dao động lệch nhau vài cent.** Một bộ dao động sine
 *   thuần nghe như tiếng máy đo thính lực. Hai bộ lệch nhẹ thì pha của chúng
 *   trôi qua nhau, tạo ra chuyển động chậm bên trong tiếng ngân — đó là thứ làm
 *   nó nghe "ấm" chứ không phải hiệu ứng nào thêm vào.
 * - **Vào chậm 4 giây, tắt chậm 6 giây, hai hợp âm chồng lên nhau.** Nhạc nền
 *   không được có điểm bắt đầu rõ ràng; nghe thấy chỗ hợp âm đổi là tai sẽ bám
 *   theo, mà bám theo thì hết là nền.
 * - **Lọc thông thấp 900Hz, có LFO đưa qua đưa lại rất chậm.** Cắt phần cao đi
 *   để nó không tranh chỗ với tiếng đàn thật của người học, vốn nằm đúng vùng
 *   đó. LFO 0,05Hz (một vòng 20 giây) giữ cho tiếng không đứng chết một chỗ.
 * - **Nén ở cuối chuỗi.** Bốn nốt cộng lại có lúc trùng đỉnh sóng; không nén thì
 *   đúng khoảnh khắc đó bị vỡ tiếng.
 *
 * Lịch phát dùng đúng cách của `Metronome.tsx`: hẹn trước bằng đồng hồ của Web
 * Audio, còn `setInterval` chỉ để thỉnh thoảng ngó xem đã đến lúc hẹn tiếp chưa.
 * Đồng hồ của trình duyệt không chính xác, đồng hồ của Web Audio thì có.
 */

/** Mỗi hợp âm ngân bấy nhiêu giây trước khi hợp âm sau chồng vào. */
const CHORD_SECONDS = 11;
/** Hai hợp âm chồng lên nhau bấy nhiêu giây. */
const OVERLAP_SECONDS = 5;
const ATTACK_SECONDS = 4;
const RELEASE_SECONDS = 6;
/** Hẹn trước bao nhiêu, và bao lâu ngó lại một lần. */
const SCHEDULE_AHEAD_SECONDS = 20;
const LOOKAHEAD_MS = 2000;

/**
 * Trần âm lượng. Người học kéo thanh trượt 0..1, nhân với số này ra gain thật.
 *
 * Đo bằng máy chứ không chỉnh bằng cảm giác. Ở 0,28, kéo thanh trượt hết cỡ thì
 * đỉnh sóng khoảng 0,09 lúc một hợp âm ngân, và lên chừng 0,14 (khoảng -17dBFS)
 * ở đoạn hai hợp âm chồng nhau — vẫn còn rất xa mức vỡ tiếng, và đó chính là lúc
 * bộ nén ở cuối chuỗi làm việc. Mặc định thanh trượt ở 50%: nghe rõ là có nhạc
 * nhưng không tranh chỗ với tiếng đàn.
 */
const MAX_GAIN = 0.28;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextChordTime = 0;
  private chordIndex = 0;
  private volume: number;
  /** Các nốt đang ngân, giữ lại để tắt cho êm khi người học bấm dừng. */
  private voices: { osc: OscillatorNode[]; gain: GainNode }[] = [];

  constructor(volume: number) {
    this.volume = volume;
  }

  get running(): boolean {
    return this.timer !== null;
  }

  /**
   * Bật nhạc. Trả về `true` nếu đã kêu thật, `false` nếu trình duyệt còn treo
   * bối cảnh âm thanh — lúc đó phía gọi nên thử lại trong một cú chạm của người
   * dùng, vì trình duyệt chỉ cho phát tiếng trong cử chỉ thật.
   */
  async start(): Promise<boolean> {
    if (this.running) return true;

    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;

    if (!this.ctx) {
      this.ctx = new Ctor();

      const master = this.ctx.createGain();
      master.gain.value = this.volume * MAX_GAIN;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.7;

      // LFO đưa tần số cắt qua lại 900 ± 250Hz, mỗi vòng 20 giây.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoDepth = this.ctx.createGain();
      lfoDepth.gain.value = 250;
      lfo.connect(lfoDepth).connect(filter.frequency);
      lfo.start();

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.ratio.value = 4;

      master.connect(filter).connect(comp).connect(this.ctx.destination);
      this.master = master;
    }

    await this.ctx.resume().catch(() => {});
    if (this.ctx.state !== 'running') return false;

    this.nextChordTime = this.ctx.currentTime + 0.2;
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
    this.schedule();
    return true;
  }

  /** Tắt nhạc, hạ dần trong hai giây chứ không cắt phựt. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    for (const voice of this.voices) {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
      for (const osc of voice.osc) osc.stop(now + 2.1);
    }
    this.voices = [];
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.master && this.ctx) {
      // Đổi dần trong nửa giây: nhảy thẳng một giá trị mới sinh ra tiếng "tách".
      this.master.gain.linearRampToValueAtTime(volume * MAX_GAIN, this.ctx.currentTime + 0.5);
    }
  }

  /**
   * Dẹp hẳn, gọi khi component bị gỡ.
   *
   * Phải đóng cả `AudioContext` chứ không chỉ dừng lịch phát — xem bẫy 15 trong
   * `docs/_internal/bay-ky-thuat.md`: điều hướng trong Next.js không tải lại
   * trang, nên thứ tạo ngoài React vẫn sống nguyên sau khi component biến mất.
   */
  dispose(): void {
    this.stop();
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx) setTimeout(() => ctx.close().catch(() => {}), 2200);
  }

  /** Hẹn trước các hợp âm sắp tới, gọi lại đều đặn trong lúc đang chạy. */
  private schedule(): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    while (this.nextChordTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      this.playChord(chordAt(this.chordIndex), this.nextChordTime);
      this.chordIndex += 1;
      this.nextChordTime += CHORD_SECONDS - OVERLAP_SECONDS;
    }

    // Nốt đã tắt hẳn thì bỏ khỏi danh sách, kẻo chạy lâu là phình mãi.
    this.voices = this.voices.filter((v) => v.gain.gain.value > 0.0001 || v.osc.length > 0);
    if (this.voices.length > 24) this.voices = this.voices.slice(-24);
  }

  private playChord(chord: { notes: number[] }, at: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    chord.notes.forEach((midi, i) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      // Nốt trầm để to hơn nốt cao một chút: tai người nghe tần số thấp yếu hơn,
      // chia đều gain thì hợp âm nghe mỏng và chua.
      const peak = (0.9 - i * 0.15) / chord.notes.length;
      gain.gain.linearRampToValueAtTime(peak, at + ATTACK_SECONDS);
      gain.gain.setValueAtTime(peak, at + CHORD_SECONDS - RELEASE_SECONDS);
      gain.gain.linearRampToValueAtTime(0.0001, at + CHORD_SECONDS);

      const pan = ctx.createStereoPanner();
      // Trải các nốt sang hai bên để hợp âm rộng ra, nốt trầm giữ ở giữa.
      pan.pan.value = i === 0 ? 0 : ((i % 2 === 0 ? 1 : -1) * (0.15 + i * 0.08));

      gain.connect(pan).connect(master);

      const freq = midiToFreq(midi);
      const oscs = [0, 1].map((k) => {
        const osc = ctx.createOscillator();
        osc.type = k === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        // Lệch 4 cent về hai phía. Nhiều hơn là nghe phô, ít hơn thì mất chuyển động.
        osc.detune.value = k === 0 ? -4 : 4;
        // Bộ dao động triangle nhiều bồi âm hơn nên phải nhỏ tiếng lại.
        const trim = ctx.createGain();
        trim.gain.value = k === 0 ? 1 : 0.35;
        osc.connect(trim).connect(gain);
        osc.start(at);
        osc.stop(at + CHORD_SECONDS + 0.2);
        return osc;
      });

      this.voices.push({ osc: oscs, gain });
    });
  }
}
