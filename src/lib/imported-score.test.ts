import { describe, expect, it } from 'vitest';
import {
  abcLength,
  ImportedScoreError,
  quantize,
  splitByHand,
  toAbc,
  toBars,
  type ImportedEvent,
  type ImportedScore,
} from './imported-score';

const den = (midi: number | null, beats = 1): ImportedEvent => ({
  midis: midi === null ? [] : [midi],
  beats,
});

describe('độ dài nốt viết ra ABC', () => {
  it('viết đúng các hình nốt hay gặp', () => {
    expect(abcLength(1)).toBe('');
    expect(abcLength(2)).toBe('2');
    expect(abcLength(4)).toBe('4');
    expect(abcLength(0.5)).toBe('/2');
    expect(abcLength(0.25)).toBe('/4');
    expect(abcLength(1.5)).toBe('3/2');
    expect(abcLength(0.75)).toBe('3/4');
  });

  it('nốt dài lẻ của người đánh thật được làm tròn về móc kép', () => {
    expect(quantize(0.98)).toBe(1);
    expect(quantize(0.13)).toBe(0.25);
    // Ngắn tới mấy cũng còn lại một nốt: nuốt mất nốt thì người học tập thiếu.
    expect(quantize(0.0001)).toBe(0.25);
  });
});

describe('chia ô nhịp', () => {
  it('bốn nốt đen thành một ô nhịp 4/4', () => {
    const bars = toBars([den(60), den(62), den(64), den(65)], 4);
    expect(bars).toEqual([['C', 'D', 'E', 'F']]);
  });

  it('nốt vắt qua vạch nhịp bị cắt đôi và nối bằng dấu luyến', () => {
    const bars = toBars([den(60, 3), den(62, 3), den(64, 2)], 4);
    expect(bars[0]).toEqual(['C3', 'D-']);
    expect(bars[1][0]).toBe('D2');
  });

  it('ô cuối thiếu phách thì bù dấu lặng cho đủ', () => {
    const bars = toBars([den(60), den(62)], 4);
    expect(bars).toEqual([['C', 'D', 'z2']]);
  });

  it('dấu lặng dài vẫn cắt theo ô nhịp nhưng không có dấu luyến', () => {
    const bars = toBars([den(null, 8)], 4);
    expect(bars).toEqual([['z4'], ['z4']]);
  });
});

describe('tách hai tay theo cao độ', () => {
  it('bài nằm gọn tầm tay phải thì chỉ dựng một khuông', () => {
    const staves = splitByHand([den(60), den(64), den(67)]);
    expect(staves).toHaveLength(1);
    expect(staves[0].clef).toBe('treble');
  });

  it('bài nằm gọn dưới Đô giữa thì dựng một khuông Pha', () => {
    const staves = splitByHand([den(48), den(52)]);
    expect(staves).toHaveLength(1);
    expect(staves[0].clef).toBe('bass');
  });

  it('có nốt cả hai bên thì dựng hai khuông, mỗi bên giữ đúng nốt của mình', () => {
    const staves = splitByHand([{ midis: [48, 64], beats: 1 }]);
    expect(staves.map((s) => s.clef)).toEqual(['treble', 'bass']);
    expect(staves[0].events[0].midis).toEqual([64]);
    expect(staves[1].events[0].midis).toEqual([48]);
  });
});

describe('ghi ra chuỗi ABC', () => {
  const score = (staves: ImportedScore['staves']): ImportedScore => ({
    title: 'Bài thử',
    beatsPerBar: 4,
    beatUnit: 4,
    staves,
    bpm: 90,
  });

  it('bản một khuông vẽ được ngay, có tiêu đề và tốc độ', () => {
    const abc = toAbc(score([{ clef: 'treble', events: [den(60), den(62), den(64), den(65)] }]));
    expect(abc).toContain('T: Bài thử');
    expect(abc).toContain('M: 4/4');
    expect(abc).toContain('Q: 1/4=90');
    expect(abc).toContain('K: C');
    expect(abc.trimEnd().endsWith('|]')).toBe(true);
  });

  it('bản hai khuông có đủ hai bè và số ô nhịp bằng nhau', () => {
    const abc = toAbc(score([
      { clef: 'treble', events: [den(60), den(62), den(64), den(65), den(67), den(65), den(64), den(62)] },
      { clef: 'bass', events: [den(48, 4)] },
    ]));
    expect(abc).toContain('%%score { 1 | 2 }');
    const tren = abc.split('\n').filter((l) => l.startsWith('[V:1]'));
    const duoi = abc.split('\n').filter((l) => l.startsWith('[V:2]'));
    expect(tren).toHaveLength(duoi.length);
    // Khuông dưới ngắn hơn nên phải được bù ô nhịp lặng, không được bỏ trống.
    expect(duoi[0]).toContain('z4');
  });

  it('hợp âm ghi thành một chồng nốt', () => {
    const abc = toAbc(score([{ clef: 'treble', events: [{ midis: [60, 64, 67], beats: 4 }] }]));
    expect(abc).toContain('[CEG]4');
  });

  it('file không có nốt nào thì báo lỗi đọc được, không dựng bản nhạc rỗng', () => {
    expect(() => toAbc(score([]))).toThrow(ImportedScoreError);
  });

  it('bản nhạc dài quá mức nhận được thì nói rõ dài bao nhiêu', () => {
    const dai = Array.from({ length: 2000 }, () => den(60, 4));
    expect(() => toAbc(score([{ clef: 'treble', events: dai }]))).toThrow(/ô nhịp/);
  });
});
