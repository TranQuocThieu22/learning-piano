import { describe, expect, it } from 'vitest';
import {
  checkAnswer, clefsFor, DEFAULT_OPTIONS, describeMidiNote, DRILL_RANGES, isBlackKey, noteAt,
  pickNextQuestion, questionsForOptions, rangesFor, singleNoteAbc,
} from './midi-notes';

describe('noteAt — dựng nốt từ số MIDI', () => {
  it('Đô giữa là C4 và viết là C trong ABC', () => {
    expect(noteAt(60)).toEqual({ midi: 60, abc: 'C', name: 'Đô', scientific: 'C4' });
  });

  /*
   * Chỗ sai kinh điển của ABC: dấu quãng tám bám theo CHỮ CÁI chứ không theo
   * phím. Viết sai một dấu phẩy là nốt hiện lên lệch hẳn một quãng tám, mà
   * trông vẫn như một nốt bình thường nên mắt không bắt được.
   */
  it('đặt đúng dấu quãng tám cho mọi quãng đang dùng', () => {
    expect(noteAt(36).abc).toBe('C,,');   // C2
    expect(noteAt(48).abc).toBe('C,');    // C3
    expect(noteAt(72).abc).toBe('c');     // C5
    expect(noteAt(84).abc).toBe("c'");    // C6
    expect(noteAt(95).abc).toBe("b'");    // B6
  });

  it('dấu hoá đứng trước chữ cái, dấu quãng tám đứng sau', () => {
    expect(noteAt(58)).toEqual({ midi: 58, abc: '_B,', name: 'Si giáng', scientific: 'B♭3' });
    expect(noteAt(66)).toEqual({ midi: 66, abc: '^F', name: 'Pha thăng', scientific: 'F♯4' });
    // Đô thăng quãng 6: dấu thăng trước chữ c, dấu quãng tám sau nó.
    expect(noteAt(85)).toEqual({ midi: 85, abc: "^c'", name: 'Đô thăng', scientific: 'C♯6' });
  });

  it('mỗi quãng tám có đúng năm phím đen', () => {
    const black = [];
    for (let midi = 60; midi < 72; midi++) if (isBlackKey(midi)) black.push(midi);
    expect(black).toEqual([61, 63, 66, 68, 70]);
  });
});

