import { arpeggioForBar, chordAt, midiToFreq, type AmbientChord } from './ambient';

/**
 * Bộ phát nhạc nền, dựng trực tiếp bằng Web Audio — không có tệp nhạc nào được
 * tải về. Lý do chọn cách này ghi ở đầu `ambient.ts`.
 *
 * **Bản này là bản "vui nhộn"**, thay cho bản đầu tiên vốn là một mảng hoà âm
 * ngân dài kiểu thiền. Bản cũ nghe êm nhưng ru ngủ, mà thứ cần ở đây là làm
 * người học thấy hứng ngồi vào đàn. Ba tầng tiếng, mỗi tầng một việc:
 *
 * - **Rải nốt (arpeggio)** — tầng chính, tiếng gảy ngắn như hộp nhạc, tám móc
 *   đơn mỗi ô nhịp. Đây là thứ tạo chuyển động và sự vui.
 * - **Nốt trầm** — đánh ở phách 1 và phách 3, cho có chỗ tựa.
 * - **Nền mỏng** — hợp âm ngân rất khẽ bên dưới, chỉ để hai tầng trên không
 *   nghe trơ trọi. Cố ý nhỏ hơn hẳn, khoảng một phần ba tầng rải.
 *
 * Vài chỗ quyết định bằng số, ghi lại kẻo sau này sửa mò:
 *
 * - **100 nhịp/phút.** Nhanh hơn là thành nhạc tập thể dục, chậm hơn là về lại
 *   chỗ buồn ngủ của bản cũ.
 * - **Mỗi hợp âm hai ô nhịp** (4,8 giây), đổi hợp âm ở đầu ô — đủ nhanh để nghe
 *   là có bài, đủ chậm để không rối.
 * - **Tiếng gảy tắt trong khoảng 0,6 giây.** Dài hơn thì các nốt chồng lên nhau
 *   thành một đám mờ, mất hẳn cảm giác nảy.
 * - **Lọc thông thấp 3000Hz**, sáng hơn hẳn mức 900Hz của bản cũ. Vẫn cắt phần
 *   chói trên cùng để nghe lâu không mệt.
 *
 * Lịch phát dùng đúng cách của `Metronome.tsx`: hẹn trước bằng đồng hồ của Web
 * Audio, còn `setInterval` chỉ để thỉnh thoảng ngó xem đã đến lúc hẹn tiếp chưa.
 * Đồng hồ của trình duyệt không chính xác, đồng hồ của Web Audio thì có.
 */

const BPM = 100;
const BEAT_SECONDS = 60 / BPM;
const BAR_SECONDS = BEAT_SECONDS * 4;
/** Mỗi hợp âm kéo dài hai ô nhịp. */
const BARS_PER_CHORD = 2;
/** Hẹn trước bao nhiêu, và bao lâu ngó lại một lần. */
const SCHEDULE_AHEAD_SECONDS = 4;
const LOOKAHEAD_MS = 500;

/**
 * Trần âm lượng. Người học kéo thanh trượt 0..1, nhân với số này ra gain thật.
 *
 * Đo bằng máy chứ không chỉnh bằng cảm giác. Ở 0,22: mặc định (thanh trượt 50%)
 * cho đỉnh 0,10 và RMS 0,014; kéo hết cỡ cho đỉnh 0,21 và RMS 0,026 — còn xa mức
 * vỡ tiếng. Chênh lệch đỉnh/RMS lớn là đúng với kiểu tiếng này: tiếng gảy nhọn
 * đỉnh nhưng tắt nhanh, nên nghe vẫn nhẹ dù đỉnh cao.
 *
 * Đo thì phải lấy mẫu TRẢI RA theo thời gian. `getFloatTimeDomainData` luôn trả
 * về khung hiện tại, gọi liên tiếp trong một vòng lặp chỉ nhìn được khoảng 46ms
 * — mà tiếng gảy cách nhau 300ms, nên cửa sổ đó rơi trúng chỗ lặng là ra số 0
 * rồi tưởng nhạc không kêu.
 */
