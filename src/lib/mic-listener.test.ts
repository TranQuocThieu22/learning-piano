import { describe, expect, it } from 'vitest';
import { MicNoteListener, type HeardEvent } from './mic-listener';
import { SAMPLE_RATE, seededRandom, synthPiano, type NoteSpec, type SynthOptions } from './__fixtures__/piano-synth';

/**
 * Cho tiếng đàn tổng hợp chạy qua bộ nghe theo từng khúc nhỏ như micro thật gửi
 * tới (128 mẫu một lần là cỡ khúc của AudioWorklet), rồi gom lại những gì nó nghe.
 */
function listen(
  notes: NoteSpec[],
  synth: Partial<SynthOptions> = {},
  setup: (l: MicNoteListener) => void = () => {},
  chunk = 128,
): HeardEvent[] {
  const lastEnd = Math.max(0, ...notes.map((n) => n.at));
  const audio = synthPiano(notes, { seconds: lastEnd + 0.6, ...synth });
  const heard: HeardEvent[] = [];
  const listener = new MicNoteListener(synth.sampleRate ?? SAMPLE_RATE, (e) => heard.push(e));
  setup(listener);
  for (let i = 0; i < audio.length; i += chunk) listener.push(audio.subarray(i, i + chunk));
  return heard;
}

const midisOf = (events: HeardEvent[]) => events.map((e) => e.notes.map((n) => n.midi).sort((a, b) => a - b));

/** Giai điệu: mỗi nốt một lần đánh, cách nhau `gap` giây, nốt trước còn ngân khi nốt sau vào. */
function melody(midis: number[], gap = 0.45, start = 0.2): NoteSpec[] {
  return midis.map((midi, i) => ({ midi, at: start + i * gap }));
}

describe('MicNoteListener — giai điệu một tay', () => {
  it('năm nốt thế tay Đô, đánh liền, mỗi nốt báo đúng một lần', () => {
    expect(midisOf(listen(melody([60, 62, 64, 65, 67])))).toEqual([[60], [62], [64], [65], [67]]);
  });

  it('câu mở đầu Ode to Joy (Mi Mi Pha Sol Sol Pha Mi Rê) — có nốt lặp lại liền nhau', () => {
    const ode = [64, 64, 65, 67, 67, 65, 64, 62];
    expect(midisOf(listen(melody(ode, 0.4)))).toEqual(ode.map((m) => [m]));
  });

  it('tay trái khóa Pha (Đô3-Sol3)', () => {
    const left = [48, 50, 52, 53, 55];
    expect(midisOf(listen(melody(left)))).toEqual(left.map((m) => [m]));
  });

  it('đánh nhanh (móc đơn ở 120 nhịp/phút, 250ms một nốt) vẫn không sót', () => {
    const run = [60, 62, 64, 65, 67, 65, 64, 62, 60];
    expect(midisOf(listen(melody(run, 0.25)))).toEqual(run.map((m) => [m]));
  });

  it('to nhỏ khác nhau (Chương 5): nốt nhẹ ngay sau nốt mạnh vẫn nghe thấy', () => {
    const notes: NoteSpec[] = [
      { midi: 60, at: 0.2, velocity: 0.35 },
      { midi: 64, at: 0.6, velocity: 0.03 },
      { midi: 67, at: 1.0, velocity: 0.35 },
      { midi: 64, at: 1.4, velocity: 0.03 },
    ];
    expect(midisOf(listen(notes))).toEqual([[60], [64], [67], [64]]);
  });

  it('báo lại lúc phím xuống đủ gần đúng, để phần chấm nhịp sau khi dừng dùng được', () => {
    const heard = listen(melody([60, 62, 64]));
    heard.forEach((e, i) => {
      const expected = (0.2 + i * 0.45) * SAMPLE_RATE;
      expect(Math.abs(e.onsetSample - expected) / SAMPLE_RATE).toBeLessThan(0.02);
      expect(e.ageMs).toBeGreaterThan(80);
      expect(e.ageMs).toBeLessThan(200);
    });
  });
});

