import { describe, expect, it } from 'vitest';
import { createFollowState, followNote, LOOKAHEAD } from './score-follow';
import type { ScoreEvent } from './score-compare';

/** Dựng chuỗi sự kiện từ danh sách cao độ, mỗi phần tử là một thời điểm. */
function score(...pitchGroups: (number | number[])[]): ScoreEvent[] {
  return pitchGroups.map((group, index) => ({
    index,
    ms: index * 500,
    pitches: (Array.isArray(group) ? [...group] : [group]).sort((a, b) => a - b),
  }));
}

/** Đánh lần lượt cả chuỗi nốt, trả về trạng thái cuối. */
function play(expected: ScoreEvent[], notes: number[]) {
  let state = createFollowState();
  for (const note of notes) state = followNote(expected, state, note);
  return state;
}

const DO = 60;
const RE = 62;
const MI = 64;
const PHA = 65;
const SOL = 67;

describe('followNote — nốt đơn', () => {
  it('đánh đúng thứ tự thì mỗi nốt xanh lên lần lượt', () => {
    const expected = score(DO, RE, MI);
    expect(play(expected, [DO, RE, MI]).matched).toEqual([0, 1, 2]);
  });

  it('mới đánh nửa bài thì chỉ nửa đầu xanh', () => {
    const expected = score(DO, RE, MI, PHA);
    const state = play(expected, [DO, RE]);
    expect(state.matched).toEqual([0, 1]);
    expect(state.cursor).toBe(2);
  });

  it('đánh hết bài rồi thì bấm thêm cũng không sinh gì', () => {
    const expected = score(DO, RE);
    const after = play(expected, [DO, RE]);
    expect(followNote(expected, after, SOL)).toBe(after);
    expect(followNote(expected, after, DO)).toBe(after);
  });

  it('bản nhạc rỗng thì không vỡ', () => {
    expect(play([], [DO, RE]).matched).toEqual([]);
  });
});

describe('followNote — đánh sai thì báo một cái, không phạt', () => {
  it('nốt lạ được đếm vào misses nhưng con trỏ không nhích, không mất gì đã xanh', () => {
    const expected = score(DO, RE, MI);
    const state = play(expected, [DO, 61]);
    expect(state.misses).toBe(1);
    expect(state.matched).toEqual([0]);
    expect(state.cursor).toBe(1);
  });

  it('mỗi nốt sai đếm thêm một lần, để chỗ gọi nháy lại từ đầu', () => {
    const expected = score(DO, RE, MI);
    expect(play(expected, [61, 61, 61]).misses).toBe(3);
  });

  it('bấm lại đúng nốt đang chờ trong hợp âm thì không tính là sai', () => {
    const expected = score([DO, MI]);
    const start = createFollowState();
    const afterFirst = followNote(expected, start, DO);
    // Chỗ gọi dựa vào phép so `===` này để biết có phải vẽ lại khuông hay không.
    expect(followNote(expected, afterFirst, DO)).toBe(afterFirst);
    expect(afterFirst.misses).toBe(0);
  });

  it('đánh sai rồi đánh lại đúng thì vẫn xanh', () => {
    const expected = score(DO, RE, MI);
    const state = play(expected, [DO, 61, 61, RE, MI]);
    expect(state.matched).toEqual([0, 1, 2]);
    expect(state.misses).toBe(2);
  });
});

describe('followNote — hợp âm', () => {
  it('phải bấm đủ mọi nốt mới xanh', () => {
    const expected = score([DO, MI, SOL], RE);
    const half = play(expected, [DO, MI]);
    expect(half.matched).toEqual([]);
    expect(half.collected).toEqual([DO, MI]);

    const full = play(expected, [DO, MI, SOL]);
    expect(full.matched).toEqual([0]);
    expect(full.cursor).toBe(1);
  });

  it('bấm thứ tự nào trong hợp âm cũng được', () => {
    const expected = score([DO, MI, SOL]);
    expect(play(expected, [SOL, DO, MI]).matched).toEqual([0]);
  });

  it('bấm lặp lại một nốt của hợp âm không tính là đủ', () => {
    const expected = score([DO, MI]);
    expect(play(expected, [DO, DO, DO]).matched).toEqual([]);
  });
});

describe('followNote — nhìn trước khi người học bỏ sót nốt', () => {
  it('bỏ sót một nốt thì con trỏ theo kịp, nốt bị bỏ không được tô xanh', () => {
    const expected = score(DO, RE, MI, PHA);
    // Người học nhảy qua Rê.
    const state = play(expected, [DO, MI, PHA]);
    expect(state.matched).toEqual([0, 2, 3]);
  });

  it('nhảy xa quá tầm nhìn trước thì tính là sai, không nhảy lung tung', () => {
    const expected = score(DO, RE, MI, PHA, SOL);
    // SOL nằm cách con trỏ 4 bậc, xa hơn LOOKAHEAD.
    const state = play(expected, [DO, SOL]);
    expect(state.matched).toEqual([0]);
    expect(state.cursor).toBe(1);
    expect(state.misses).toBe(1);
  });

  it('LOOKAHEAD nhận giá trị truyền vào', () => {
    const expected = score(DO, RE, MI, PHA, SOL);
    const strict = followNote(expected, play(expected, [DO]), MI, 0);
    expect(strict.matched).toEqual([0]);

    const loose = followNote(expected, play(expected, [DO]), SOL, 4);
    expect(loose.matched).toEqual([0, 4]);
  });

  it('nhìn trước tới một hợp âm thì vẫn phải bấm đủ mới xanh', () => {
    const expected = score(DO, RE, [MI, SOL]);
    const state = play(expected, [DO, MI]);
    expect(state.matched).toEqual([0]);
    expect(state.cursor).toBe(2);
    expect(state.collected).toEqual([MI]);

    expect(followNote(expected, state, SOL).matched).toEqual([0, 2]);
  });

  it('tầm nhìn trước mặc định là 2', () => {
    expect(LOOKAHEAD).toBe(2);
  });
});
