import { describe, expect, it } from 'vitest';
import { isBlackPitch, octaveOf, pitchClass } from './pitch';

describe('pitchClass', () => {
  it('Đô nào cũng ra 0', () => {
    for (const midi of [0, 12, 24, 60, 72, 108]) expect(pitchClass(midi)).toBe(0);
  });

  it('số âm vẫn ra số trong khoảng 0..11', () => {
    // `-1 % 12` của JavaScript ra -1, và số âm đó lặng lẽ trỏ ra ngoài mọi bảng
    // tên nốt. Đây là cái bẫy khiến hàm này phải tồn tại.
    expect(pitchClass(-1)).toBe(11);
    expect(pitchClass(-12)).toBe(0);
    expect(pitchClass(-13)).toBe(11);
  });
});

describe('octaveOf', () => {
  it('Đô giữa (MIDI 60) là quãng 4, đúng như bản nhạc ghi', () => {
    expect(octaveOf(60)).toBe(4);
  });

  it('quãng chỉ nhảy ở nốt Đô, không nhảy ở giữa quãng', () => {
    expect(octaveOf(59)).toBe(3);
    expect(octaveOf(71)).toBe(4);
    expect(octaveOf(72)).toBe(5);
  });

  it('hai đầu cây đàn 88 phím: La0 và Đô8', () => {
    expect(octaveOf(21)).toBe(0);
    expect(octaveOf(108)).toBe(8);
  });
});

describe('isBlackPitch', () => {
  it('đúng năm phím đen trong mỗi quãng tám', () => {
    const black: number[] = [];
    for (let midi = 60; midi < 72; midi++) if (isBlackPitch(midi)) black.push(midi);
    expect(black).toEqual([61, 63, 66, 68, 70]);
  });

  it('Đô Rê Mi Pha Sol La Si đều là phím trắng', () => {
    for (const midi of [60, 62, 64, 65, 67, 69, 71]) expect(isBlackPitch(midi)).toBe(false);
  });

  it('Mi–Pha và Si–Đô không có phím đen chen giữa', () => {
    // Chỗ dễ chép sai nhất: hai cặp này liền nhau, nên dãy phím đen không đều.
    expect(isBlackPitch(65)).toBe(false);
    expect(isBlackPitch(72)).toBe(false);
  });

  it('cách nhau đúng một quãng tám thì cùng màu phím, suốt cả cây đàn', () => {
    for (let midi = 21; midi + 12 <= 108; midi++) {
      expect(isBlackPitch(midi + 12)).toBe(isBlackPitch(midi));
    }
  });

  it('mỗi quãng tám có đúng 5 phím đen và 7 phím trắng', () => {
    let black = 0;
    for (let midi = 48; midi < 60; midi++) if (isBlackPitch(midi)) black += 1;
    expect(black).toBe(5);
  });
});
