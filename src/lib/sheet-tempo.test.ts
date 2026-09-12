import { describe, expect, it } from 'vitest';
import { bpmAtWarp } from './sheet-tempo';

/** Ô nhịp 4/4 ở 120 nhịp/phút: mỗi nhịp 500ms, cả ô 2000ms. */
const BON_BON_120 = { msPerMeasure: 2000, beats: 4 };

describe('bpmAtWarp', () => {
  it('tốc độ 100 thì trả đúng nhịp ghi trong bản nhạc', () => {
    expect(bpmAtWarp(BON_BON_120.msPerMeasure, BON_BON_120.beats, 100)).toBe(120);
  });

  it('chậm một nửa thì nhịp còn một nửa', () => {
    expect(bpmAtWarp(BON_BON_120.msPerMeasure, BON_BON_120.beats, 50)).toBe(60);
  });

  it('nhanh gấp rưỡi thì nhịp gấp rưỡi', () => {
    expect(bpmAtWarp(BON_BON_120.msPerMeasure, BON_BON_120.beats, 150)).toBe(180);
  });

  it('ô nhịp 3/4 đếm ba phách, không phải bốn', () => {
    // Cùng độ dài ô nhịp mà ít phách hơn thì mỗi phách dài ra, nên nhịp chậm hơn.
    expect(bpmAtWarp(2000, 3, 100)).toBe(90);
  });

  it('làm tròn tới số nguyên, không hiện số lẻ', () => {
    expect(Number.isInteger(bpmAtWarp(1234, 4, 100))).toBe(true);
  });

  it('con số chưa dùng được thì trả 0 chứ không nổ', () => {
    // Bản nhạc chưa dựng xong, hoặc ô nhập tốc độ đang trống.
    expect(bpmAtWarp(0, 4, 100)).toBe(0);
    expect(bpmAtWarp(2000, 0, 100)).toBe(0);
    expect(bpmAtWarp(2000, 4, 0)).toBe(0);
    expect(bpmAtWarp(Number.NaN, 4, 100)).toBe(0);
    expect(bpmAtWarp(2000, 4, -50)).toBe(0);
  });
});
