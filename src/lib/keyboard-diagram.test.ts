import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  diagramRange, KeyboardDiagramError, keyboardDiagram, parseKeysBlock, parseNoteList,
} from './keyboard-diagram';

describe('parseNoteList', () => {
  it('đọc được tên nốt thường', () => {
    expect(parseNoteList('C4 E4 G4')).toEqual([60, 64, 67]);
  });

  it('Đô giữa là 60, đúng chuẩn dùng trong repo', () => {
    expect(parseNoteList('C4')).toEqual([60]);
  });

  it('đọc được dấu thăng và dấu giáng', () => {
    expect(parseNoteList('F#4')).toEqual([66]);
    expect(parseNoteList('Bb3')).toEqual([58]);
  });

  it('thừa khoảng trắng cũng không sao', () => {
    expect(parseNoteList('  C4   E4  ')).toEqual([60, 64]);
  });

  it('gõ sai thì ném lỗi kèm đúng chữ sai, không lặng lẽ bỏ qua', () => {
    // Hình biến mất không dấu vết là thứ người soạn bài không phát hiện ra.
    expect(() => parseNoteList('C4 H4')).toThrow(KeyboardDiagramError);
    expect(() => parseNoteList('C4 H4')).toThrow(/"H4"/);
    expect(() => parseNoteList('Đô4')).toThrow(KeyboardDiagramError);
    expect(() => parseNoteList('')).toThrow(/chưa có nốt nào/);
  });
});

describe('diagramRange', () => {
  it('luôn cắt trọn quãng tám, từ Đô tới Si', () => {
    // Hợp âm Đô trưởng nằm gọn trong quãng 4.
    expect(diagramRange([60, 64, 67])).toEqual([60, 71]);
  });

  it('nốt tràn sang quãng sau thì vẽ tới đúng nốt đó, không vẽ thừa cả quãng', () => {
    // Hợp âm Pha: Pha4 - La4 - Đô5. Vẽ trọn quãng 5 là thừa mười một phím,
    // mà phím nào cũng bé lại vì phải chia bề ngang.
    expect(diagramRange([65, 69, 72])).toEqual([60, 72]);
  });

  it('nốt cao nằm trong quãng đầu thì vẫn vẽ trọn một quãng tám', () => {
    // Ngắn hơn một quãng là mất cụm hai/ba phím đen — mất luôn cái mốc để mò đàn.
    expect(diagramRange([60, 62])).toEqual([60, 71]);
  });

  it('rộng quá thì ném lỗi chứ không cắt bớt', () => {
    // Cắt cho vừa là có nốt người soạn đã ghi mà hình không vẽ — không ai thấy.
    expect(() => diagramRange([48, 96])).toThrow(KeyboardDiagramError);
    expect(() => diagramRange([48, 96])).toThrow(/rộng quá/);
  });

  it('mọi nốt được ghi đều nằm trong khoảng vẽ', () => {
    for (const notes of [[60, 64, 67], [53, 65], [48, 72], [60, 62], [65, 69, 72]]) {
      const [from, to] = diagramRange(notes);
      for (const midi of notes) {
        expect(midi).toBeGreaterThanOrEqual(from);
        expect(midi).toBeLessThanOrEqual(to);
      }
    }
  });
});