const MAX_GAIN = 0.22;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBarTime = 0;
  private barIndex = 0;
  private volume: number;
  /** Mọi nốt đã hẹn nhưng chưa tắt, giữ để dừng cho êm khi người học bấm tắt. */
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
      filter.frequency.value = 3000;
      filter.Q.value = 0.7;

      // Nén ở cuối chuỗi: rải nốt chồng lên nốt trầm có lúc trùng đỉnh sóng.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;

      master.connect(filter).connect(comp).connect(this.ctx.destination);
      this.master = master;
    }

    /*
     * Giữ lấy tham chiếu TRƯỚC khi chờ, rồi kiểm lại sau khi chờ xong.
     *
     * `resume()` là bất đồng bộ, mà trong lúc chờ thì `dispose()` có thể đã chạy
     * và đặt `this.ctx` về null — React ở chế độ Strict gỡ rồi gắn lại component
     * ngay trong một nhịp, nên chuyện này xảy ra thật chứ không phải giả thiết.
     * Thiếu chỗ kiểm này thì `this.ctx.state` ném lỗi "reading 'state' of null"
     * và cả trang gãy.
     */
    const ctx = this.ctx;
    await ctx.resume().catch(() => {});
    if (this.ctx !== ctx || ctx.state !== 'running') return false;

    // Bắt đầu lại từ đầu vòng, để lần nào bật cũng vào đúng phách 1 của hợp âm C.
    this.barIndex = 0;
    this.nextBarTime = ctx.currentTime + 0.15;
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
    this.schedule();
    return true;
  }

  /** Tắt nhạc, hạ dần trong một giây chứ không cắt phựt. */
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
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
      for (const osc of voice.osc) {
        try {
          osc.stop(now + 1.05);
        } catch {
          // Nốt đã hẹn stop từ trước rồi; gọi lại là vô hại.
        }
      }
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
    if (ctx) setTimeout(() => ctx.close().catch(() => {}), 1200);
  }

  /** Hẹn trước các ô nhịp sắp tới, gọi lại đều đặn trong lúc đang chạy. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;

    while (this.nextBarTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const chord = chordAt(Math.floor(this.barIndex / BARS_PER_CHORD));
      this.playBar(chord, this.barIndex, this.nextBarTime);
      this.barIndex += 1;
      this.nextBarTime += BAR_SECONDS;
    }

    // Nốt đã tắt thì bỏ khỏi danh sách, kẻo chạy lâu là phình mãi.
    if (this.voices.length > 64) this.voices = this.voices.slice(-64);
  }

  /** Một ô nhịp: nền mỏng (chỉ ở ô đầu của hợp âm), nốt trầm, và tám móc rải. */
  private playBar(chord: AmbientChord, barIndex: number, at: number): void {
    if (barIndex % BARS_PER_CHORD === 0) {
      this.playPad(chord, at);
    }

    // Nốt trầm ở phách 1 và phách 3: phách 1 là gốc, phách 3 là quãng năm.
    this.playBass(chord.bass, at);
    this.playBass(chord.bass + 7, at + BEAT_SECONDS * 2);

    const pattern = arpeggioForBar(barIndex);
    pattern.forEach((toneIndex, step) => {
      if (toneIndex === null) return;
      const midi = chord.tones[toneIndex % chord.tones.length];
      this.playPluck(midi, at + step * (BEAT_SECONDS / 2), step);
    });
  }

  /** Tiếng gảy ngắn cho tầng rải — hai bộ dao động, tắt nhanh như hộp nhạc. */
  private playPluck(midi: number, at: number, step: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const gain = ctx.createGain();
    // Phách mạnh nhấn hơn một chút, để tai nghe ra ô nhịp mà không cần trống.
    const peak = step % 4 === 0 ? 0.5 : 0.34;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);

    const pan = ctx.createStereoPanner();
    // Lệch trái phải rất nhẹ theo từng móc, cho tiếng rộng ra chứ không đứng im.
    pan.pan.value = ((step % 4) - 1.5) * 0.12;

    gain.connect(pan).connect(master);

    const freq = midiToFreq(midi);
    const oscs: OscillatorNode[] = [];
    // Bồi âm quãng tám rất khẽ: đủ để tiếng gảy có ánh kim, không thành chói.
    for (const [type, mul, level] of [
      ['triangle', 1, 1],
      ['sine', 2, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mul;
      const trim = ctx.createGain();
      trim.gain.value = level;
      osc.connect(trim).connect(gain);
      osc.start(at);
      osc.stop(at + 0.7);
      oscs.push(osc);
    }
    this.voices.push({ osc: oscs, gain });
  }

  /** Nốt trầm, tròn và ngắn. */
  private playBass(midi: number, at: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.55, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    gain.connect(master);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = midiToFreq(midi);
    osc.connect(gain);
    osc.start(at);
    osc.stop(at + 1);

    this.voices.push({ osc: [osc], gain });
  }

  /** Nền mỏng: cả hợp âm ngân khẽ suốt hai ô nhịp, vào và ra đều mềm. */
  private playPad(chord: AmbientChord, at: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const keoDai = BAR_SECONDS * BARS_PER_CHORD;

    for (const midi of chord.tones.slice(0, 3)) {
      const gain = ctx.createGain();
      // Rất nhỏ so với tầng rải: đây là lớp đệm, không phải giai điệu.
      const peak = 0.1 / 3;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(peak, at + 0.4);
      gain.gain.setValueAtTime(peak, at + keoDai - 0.6);
      gain.gain.linearRampToValueAtTime(0.0001, at + keoDai);
      gain.connect(master);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = midiToFreq(midi);
      // Lệch nhẹ cho lớp đệm dày lên một chút.
      osc.detune.value = 5;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + keoDai + 0.1);

      this.voices.push({ osc: [osc], gain });
    }
  }
}
