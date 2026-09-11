import { describe, expect, it } from 'vitest';
import { createFollowState, followNote, skipCurrent } from './score-follow';
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

describe('followNote — đi tuần tự tuyệt đối, không nhảy cóc', () => {
  /*
   * **Bộ ca test sinh ra từ một lỗi người dùng báo:** *"chưa kịp gõ nốt thứ nhất
   * mà gõ nhầm nốt thứ 3 thì nhảy sang nốt 3 luôn"*.
   *
   * Bản cũ có cơ chế nhìn trước hai sự kiện, mở khoá sau lần trượt đầu tiên. Bấm
   * nhầm một phím rồi bấm lại chính nó — phản xạ tự nhiên khi màn hình không phản
   * ứng — là đủ để con trỏ nhảy qua những nốt chưa ai đánh.
   *
   * Luật bây giờ chỉ có một câu: **con trỏ chỉ nhích khi bấm đúng chỗ đang chờ.**
   */
  it('bấm đúng cao độ của nốt kế tiếp thì KHÔNG được xanh, dù bấm bao nhiêu lần', () => {
    const expected = score(DO, RE, MI, PHA);
    const state = play(expected, [DO, MI, MI, MI]);
    expect(state.matched).toEqual([0]);
    expect(state.cursor).toBe(1);
    expect(state.misses).toBe(3);
  });

  it('bấm nốt thứ ba khi đang chờ nốt đầu thì con trỏ vẫn đứng ở nốt đầu', () => {
    const expected = score(DO, RE, MI, PHA);
    const state = play(expected, [MI, MI]);
    expect(state.matched).toEqual([]);
    expect(state.cursor).toBe(0);
    expect(state.misses).toBe(2);
  });

  it('bỏ sót một nốt rồi đánh tiếp thì phần sau vẫn không xanh — con trỏ chờ ở chỗ bị sót', () => {
    const expected = score(DO, RE, MI, PHA);
    const state = play(expected, [DO, MI, PHA]);
    expect(state.matched).toEqual([0]);
    expect(state.cursor).toBe(1);
  });

  it('quay lại đánh đúng nốt đang chờ thì đi tiếp bình thường', () => {
    const expected = score(DO, RE, MI);
    const state = play(expected, [DO, MI, MI, RE, MI]);
    expect(state.matched).toEqual([0, 1, 2]);
    expect(state.missesAtCursor).toBe(0);
  });

  it('trượt một cái rồi bấm đúng lại thì vẫn xanh, coi như chưa có gì', () => {
    const expected = score(DO, RE, MI);
    const state = play(expected, [DO, MI, RE]);
    expect(state.matched).toEqual([0, 1]);
    expect(state.missesAtCursor).toBe(0);
  });

  it('bấm trúng một nốt của hợp âm cũng đặt lại bộ đếm trượt', () => {
    const expected = score([DO, MI], RE);
    const state = play(expected, [SOL, DO]);
    expect(state.misses).toBe(1);
    expect(state.collected).toEqual([DO]);
    expect(state.missesAtCursor).toBe(0);
  });
});

describe('skipCurrent — người học tự cho qua', () => {
  it('nhích con trỏ mà không tô xanh, cũng không tính là sai', () => {
    const expected = score(DO, RE, MI);
    const state = skipCurrent(expected, createFollowState());
    expect(state.cursor).toBe(1);
    expect(state.matched).toEqual([]);
    expect(state.skipped).toEqual([0]);
    expect(state.misses).toBe(0);
  });

  it('bỏ qua xong thì đánh tiếp bình thường', () => {
    const expected = score(DO, RE, MI);
    let state = skipCurrent(expected, createFollowState());
    state = followNote(expected, state, RE);
    state = followNote(expected, state, MI);
    expect(state.matched).toEqual([1, 2]);
    expect(state.skipped).toEqual([0]);
  });

  it('xoá luôn mấy nốt đã bấm dở của hợp âm đang chờ', () => {
    const expected = score([DO, MI], RE);
    const daBamMotNot = followNote(expected, createFollowState(), DO);
    expect(daBamMotNot.collected).toEqual([DO]);
    expect(skipCurrent(expected, daBamMotNot).collected).toEqual([]);
  });

  it('đặt lại bộ đếm kẹt, để giao diện thôi mời bấm bỏ qua', () => {
    const expected = score(DO, RE);
    const daTruot = play(expected, [SOL, SOL, SOL]);
    expect(daTruot.missesAtCursor).toBe(3);
    expect(skipCurrent(expected, daTruot).missesAtCursor).toBe(0);
  });

  it('hết bài rồi thì bấm bỏ qua không sinh gì', () => {
    const expected = score(DO, RE);
    const xong = play(expected, [DO, RE]);
    expect(skipCurrent(expected, xong)).toBe(xong);
    expect(skipCurrent([], createFollowState()).cursor).toBe(0);
  });
});