describe('MicNoteListener — hai tay, hợp âm', () => {
  it('hợp âm ba nốt đánh cùng lúc: một lần báo, đủ ba nốt', () => {
    const chord = [48, 52, 55].map((midi) => ({ midi, at: 0.2 }));
    expect(midisOf(listen(chord))).toEqual([[48, 52, 55]]);
  });

  it('hai tay lệch nhau 30ms vẫn thành một lần đánh', () => {
    const notes = [{ midi: 48, at: 0.2 }, { midi: 64, at: 0.23 }];
    expect(midisOf(listen(notes))).toEqual([[48, 64]]);
  });

  it('hai tay lệch nhau hẳn 120ms: báo hai lần, mỗi nốt đúng một lần, không báo trùng', () => {
    const notes = [{ midi: 48, at: 0.2 }, { midi: 64, at: 0.32 }];
    const all = listen(notes).flatMap((e) => e.notes.map((n) => n.midi)).sort((a, b) => a - b);
    expect(all).toEqual([48, 64]);
  });

  it('tay trái giữ hợp âm, tay phải đi giai điệu: chỉ báo nốt tay phải mới đánh', () => {
    const notes: NoteSpec[] = [
      ...[48, 52, 55].map((midi) => ({ midi, at: 0.2, velocity: 0.12 })),
      { midi: 64, at: 0.2 },
      { midi: 65, at: 0.65 },
      { midi: 67, at: 1.1 },
    ];
    // Mi4 cách Mi3 đúng một quãng tám nên phải có bản nhạc đang chờ nó mới nhận
    // (xem ca bên dưới) — đúng như lúc tập thật, con trỏ luôn biết nốt đang chờ.
    const hinted = listen(notes, {}, (l) => { l.hint = [48, 52, 55, 64, 65, 67]; });
    expect(midisOf(hinted)).toEqual([[48, 52, 55, 64], [65], [67]]);
  });

  it('nốt cách nốt khác đúng một quãng tám: không có bản nhạc chờ thì chỉ báo nốt thấp', () => {
    // Mọi hoạ âm của Mi4 nằm trọn trong Mi3 — phổ của "Mi3 + Mi4" và phổ của "đánh
    // lại Mi3" gần như y hệt. Không biết bản nhạc đang chờ gì thì thà báo thiếu còn
    // hơn báo một nốt ma cho mọi lần đánh lại (xem `isNew` trong mic-pitch.ts).
    const notes = [{ midi: 52, at: 0.2 }, { midi: 64, at: 0.2 }];
    expect(midisOf(listen(notes))).toEqual([[52]]);
  });
});

describe('MicNoteListener — không báo bậy', () => {
  it('phòng yên, chỉ có tiếng ồn: không báo gì', () => {
    expect(listen([], { noise: 0.004, seconds: 2 })).toEqual([]);
  });

  it('phòng khá ồn (khoảng -40 dBFS) vẫn nghe đúng giai điệu', () => {
    const run = [60, 62, 64, 65, 67];
    expect(midisOf(listen(melody(run), { noise: 0.01 }))).toEqual(run.map((m) => [m]));
  });

  it('tiếng bíp của máy đánh nhịp không thành nốt', () => {
    const sr = SAMPLE_RATE;
    const audio = new Float32Array(sr * 2);
    const random = seededRandom(7);
    for (let i = 0; i < audio.length; i++) {
      const t = (i % (sr / 2)) / sr; // mỗi nửa giây một tiếng bíp dài 30ms
      audio[i] = (t < 0.03 ? 0.3 * Math.sin(2 * Math.PI * 1000 * t) : 0) + 0.001 * (random() * 2 - 1);
    }
    const heard: HeardEvent[] = [];
    const listener = new MicNoteListener(sr, (e) => heard.push(e));
    listener.range = [48, 84];
    for (let i = 0; i < audio.length; i += 128) listener.push(audio.subarray(i, i + 128));
    expect(heard).toEqual([]);
  });

  it('một nốt ngân dài không bị báo lại lần nữa', () => {
    expect(midisOf(listen([{ midi: 60, at: 0.2 }], { seconds: 3 }))).toEqual([[60]]);
  });
});

describe('MicNoteListener — chạy được ở mọi tần số lấy mẫu', () => {
  it.each([44100, 48000])('%i Hz', (sampleRate) => {
    const run = [60, 64, 67];
    expect(midisOf(listen(melody(run), { sampleRate }))).toEqual(run.map((m) => [m]));
  });

  it('khúc âm thanh to (1024 mẫu, như ScriptProcessor) cũng cho cùng kết quả', () => {
    const run = [60, 62, 64];
    expect(midisOf(listen(melody(run), {}, () => {}, 1024))).toEqual(run.map((m) => [m]));
  });
});
