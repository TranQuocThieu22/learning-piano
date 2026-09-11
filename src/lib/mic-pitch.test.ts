import { describe, expect, it } from 'vitest';
import { detectNotes, magnitudeSpectrum, midiToFreq, spectralRise, fftInPlace } from './mic-pitch';
import { SAMPLE_RATE, synthPiano, type NoteSpec } from './__fixtures__/piano-synth';

/** Độ dài đoạn phân tích — phải khớp `ANALYSIS_SAMPLES` của mic-listener ở 48kHz. */
const N = 4096;

/** Dựng tiếng rồi lấy phổ của đoạn ngay sau lúc phím xuống (bỏ qua nhát búa). */
function detectAt(notes: NoteSpec[], options: Parameters<typeof detectNotes>[1] = {}, synth = {}) {
  const at = Math.min(...notes.map((n) => n.at));
  const audio = synthPiano(notes, { seconds: at + 0.4, ...synth });
  const from = Math.round((at + 0.025) * SAMPLE_RATE);
  const spectrum = magnitudeSpectrum(audio.subarray(from, from + N), SAMPLE_RATE);
  return detectNotes(spectrum, options).map((n) => n.midi);
}

describe('fftInPlace', () => {
  it('sóng sin rơi đúng dải tần của nó', () => {
    const n = 1024;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 37 * i) / n);
    fftInPlace(re, im);
    const mags = Array.from({ length: n / 2 }, (_, k) => Math.hypot(re[k], im[k]));
    expect(mags.indexOf(Math.max(...mags))).toBe(37);
  });
});

describe('detectNotes — một nốt', () => {
  // Cả dải giáo trình đang dùng: tay trái từ Đô3, tay phải lên tới Đô5, thêm hai
  // đầu thừa ra một quãng tám để chắc không vỡ ở rìa.
  const range = Array.from({ length: 49 }, (_, i) => 48 + i); // Đô3..Đô7

  it.each(range)('nhận đúng phím %i, không nhầm quãng tám', (midi) => {
    expect(detectAt([{ midi, at: 0.05 }])[0]).toBe(midi);
  });

  it.each([36, 40, 43, 45, 47])('nốt rất trầm %i vẫn đúng dù micro gần như không thu được nốt gốc', (midi) => {
    expect(detectAt([{ midi, at: 0.05 }])[0]).toBe(midi);
  });

  it('đánh một nốt thì chỉ báo đúng một nốt, không đẻ thêm nốt ma từ hoạ âm', () => {
    for (const midi of [48, 55, 60, 64, 67, 72]) {
      expect(detectAt([{ midi, at: 0.05 }])).toEqual([midi]);
    }
  });

  it('đánh nhẹ (pp) vẫn nhận ra', () => {
    expect(detectAt([{ midi: 64, at: 0.05, velocity: 0.02 }])).toEqual([64]);
  });

  it('phân biệt được hai phím sát nhau: Mi và Pha', () => {
    expect(detectAt([{ midi: 64, at: 0.05 }])).toEqual([64]);
    expect(detectAt([{ midi: 65, at: 0.05 }])).toEqual([65]);
  });

  it('không micro điện thoại (thu đủ âm trầm) cũng vẫn đúng', () => {
    for (const midi of [48, 60, 72]) {
      expect(detectAt([{ midi, at: 0.05 }], {}, { phoneMic: false })).toEqual([midi]);
    }
  });

  it('phòng im lặng, chỉ có tiếng ồn: không báo nốt nào', () => {
    const audio = synthPiano([], { seconds: 0.2, noise: 0.003 });
    const spectrum = magnitudeSpectrum(audio.subarray(0, N), SAMPLE_RATE);
    expect(detectNotes(spectrum)).toEqual([]);
  });

  it('một tiếng bíp kiểu máy đánh nhịp ngoài dải đang xét thì bị bỏ qua', () => {
    const sr = SAMPLE_RATE;
    const beep = new Float32Array(N).map((_, i) => 0.2 * Math.sin((2 * Math.PI * 1760 * i) / sr));
    const notes = detectNotes(magnitudeSpectrum(beep, sr), { range: [48, 79] });
    expect(notes).toEqual([]);
  });
});

describe('detectNotes — nhiều nốt cùng lúc', () => {
  const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

  it('hợp âm Đô trưởng tay phải (Đô4-Mi4-Sol4)', () => {
    expect(sorted(detectAt([60, 64, 67].map((midi) => ({ midi, at: 0.05 }))))).toEqual([60, 64, 67]);
  });

  it('hợp âm Đô trưởng tay trái (Đô3-Mi3-Sol3), Chương 7', () => {
    expect(sorted(detectAt([48, 52, 55].map((midi) => ({ midi, at: 0.05 }))))).toEqual([48, 52, 55]);
  });

  it('hai tay: Đô3 tay trái và Mi4 tay phải', () => {
    expect(sorted(detectAt([{ midi: 48, at: 0.05 }, { midi: 64, at: 0.05 }]))).toEqual([48, 64]);
  });

  it('Sol4 trùng hoạ âm thứ 3 của Đô3 mà vẫn tách ra được', () => {
    expect(sorted(detectAt([{ midi: 48, at: 0.05 }, { midi: 67, at: 0.05 }]))).toEqual([48, 67]);
  });

  it('hợp âm Pha trưởng tay trái (Đô3-Pha3-La3) — thế đảo của Chương 7', () => {
    expect(sorted(detectAt([48, 53, 57].map((midi) => ({ midi, at: 0.05 }))))).toEqual([48, 53, 57]);
  });

  it('giới hạn số nốt thì chỉ trả về nốt mạnh nhất', () => {
    const notes = detectAt([{ midi: 60, at: 0.05, velocity: 0.3 }, { midi: 67, at: 0.05, velocity: 0.1 }], { maxNotes: 1 });
    expect(notes).toEqual([60]);
  });
});

describe('spectralRise — không báo lại nốt cũ còn đang ngân', () => {
  it('đánh Rê trong lúc Đô còn ngân thì chỉ thấy Rê', () => {
    const audio = synthPiano([{ midi: 60, at: 0.05 }, { midi: 62, at: 0.35 }], { seconds: 0.7 });
    const onset = Math.round(0.35 * SAMPLE_RATE);
    const before = magnitudeSpectrum(audio.subarray(onset - N - 480, onset - 480), SAMPLE_RATE);
    const after = magnitudeSpectrum(audio.subarray(onset + 1200, onset + 1200 + N), SAMPLE_RATE);
    const notes = detectNotes(spectralRise(before, after), {}, after).map((n) => n.midi);
    expect(notes).toEqual([62]);
  });

  it('đánh lại đúng nốt vừa đánh vẫn nhận ra', () => {
    const audio = synthPiano([{ midi: 64, at: 0.05, duration: 0.28 }, { midi: 64, at: 0.35 }], { seconds: 0.7 });
    const onset = Math.round(0.35 * SAMPLE_RATE);
    const before = magnitudeSpectrum(audio.subarray(onset - N - 480, onset - 480), SAMPLE_RATE);
    const after = magnitudeSpectrum(audio.subarray(onset + 1200, onset + 1200 + N), SAMPLE_RATE);
    expect(detectNotes(spectralRise(before, after), {}, after).map((n) => n.midi)).toEqual([64]);
  });
});

describe('midiToFreq', () => {
  it('La4 là 440Hz, Đô4 khoảng 261.6Hz', () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });
});
