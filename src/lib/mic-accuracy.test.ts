import { describe, expect, it } from 'vitest';
import { MicNoteListener, type HeardEvent } from './mic-listener';
import { SAMPLE_RATE, seededRandom, synthPiano, type NoteSpec } from './__fixtures__/piano-synth';

/**
 * Đo độ chính xác trên nhiều câu nhạc ngẫu nhiên, thay vì vài ca chọn sẵn.
 *
 * Vì sao cần: các ca ở `mic-listener.test.ts` là những ca đã biết trước, chỉnh
 * thuật toán cho qua từng ca thì dễ — mà cũng dễ tự lừa mình. File này sinh câu
 * nhạc theo đúng những gì giáo trình dạy (thế tay Đô hai tay, hai phím đen của
 * Chương 4, hợp âm Đô - Pha - Sol của Chương 7), với tốc độ, lực đánh và độ ồn
 * ngẫu nhiên, rồi đếm đúng sai trên vài trăm nốt.
 *
 * Ngưỡng ở đây để CHẶN THỤT LÙI khi chỉnh thuật toán, không phải lời hứa về độ
 * chính xác trên điện thoại thật — tiếng đàn ở đây vẫn là tiếng tổng hợp. Lần chỉnh
 * cuối (11/09/2026) đo được: tập theo bản nhạc ~92% nghe đúng, ~1% nốt ma; luyện
 * nhận nốt 100% đúng phím và không lần nào nhận nhầm thành nốt đang hỏi.
 */

const RIGHT = [60, 62, 64, 65, 67];
const LEFT = [48, 50, 52, 53, 55];
const BLACK = [63, 66];
const CHORDS = [[48, 52, 55], [48, 53, 57], [47, 50, 55]];

interface Played { at: number; pitches: number[] }

function phrase(seed: number) {
  const random = seededRandom(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(random() * xs.length)];
  const events: Played[] = [];
  let t = 0.25;
  for (let i = 0; i < 10; i++) {
    const r = random();
    const pitches = r < 0.55 ? [pick(RIGHT)]
      : r < 0.7 ? [pick(LEFT)]
        : r < 0.78 ? [pick(BLACK)]
          : r < 0.9 ? [pick(LEFT), pick(RIGHT)]
            : pick(CHORDS);
    events.push({ at: t, pitches: [...new Set(pitches)] });
    t += 0.25 + random() * 0.55;
  }
  const notes: NoteSpec[] = events.flatMap((e) => e.pitches.map((midi) => ({
    midi,
    // Hai tay không bao giờ xuống cùng một lúc: lệch nhau tới 25ms.
    at: e.at + (e.pitches.length > 1 ? random() * 0.025 : 0),
    velocity: 0.03 + random() * 0.32,
  })));
  return { events, notes, end: t, noise: pick([0.001, 0.003, 0.008]) };
}

/** Cho tiếng chạy qua bộ nghe; `hintAt` trả về những phím bản nhạc đang chờ ở giây thứ t. */
function listenTo(audio: Float32Array, hintAt: (t: number) => number[]): HeardEvent[] {
  const heard: HeardEvent[] = [];
  const listener = new MicNoteListener(SAMPLE_RATE, (e) => heard.push(e));
  for (let i = 0; i < audio.length; i += 128) {
    listener.hint = hintAt(i / SAMPLE_RATE);
    listener.push(audio.subarray(i, i + 128));
  }
  return heard;
}

describe('Độ chính xác — tập theo bản nhạc (có biết trước nốt đang chờ)', () => {
  it('nghe đúng trên 90% nốt, nốt ma dưới 3%', () => {
    let expected = 0;
    let right = 0;
    let extras = 0;
    for (let seed = 1000; seed < 1020; seed++) {
      const { events, notes, end, noise } = phrase(seed);
      const audio = synthPiano(notes, { seconds: end + 0.5, noise, seed });
      // Con trỏ trên bản nhạc chờ sự kiện kế tiếp — mô phỏng đúng `ScorePractice`.
      const heard = listenTo(audio, (t) => events.find((e) => e.at > t - 0.15)?.pitches ?? []);

      const used = new Set<string>();
      for (const e of events) {
        for (const p of e.pitches) {
          expected += 1;
          const hit = heard.findIndex((h, hi) => Math.abs(h.onsetSample / SAMPLE_RATE - e.at) < 0.08
            && h.notes.some((n) => n.midi === p) && !used.has(`${hi}:${p}`));
          if (hit >= 0) {
            right += 1;
            used.add(`${hit}:${p}`);
          }
        }
      }
      heard.forEach((h, hi) => h.notes.forEach((n) => { if (!used.has(`${hi}:${n.midi}`)) extras += 1; }));
    }
    console.log(`[mic-accuracy] tập theo bản nhạc: ${expected} nốt · nghe đúng ${((100 * right) / expected).toFixed(1)}% · nốt ma ${((100 * extras) / expected).toFixed(1)}%`);
    expect(right / expected).toBeGreaterThan(0.9);
    expect(extras / expected).toBeLessThan(0.03);
  });
});

describe('Độ chính xác — luyện nhận nốt (mỗi lần một nốt, có khi đánh sai)', () => {
  it('nhận đúng phím đã đánh, và không bao giờ nhận nhầm thành nốt đang hỏi', () => {
    const random = seededRandom(77);
    const pool = [...RIGHT, ...LEFT, ...BLACK];
    let total = 0;
    let right = 0;
    let falseCorrect = 0;
    for (let round = 0; round < 12; round++) {
      // Mỗi câu 6 lần trả lời, cách nhau ~0.8 giây như người đang dò nốt.
      const answers = Array.from({ length: 6 }, (_, i) => {
        const played = pool[Math.floor(random() * pool.length)];
        // Một nửa số lần người học đánh sai: nốt đang hỏi khác nốt đánh.
        const asked = random() < 0.5 ? played : pool[Math.floor(random() * pool.length)];
        return { at: 0.3 + i * 0.8, played, asked, velocity: 0.05 + random() * 0.3 };
      });
      const audio = synthPiano(
        answers.map((a) => ({ midi: a.played, at: a.at, velocity: a.velocity, duration: 0.6 })),
        { seconds: 5.5, noise: [0.001, 0.004][round % 2], seed: 500 + round },
      );
      const heard = listenTo(audio, (t) => {
        const a = answers.find((x) => x.at > t - 0.3);
        return a ? [a.asked] : [];
      });
      for (const a of answers) {
        total += 1;
        const h = heard.find((x) => Math.abs(x.onsetSample / SAMPLE_RATE - a.at) < 0.08);
        const top = h?.notes[0]?.midi;
        if (top === a.played) right += 1;
        if (a.asked !== a.played && h?.notes.some((n) => n.midi === a.asked)) falseCorrect += 1;
      }
    }
    console.log(`[mic-accuracy] luyện nhận nốt: ${total} lần · đúng phím ${((100 * right) / total).toFixed(1)}% · nhận nhầm thành nốt đang hỏi ${falseCorrect} lần`);
    expect(right / total).toBeGreaterThan(0.95);
    // Đây là lỗi tệ nhất có thể xảy ra: người học đánh sai mà màn hình báo "Chính xác".
    expect(falseCorrect).toBe(0);
  });
});