describe('keyboardDiagram', () => {
  const hop = keyboardDiagram([60, 64, 67]);

  it('một quãng tám có 12 phím, 7 trắng 5 đen', () => {
    expect(hop.keys).toHaveLength(12);
    expect(hop.keys.filter((k) => !k.black)).toHaveLength(7);
    expect(hop.keys.filter((k) => k.black)).toHaveLength(5);
  });

  it('đánh dấu đúng những phím đang bấm', () => {
    expect(hop.keys.filter((k) => k.pressed).map((k) => k.midi)).toEqual([60, 64, 67]);
  });

  it('phím đầu tiên bắt đầu từ 0, hình không lệch sang phải', () => {
    expect(hop.keys[0].x).toBe(0);
  });

  it('bề ngang bằng đúng số phím trắng', () => {
    expect(hop.width).toBe(7);
  });

  it('phím đen cưỡi lên chỗ giáp ranh giữa hai phím trắng', () => {
    const doThang = hop.keys.find((k) => k.midi === 61)!;
    const re = hop.keys.find((k) => k.midi === 62)!;
    // Tâm phím đen phải trùng chỗ giáp ranh Đô–Rê, tức mép trái của phím Rê.
    expect(doThang.centerX).toBeCloseTo(re.x, 5);
  });

  it('giữa Mi và Pha không có phím đen chen vào', () => {
    const mi = hop.keys.find((k) => k.midi === 64)!;
    const pha = hop.keys.find((k) => k.midi === 65)!;
    expect(pha.x).toBeCloseTo(mi.x + mi.width, 5);
  });
});

describe('chữ ghi dưới phím', () => {
  it('hình một quãng tám thì chỉ ghi tên nốt', () => {
    const d = keyboardDiagram([60, 64, 67]);
    expect(d.keys.filter((k) => k.pressed).map((k) => k.label)).toEqual(['Đô', 'Mi', 'Sol']);
  });

  it('hai phím cùng tên thì ghi kèm số quãng để phân biệt', () => {
    // Đây đúng là hình dùng để nói "cùng tên Pha, khác cao thấp".
    const d = keyboardDiagram([53, 65]);
    expect(d.keys.filter((k) => k.pressed).map((k) => k.label)).toEqual(['Pha3', 'Pha4']);
  });

  it('chỉ nốt bị trùng tên mới có số, phần còn lại để nguyên', () => {
    // Tám phím mà nhãn nào cũng dài ra là chúng chồng lên nhau.
    const d = keyboardDiagram([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(d.keys.filter((k) => k.pressed).map((k) => k.label))
      .toEqual(['Đô4', 'Rê', 'Mi', 'Pha', 'Sol', 'La', 'Si', 'Đô5']);
  });

  it('phím không bấm thì không ghi gì', () => {
    const d = keyboardDiagram([60]);
    expect(d.keys.filter((k) => !k.pressed).every((k) => k.label === null)).toBe(true);
  });
});

describe('parseKeysBlock', () => {
  it('dòng đầu là nốt, dòng sau là chú thích', () => {
    expect(parseKeysBlock('C4 E4 G4\nHợp âm Đô trưởng')).toEqual({
      midis: [60, 64, 67],
      caption: 'Hợp âm Đô trưởng',
    });
  });

  it('không có chú thích cũng được', () => {
    expect(parseKeysBlock('C4 E4 G4').caption).toBeNull();
  });
});

/**
 * Gác nội dung: mọi khối ```keys trong giáo trình phải đọc được.
 *
 * Không có trình soạn nào kiểm hộ — người soạn gõ thẳng vào file markdown. Gõ
 * sai một chữ thì hình không hiện, mà bài vẫn đăng được và không ai báo gì.
 */
describe('mọi khối keys trong docs/', () => {
  const root = path.join(process.cwd(), 'docs');

  function mdFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return mdFiles(full);
      return e.name.endsWith('.md') ? [full] : [];
    });
  }

  const blocks = mdFiles(root).flatMap((file) => {
    const md = fs.readFileSync(file, 'utf8');
    return [...md.matchAll(/```keys\r?\n([\s\S]*?)```/g)]
      .map((m) => ({ file: path.relative(root, file), body: m[1] }));
  });

  it('đọc được hết, không khối nào sai cú pháp', () => {
    const loi = blocks.flatMap(({ file, body }) => {
      try {
        parseKeysBlock(body);
        return [];
      } catch (e) {
        return [`${file}: ${(e as Error).message}`];
      }
    });
    expect(loi).toEqual([]);
  });
});
