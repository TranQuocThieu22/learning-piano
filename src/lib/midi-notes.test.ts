import { describe, expect, it } from 'vitest';
import {
  checkAnswer, clefsFor, DEFAULT_OPTIONS, describeMidiNote, isBlackKey, noteAt, octaveLabel,
  octavesFor, OCTAVES_BY_CLEF, pickNextQuestion, questionsForOptions, singleNoteAbc,
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

  it('tắt thế tay 5 ngón thì được trọn bảy nốt Đô–Si', () => {
    const pool = questionsForOptions({ ...DEFAULT_OPTIONS, fiveFinger: false });
    expect(pool.map((q) => q.note.midi)).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('tay trái lấy đúng quãng của khóa Pha', () => {
    const pool = questionsForOptions({ ...DEFAULT_OPTIONS, hands: 'left', octaves: [3] });
    expect(pool.map((q) => q.note.midi)).toEqual([48, 50, 52, 53, 55]);
    expect(pool.every((q) => q.clef === 'bass')).toBe(true);
  });

  it('cả hai tay thì quãng Đô giữa ra hai câu cho cùng một nốt, mỗi khóa một câu', () => {
    const pool = questionsForOptions({ hands: 'both', octaves: [4], fiveFinger: true, accidentals: false });
    const doGiua = pool.filter((q) => q.note.midi === 60);
    expect(doGiua.map((q) => q.clef).sort()).toEqual(['bass', 'treble']);
  });

  it('chọn nhiều quãng thì nốt nhảy qua lại giữa chúng', () => {
    const pool = questionsForOptions({
      hands: 'right', octaves: [4, 6], fiveFinger: false, accidentals: false,
    });
    expect(pool.some((q) => q.note.midi === 60)).toBe(true);
    expect(pool.some((q) => q.note.midi === 95)).toBe(true);
  });

  it('tắt dấu hoá thì không phím đen nào lọt vào', () => {
    const pool = questionsForOptions({
      hands: 'both', octaves: [1, 2, 3, 4, 5, 6, 7], fiveFinger: false, accidentals: false,
    });
    expect(pool.some((q) => isBlackKey(q.note.midi))).toBe(false);
  });

  it('bật dấu hoá thì một quãng đủ mười hai nốt', () => {
    const pool = questionsForOptions({
      hands: 'right', octaves: [4], fiveFinger: false, accidentals: true,
    });
    expect(pool).toHaveLength(12);
    expect(pool.filter((q) => isBlackKey(q.note.midi))).toHaveLength(5);
  });

  it('thế tay 5 ngón có dấu hoá thì lấy đủ tám phím liền nhau Đô–Sol', () => {
    const pool = questionsForOptions({
      hands: 'right', octaves: [4], fiveFinger: true, accidentals: true,
    });
    expect(pool.map((q) => q.note.midi)).toEqual([60, 61, 62, 63, 64, 65, 66, 67]);
  });

  it('không chọn quãng nào thì kho rỗng, không ném lỗi', () => {
    expect(questionsForOptions({ ...DEFAULT_OPTIONS, octaves: [] })).toEqual([]);
  });

  /*
   * Quãng 6 chỉ đọc được ở khóa Sol. Chọn nó rồi đổi sang tay trái mà mã này
   * không lọc thì bài luyện hỏi một nốt nằm dưới bảy dòng kẻ phụ.
   */
  it('bỏ qua quãng mà khóa đang chọn không đọc nổi', () => {
    expect(questionsForOptions({ ...DEFAULT_OPTIONS, hands: 'left', octaves: [6] })).toEqual([]);
    const both = questionsForOptions({ hands: 'both', octaves: [6], fiveFinger: true, accidentals: false });
    expect(both.every((q) => q.clef === 'treble')).toBe(true);
  });
});

describe('octavesFor — quãng nào chọn được với tay nào', () => {
  it('tay phải không có quãng trầm, tay trái không có quãng cao', () => {
    expect(octavesFor('right')).toEqual([4, 5, 6, 7]);
    expect(octavesFor('left')).toEqual([1, 2, 3, 4]);
  });

  it('cả hai tay thì gộp lại, không trùng lặp và xếp thấp tới cao', () => {
    expect(octavesFor('both')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('quãng Đô giữa thuộc về cả hai khóa', () => {
    expect(OCTAVES_BY_CLEF.treble).toContain(4);
    expect(OCTAVES_BY_CLEF.bass).toContain(4);
  });

  it('tên quãng gọi theo nốt Đô, riêng quãng 4 là Đô giữa', () => {
    expect(octaveLabel(4)).toBe('Đô giữa');
    expect(octaveLabel(2)).toBe('Đô2');
    expect(octaveLabel(7)).toBe('Đô7');
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
    const one = questionsForOptions(DEFAULT_OPTIONS).slice(0, 1);
    expect(pickNextQuestion(one, one[0]).note.midi).toBe(one[0].note.midi);
  });

  it('cùng cao độ nhưng khác khóa vẫn là câu khác', () => {
    const both = questionsForOptions({ hands: 'both', octaves: [4], fiveFinger: true, accidentals: false });
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

  /*
   * Khuông đôi là chế độ của người chọn tập cả hai tay: đọc được nốt nằm ở
   * khuông NÀO cũng là một phần của bài. Khuông còn lại phải là lặng ẩn `x`,
   * không phải `z` — dấu lặng vẽ ra trông như một ký hiệu phải đọc.
   */
  it('khuông đôi đặt nốt đúng khuông, khuông kia để lặng ẩn', () => {
    const treble = singleNoteAbc(noteAt(60), 'treble', true);
    expect(treble).toContain('%%staves {1 2}');
    expect(treble).toContain('V:1 clef=treble\nC');
    expect(treble).toContain('V:2 clef=bass\nx');

    const bass = singleNoteAbc(noteAt(48), 'bass', true);
    expect(bass).toContain('V:1 clef=treble\nx');
    expect(bass).toContain('V:2 clef=bass\nC,');
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