describe('questionsForOptions — kho câu hỏi', () => {
  it('mặc định là năm nốt thế tay Đô ở khóa Sol, đúng Chương 1', () => {
    const pool = questionsForOptions(DEFAULT_OPTIONS);
    expect(pool.map((q) => q.note.midi)).toEqual([60, 62, 64, 65, 67]);
    expect(pool.every((q) => q.clef === 'treble')).toBe(true);
  });

  it('tay trái lấy đúng thế tay Đô quãng thấp, khóa Pha', () => {
    const pool = questionsForOptions({ ...DEFAULT_OPTIONS, hands: 'left' });
    expect(pool.map((q) => q.note.midi)).toEqual([48, 50, 52, 53, 55]);
    expect(pool.every((q) => q.clef === 'bass')).toBe(true);
  });

  it('cả hai tay thì một nốt xuất hiện hai lần, mỗi khóa một lần', () => {
    const pool = questionsForOptions({ hands: 'both', rangeIds: ['quang-do-giua'], accidentals: false });
    const doGiua = pool.filter((q) => q.note.midi === 60);
    expect(doGiua.map((q) => q.clef).sort()).toEqual(['bass', 'treble']);
  });

  it('chọn nhiều quãng thì nốt nhảy qua lại giữa chúng', () => {
    const pool = questionsForOptions({
      hands: 'right',
      rangeIds: ['quang-do-giua', 'quang-cao'],
      accidentals: false,
    });
    expect(pool.some((q) => q.note.midi === 60)).toBe(true);
    expect(pool.some((q) => q.note.midi === 95)).toBe(true);
  });

  /*
   * Thế tay Đô nằm gọn trong quãng Đô giữa. Chọn cả hai mà không bỏ trùng thì
   * năm nốt Đô–Sol bị hỏi dày gấp đôi bảy nốt còn lại — người học không thấy
   * lỗi, chỉ thấy "sao cứ hỏi mãi mấy nốt này".
   */
  it('hai quãng chồng nhau thì nốt chung chỉ đếm một lần', () => {
    const pool = questionsForOptions({
      hands: 'right',
      rangeIds: ['the-tay-do', 'quang-do-giua'],
      accidentals: false,
    });
    expect(pool.filter((q) => q.note.midi === 60)).toHaveLength(1);
    expect(pool.map((q) => q.note.midi)).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('tắt dấu hoá thì không phím đen nào lọt vào', () => {
    const pool = questionsForOptions({ hands: 'both', rangeIds: DRILL_RANGES.map((r) => r.id), accidentals: false });
    expect(pool.some((q) => isBlackKey(q.note.midi))).toBe(false);
  });

  it('bật dấu hoá thì quãng Đô giữa đủ mười hai nốt', () => {
    const pool = questionsForOptions({ hands: 'right', rangeIds: ['quang-do-giua'], accidentals: true });
    expect(pool).toHaveLength(12);
    expect(pool.filter((q) => isBlackKey(q.note.midi))).toHaveLength(5);
  });

  it('không chọn quãng nào thì kho rỗng, không ném lỗi', () => {
    expect(questionsForOptions({ hands: 'right', rangeIds: [], accidentals: false })).toEqual([]);
  });

  it('bỏ qua vùng mà khóa đang chọn không vẽ nổi', () => {
    // Quãng cao là vùng của khóa Sol; chọn nó với tay trái thì không ra nốt nào.
    expect(questionsForOptions({ hands: 'left', rangeIds: ['quang-cao'], accidentals: false })).toEqual([]);
  });
});

describe('rangesFor — chỉ hiện vùng đọc được', () => {
  it('tay phải không có quãng trầm, tay trái không có quãng cao', () => {
    const right = rangesFor('right').map((r) => r.id);
    const left = rangesFor('left').map((r) => r.id);
    expect(right).not.toContain('quang-tram');
    expect(right).toContain('quang-cao');
    expect(left).toContain('quang-tram');
    expect(left).not.toContain('quang-cao');
  });

  it('cả hai tay thì thấy hết', () => {
    expect(rangesFor('both')).toHaveLength(DRILL_RANGES.length);
  });

  it('mọi vùng đều khai được ít nhất một khóa', () => {
    for (const r of DRILL_RANGES) {
      expect(Object.keys(r.perClef).length, `${r.id} chưa khai khóa nào`).toBeGreaterThan(0);
    }
  });

  it('clefsFor trả đúng khóa cho từng tay', () => {
    expect(clefsFor('right')).toEqual(['treble']);
    expect(clefsFor('left')).toEqual(['bass']);
    expect(clefsFor('both')).toEqual(['treble', 'bass']);
  });
});

describe('pickNextQuestion', () => {
  const pool = questionsForOptions(DEFAULT_OPTIONS);

  it('không hỏi lại ngay câu vừa rồi', () => {
    const first = pool[0];
    for (let i = 0; i < 20; i++) {
      const next = pickNextQuestion(pool, first, () => i / 20);
      expect(next.note.midi).not.toBe(first.note.midi);
    }
  });

  it('kho chỉ có một nốt thì đành hỏi lại chính nó', () => {
    const one = questionsForOptions({ hands: 'right', rangeIds: ['the-tay-do'], accidentals: false }).slice(0, 1);
    expect(pickNextQuestion(one, one[0]).note.midi).toBe(one[0].note.midi);
  });

  it('cùng cao độ nhưng khác khóa vẫn là câu khác', () => {
    const both = questionsForOptions({ hands: 'both', rangeIds: ['quang-do-giua'], accidentals: false });
    const treble = both.find((q) => q.clef === 'treble' && q.note.midi === 60)!;
    const bass = both.find((q) => q.clef === 'bass' && q.note.midi === 60)!;
    expect(treble).toBeDefined();
    expect(bass).toBeDefined();
  });

  it('kho rỗng thì ném lỗi rõ ràng chứ không trả undefined', () => {
    expect(() => pickNextQuestion([], null)).toThrow();
  });
});

describe('singleNoteAbc', () => {
  it('vẽ đúng một nốt, đúng khóa, không có số chỉ nhịp', () => {
    expect(singleNoteAbc(noteAt(60), 'treble')).toContain('clef=treble');
    expect(singleNoteAbc(noteAt(48), 'bass')).toContain('clef=bass');
    expect(singleNoteAbc(noteAt(48), 'bass')).toContain('M:none');
    expect(singleNoteAbc(noteAt(48), 'bass').trim().endsWith('C,')).toBe(true);
  });
});

describe('checkAnswer', () => {
  it('đúng phím là đúng', () => {
    expect(checkAnswer(60, 60)).toBe('correct');
  });

  it('đúng tên nốt sai quãng tám được tách riêng', () => {
    expect(checkAnswer(72, 60)).toBe('wrong-octave');
    expect(checkAnswer(48, 60)).toBe('wrong-octave');
  });

  it('phím khác hẳn là sai', () => {
    expect(checkAnswer(61, 60)).toBe('wrong');
  });
});

describe('describeMidiNote', () => {
  it('gọi được tên mọi phím, kể cả phím ngoài bài', () => {
    expect(describeMidiNote(60)).toBe('Đô (C4)');
    expect(describeMidiNote(61)).toBe('Đô♯/Rê♭ (C♯/D♭4)');
    expect(describeMidiNote(21)).toContain('La');
  });
});
