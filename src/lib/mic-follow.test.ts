import { describe, expect, it } from 'vitest';
import { answerFromHeard, EXTRA_NOTE_MIN_STRENGTH, pitchesForFollow } from './mic-follow';
import { createFollowState, followNote } from './score-follow';
import type { ScoreEvent } from './score-compare';
import type { DetectedNote } from './mic-pitch';

function score(...groups: (number | number[])[]): ScoreEvent[] {
  return groups.map((g, index) => ({ index, ms: index * 500, pitches: (Array.isArray(g) ? [...g] : [g]).sort((a, b) => a - b) }));
}

const heard = (...notes: [number, number][]): DetectedNote[] => notes.map(([midi, strength]) => ({ midi, strength }));

/** Đưa lần lượt các lần nghe qua đúng đường ScorePractice dùng, trả về trạng thái cuối. */
function follow(expected: ScoreEvent[], hearings: DetectedNote[][]) {
  let state = createFollowState();
  for (const h of hearings) {
    for (const p of pitchesForFollow(h, expected, state.cursor)) state = followNote(expected, state, p);
  }
  return state;
}

describe('pitchesForFollow', () => {
  it('nghe đúng nốt đang chờ thì xanh, không nháy đỏ gì', () => {
    const expected = score(64, 64, 65);
    const state = follow(expected, [heard([64, 1]), heard([64, 1]), heard([65, 1])]);
    expect(state.matched).toEqual([0, 1, 2]);
    expect(state.misses).toBe(0);
  });

  it('nghe đúng nốt kèm một nốt ma nhỏ: nốt kế tiếp KHÔNG bị nháy đỏ oan', () => {
    const expected = score(64, 65);
    const state = follow(expected, [heard([64, 1], [76, EXTRA_NOTE_MIN_STRENGTH - 0.2])]);
    expect(state.matched).toEqual([0]);
    expect(state.misses).toBe(0);
  });

  it('hợp âm: nốt khớp đi trước nốt lạ, nên hợp âm vẫn đủ nốt mà xanh', () => {
    const expected = score([48, 52, 55], 60);
    // Nốt lạ mạnh nghe ra TRƯỚC trong danh sách — nếu không xếp lại thì nó đếm là sai ở hợp âm.
    expect(pitchesForFollow(heard([61, 1], [48, 0.9], [52, 0.8], [55, 0.7]), expected, 0)).toEqual([48, 52, 55, 61]);
  });

  it('đánh sai hẳn: báo đúng một lần sai, con trỏ đứng yên', () => {
    const expected = score(64, 65);
    const state = follow(expected, [heard([62, 1], [74, 0.4])]);
    expect(state.matched).toEqual([]);
    expect(state.misses).toBe(1);
    expect(state.cursor).toBe(0);
  });

  it('hai tay cách nhau một quãng tám: nghe được một thì đủ cả hai', () => {
    const expected = score([48, 60], [50, 62]);
    const state = follow(expected, [heard([48, 1]), heard([50, 1])]);
    expect(state.matched).toEqual([0, 1]);
  });

  it('nốt quãng tám chỉ được bù khi chỗ đang chờ thật sự có cả hai tay', () => {
    const expected = score(60, 62);
    // Chỗ đang chờ là Đô4 một mình; nghe Đô5 thì vẫn là sai quãng tám, không được xanh.
    expect(pitchesForFollow(heard([72, 1]), expected, 0)).toEqual([72]);
  });

  it('bỏ sót một nốt rồi đánh nốt sau: đưa nốt sau vào để bắt lại nhịp', () => {
    const expected = score(60, 62, 64);
    expect(pitchesForFollow(heard([70, 0.5], [62, 1]), expected, 0)).toEqual([62]);
  });

  it('không nghe được gì thì không đưa gì', () => {
    expect(pitchesForFollow([], score(60), 0)).toEqual([]);
  });
});

describe('answerFromHeard', () => {
  it('nghe có nốt đang hỏi thì lấy nó, dù không phải nốt mạnh nhất', () => {
    expect(answerFromHeard(heard([55, 1], [60, 0.4]), 60)).toBe(60);
  });

  it('không có nốt đang hỏi nhưng có nốt cùng tên: trả về để báo "sai quãng tám"', () => {
    expect(answerFromHeard(heard([67, 1], [72, 0.5]), 60)).toBe(72);
  });

  it('còn lại thì lấy nốt mạnh nhất', () => {
    expect(answerFromHeard(heard([62, 1], [65, 0.5]), 60)).toBe(62);
  });

  it('không nghe gì thì không có câu trả lời', () => {
    expect(answerFromHeard([], 60)).toBeNull();
  });
});
