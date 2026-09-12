import { describe, expect, it } from 'vitest';
import {
  BLACK_WIDTH, FIRST_MIDI, LAST_MIDI, pianoLayout, WHITE_WIDTH,
} from './piano-keyboard';
import { isBlackPitch, octaveOf } from './pitch';

const layout = pianoLayout();

describe('pianoLayout — đúng một cây đàn 88 phím', () => {
  it('có đủ 88 phím, 52 trắng và 36 đen', () => {
    expect(layout.keys).toHaveLength(88);
    expect(layout.keys.filter((k) => !k.black)).toHaveLength(52);
    expect(layout.keys.filter((k) => k.black)).toHaveLength(36);
  });

  it('bắt đầu ở La0 và kết ở Đô8', () => {
    expect(layout.keys[0].midi).toBe(FIRST_MIDI);
    expect(layout.keys[0].black).toBe(false);
    expect(layout.keys.at(-1)!.midi).toBe(LAST_MIDI);
    expect(layout.keys.at(-1)!.black).toBe(false);
  });

  it('bề ngang bằng đúng 52 phím trắng', () => {
    expect(layout.width).toBe(52 * WHITE_WIDTH);
  });

  it('phím trắng xếp liền nhau, không chồng không hở', () => {
    const white = layout.keys.filter((k) => !k.black);
    white.forEach((k, i) => expect(k.x).toBeCloseTo(i * WHITE_WIDTH));
  });

  /*
   * Ca quan trọng nhất của file: phím đen phải cưỡi lên chỗ giáp ranh hai phím
   * trắng. Sai chỗ này thì bàn phím vẫn trông như bàn phím, chỉ có điều Đô thăng
   * đứng nhầm ô — người không biết đàn nhìn không ra.
   */
  it('phím đen cưỡi lên ranh giới giữa hai phím trắng', () => {
    for (const black of layout.keys.filter((k) => k.black)) {
      const left = layout.keys.filter((k) => !k.black && k.midi < black.midi).at(-1)!;
      const right = layout.keys.find((k) => !k.black && k.midi > black.midi)!;
      const bienGioi = left.x + WHITE_WIDTH;
      expect(right.x).toBeCloseTo(bienGioi);
      expect(black.x + BLACK_WIDTH / 2).toBeCloseTo(bienGioi);
    }
  });

  it('không có phím đen nào giữa Mi–Pha và Si–Đô', () => {
    for (const midi of [64, 65, 71, 72]) expect(isBlackPitch(midi)).toBe(false);
    // Giữa Mi4 và Pha4 không có gì chen vào.
    expect(layout.keys.find((k) => k.midi === 64)!.black).toBe(false);
    expect(layout.keys.find((k) => k.midi === 65)!.black).toBe(false);
  });
});

describe('cụm quãng tám chọn được', () => {
  it('có bảy cụm, từ quãng 1 tới quãng 7', () => {
    expect(layout.octaves.map((o) => o.octave)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('mỗi cụm rộng đúng bảy phím trắng và bắt đầu ở nốt Đô', () => {
    for (const block of layout.octaves) {
      expect(block.width).toBe(7 * WHITE_WIDTH);
      expect(block.midis[0] % 12).toBe(0);
      expect(block.midis[1] - block.midis[0]).toBe(11);
      expect(octaveOf(block.midis[0])).toBe(block.octave);
    }
  });

  it('các cụm nối tiếp nhau, không chồng lên nhau', () => {
    layout.octaves.forEach((block, i) => {
      if (i === 0) return;
      const truoc = layout.octaves[i - 1];
      expect(block.x).toBeCloseTo(truoc.x + truoc.width);
    });
  });

  it('ba phím lẻ ở hai đầu đàn không thuộc cụm nào', () => {
    // La0, La#0, Si0 ở đầu và Đô8 ở cuối: vẫn vẽ ra, nhưng không chọn được.
    const trongCum = (midi: number) => layout.octaves.some((o) => midi >= o.midis[0] && midi <= o.midis[1]);
    for (const midi of [21, 22, 23, 108]) expect(trongCum(midi)).toBe(false);
    expect(trongCum(24)).toBe(true); // Đô1
    expect(trongCum(107)).toBe(true); // Si7
  });

  it('Đô giữa nằm trong cụm quãng 4', () => {
    const block = layout.octaves.find((o) => o.octave === 4)!;
    expect(block.midis).toEqual([60, 71]);
  });
});
