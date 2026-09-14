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
import { caoDoVangRa } from './__fixtures__/abc-sound';
import { seededRandom } from './__fixtures__/piano-synth';

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

describe('bản nhạc nhập vào vang ra đúng nốt của file gốc', () => {
  const baiNhac = (staves: ImportedScore['staves']): ImportedScore => ({
    title: 'Bài thử',
    beatsPerBar: 4,
    beatUnit: 4,
    staves,
    bpm: 90,
  });

  /** Cao độ file gốc theo thứ tự vang ra: hết khuông trên rồi tới khuông dưới. */
  const caoDoGoc = (score: ImportedScore) =>
    score.staves.flatMap((s) => s.events.flatMap((e) => e.midis));

  /**
   * Cắt chuỗi cao độ vang ra theo đúng cỡ từng hợp âm của file gốc rồi sắp trong
   * từng hợp âm. Hợp âm có hai nốt cùng chữ cái (`[C^C]`) thì abcjs không phát
   * theo thứ tự viết — thứ tự trong MỘT hợp âm không phải cao độ, còn nốt sai
   * vẫn lộ ra vì mỗi nhóm so đúng với hợp âm của nó.
   */
  const sapTheoHopAm = (score: ImportedScore, vang: number[]) => {
    let i = 0;
    return score.staves.flatMap((s) => s.events.flatMap((e) => {
      const nhom = vang.slice(i, i + e.midis.length).sort((a, b) => a - b);
      i += e.midis.length;
      return nhom;
    }));
  };

  it('nốt thăng rồi nốt trắng cùng tên trong một ô thì nốt sau vẫn là nốt trắng', () => {
    // Đúng ô đầu của bản 4 giáng đã đo được lỗi: Mi giáng, Đô, Rê giáng, Đô.
    const score = baiNhac([{ clef: 'treble', events: [den(63), den(72), den(73), den(72)] }]);
    expect(caoDoVangRa(toAbc(score))).toEqual([63, 72, 73, 72]);
  });

  it('nốt trắng đứng sau nốt hoá ở quãng tám khác thì không bị ăn theo, còn cùng quãng tám thì có ghi dấu bình', () => {
    const score = baiNhac([{ clef: 'treble', events: [den(61), den(73), den(60), den(72)] }]);
    expect(caoDoVangRa(toAbc(score))).toEqual([61, 73, 60, 72]);
  });

  it('nốt luyến qua vạch nhịp mang lại đúng dấu của nó ở ô sau', () => {
    const score = baiNhac([{
      clef: 'treble',
      events: [
        // Đô thăng vắt sang ô 2, rồi Đô trắng trong ô 2.
        den(72), den(73, 4), den(72, 3),
        // Đô trắng vắt sang ô 4 sau một Đô thăng, rồi Đô thăng trong ô 4.
        den(73), den(72, 4), den(73, 3),
        // Đô thăng vắt sang ô 6, rồi Đô thăng nữa: dấu trên nốt luyến tới không ăn
        // sang nốt sau, nên nốt sau phải tự ghi dấu, không thì vang thành Đô trắng.
        den(72), den(73, 4), den(73), den(72, 2),
        // Hợp âm Sol - Sol thăng vắt sang ô 8, rồi Sol trắng và Sol thăng: ở hợp âm
        // cùng chữ thì abcjs lại cho dấu trên nốt luyến tới ăn sang nốt sau.
        den(null, 3), { midis: [67, 68], beats: 2 }, den(67), den(68), den(null),
      ],
    }]);
    expect(sapTheoHopAm(score, caoDoVangRa(toAbc(score))))
      .toEqual([72, 73, 72, 73, 72, 73, 72, 73, 73, 72, 67, 68, 67, 68]);
  });

  it('bản hai khuông dày nốt hoá, hợp âm và dấu luyến: nốt nào vang ra cũng đúng file gốc', () => {
    // Mười hạt giống — một hạt may mắn không chứng minh được gì. Tầm nốt hẹp để
    // cùng một chữ cái lặp lại dày trong ô nhịp, đúng chỗ lỗi dấu hoá hay nấp.
    for (const hat of [1, 2, 3, 7, 42, 99, 256, 1000, 31337, 65535]) {
      const rand = seededRandom(hat);
      const khuong = (thap: number, cao: number): ImportedEvent[] =>
        Array.from({ length: 48 }, () => {
          const beats = [0.25, 0.5, 1, 1.5, 3][Math.floor(rand() * 5)];
          if (rand() < 0.15) return { midis: [], beats };
          const soNot = 1 + Math.floor(rand() * 3);
          const midis = Array.from({ length: soNot }, () => thap + Math.floor(rand() * (cao - thap + 1)));
          return { midis: [...new Set(midis)].sort((a, b) => a - b), beats };
        });

      const score = baiNhac([
        { clef: 'treble', events: khuong(60, 76) },
        { clef: 'bass', events: khuong(43, 59) },
      ]);
      expect(sapTheoHopAm(score, caoDoVangRa(toAbc(score))), `hạt giống ${hat}`).toEqual(caoDoGoc(score));
    }
  });
});
