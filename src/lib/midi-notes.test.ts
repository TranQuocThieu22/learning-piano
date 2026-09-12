import { describe, expect, it } from 'vitest';
import {
  answerQuestion, checkAnswer, clefsFor, DEFAULT_OPTIONS, describeMidiNote, DrillOptions,
  DrillQuestion, isBlackKey, MAX_PER_STAFF, noteAt,
  notePoolForOptions, octaveLabel, octavesFor, OCTAVES_BY_CLEF, pickNextQuestion, questionAbc,
} from './midi-notes';

/** Lựa chọn dựng nhanh cho test, khỏi phải khai đủ năm trường mỗi lần. */
const opts = (extra: Partial<DrillOptions> = {}): DrillOptions => ({ ...DEFAULT_OPTIONS, ...extra });

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

describe('notePoolForOptions — kho nốt', () => {
  it('mặc định là năm nốt thế tay Đô ở khóa Sol, đúng Chương 1', () => {
    const pool = notePoolForOptions(DEFAULT_OPTIONS);
    expect(pool.map((q) => q.note.midi)).toEqual([60, 62, 64, 65, 67]);
    expect(pool.every((q) => q.clef === 'treble')).toBe(true);
  });

  it('tắt thế tay 5 ngón thì được trọn bảy nốt Đô–Si', () => {
    const pool = notePoolForOptions(opts({ fiveFinger: false }));
    expect(pool.map((q) => q.note.midi)).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('tay trái lấy đúng quãng của khóa Pha', () => {
    const pool = notePoolForOptions(opts({ hands: 'left', octaves: [3] }));
    expect(pool.map((q) => q.note.midi)).toEqual([48, 50, 52, 53, 55]);
    expect(pool.every((q) => q.clef === 'bass')).toBe(true);
  });

  it('cả hai tay thì quãng Đô giữa ra hai câu cho cùng một nốt, mỗi khóa một câu', () => {
    const pool = notePoolForOptions(opts({ hands: 'both', octaves: [4], fiveFinger: true, accidentals: false }));
    const doGiua = pool.filter((q) => q.note.midi === 60);
    expect(doGiua.map((q) => q.clef).sort()).toEqual(['bass', 'treble']);
  });

  it('chọn nhiều quãng thì nốt nhảy qua lại giữa chúng', () => {
    const pool = notePoolForOptions(opts({ hands: 'right', octaves: [4, 6], fiveFinger: false, accidentals: false }));
    expect(pool.some((q) => q.note.midi === 60)).toBe(true);
    expect(pool.some((q) => q.note.midi === 95)).toBe(true);
  });

  it('tắt dấu hoá thì không phím đen nào lọt vào', () => {
    const pool = notePoolForOptions(opts({ hands: 'both', octaves: [1, 2, 3, 4, 5, 6, 7], fiveFinger: false, accidentals: false }));
    expect(pool.some((q) => isBlackKey(q.note.midi))).toBe(false);
  });

  it('bật dấu hoá thì một quãng đủ mười hai nốt', () => {
    const pool = notePoolForOptions(opts({ hands: 'right', octaves: [4], fiveFinger: false, accidentals: true }));
    expect(pool).toHaveLength(12);
    expect(pool.filter((q) => isBlackKey(q.note.midi))).toHaveLength(5);
  });

  it('thế tay 5 ngón có dấu hoá thì lấy đủ tám phím liền nhau Đô–Sol', () => {
    const pool = notePoolForOptions(opts({ hands: 'right', octaves: [4], fiveFinger: true, accidentals: true }));
    expect(pool.map((q) => q.note.midi)).toEqual([60, 61, 62, 63, 64, 65, 66, 67]);
  });

  it('không chọn quãng nào thì kho rỗng, không ném lỗi', () => {
    expect(notePoolForOptions(opts({ octaves: [] }))).toEqual([]);
  });

  /*
   * Quãng 6 chỉ đọc được ở khóa Sol. Chọn nó rồi đổi sang tay trái mà mã này
   * không lọc thì bài luyện hỏi một nốt nằm dưới bảy dòng kẻ phụ.
   */
  it('bỏ qua quãng mà khóa đang chọn không đọc nổi', () => {
    expect(notePoolForOptions(opts({ hands: 'left', octaves: [6] }))).toEqual([]);
    const both = notePoolForOptions(opts({ hands: 'both', octaves: [6], fiveFinger: true, accidentals: false }));
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

describe('pickNextQuestion — câu một nốt', () => {
  const pool = notePoolForOptions(DEFAULT_OPTIONS);

  it('không hỏi lại ngay câu vừa rồi', () => {
    const first: DrillQuestion = { parts: [pool[0]] };
    for (let i = 0; i < 20; i++) {
      const next = pickNextQuestion(pool, first, DEFAULT_OPTIONS, () => i / 20)!;
      expect(next.parts).toHaveLength(1);
      expect(next.parts[0].note.midi).not.toBe(pool[0].note.midi);
    }
  });

  it('kho chỉ có một nốt thì đành hỏi lại chính nó', () => {
    const one = pool.slice(0, 1);
    const next = pickNextQuestion(one, { parts: one }, DEFAULT_OPTIONS)!;
    expect(next.parts[0].note.midi).toBe(one[0].note.midi);
  });

  it('kho rỗng thì trả về null chứ không ném lỗi', () => {
    expect(pickNextQuestion([], null, DEFAULT_OPTIONS)).toBeNull();
  });
});

describe('pickNextQuestion — câu hai nốt', () => {
  const haiTay = opts({ hands: 'both', octaves: [4], notesPerQuestion: 'both' });
  const pool = notePoolForOptions(haiTay);

  it('ra hai nốt, mỗi khuông một nốt', () => {
    for (let i = 0; i < 10; i++) {
      const q = pickNextQuestion(pool, null, haiTay, () => i / 10)!;
      expect(q.parts).toHaveLength(2);
      expect(q.parts.map((p) => p.clef).sort()).toEqual(['bass', 'treble']);
    }
  });

  /*
   * Đường lùi quan trọng nhất: người học đang tập MỘT tay mà lựa chọn còn để
   * "hai nốt" (chọn từ lúc tập hai tay, giờ đổi sang tay phải). Không có đường
   * lùi thì câu hỏi rỗng, màn hình trắng.
   */
  it('kho chỉ có một khóa thì lùi về câu một nốt', () => {
    const motTay = opts({ notesPerQuestion: 'both' });
    const q = pickNextQuestion(notePoolForOptions(motTay), null, motTay)!;
    expect(q.parts).toHaveLength(1);
    expect(q.parts[0].clef).toBe('treble');
  });

  it('quãng chỉ đọc được ở một khóa cũng lùi về một nốt', () => {
    // Quãng 6 không đọc được ở khóa Pha, nên dù chọn cả hai tay vẫn chỉ có bè trên.
    const chiCao = opts({ hands: 'both', octaves: [6], notesPerQuestion: 'both' });
    const q = pickNextQuestion(notePoolForOptions(chiCao), null, chiCao)!;
    expect(q.parts).toHaveLength(1);
  });

  it('ngẫu nhiên thì khi một nốt khi hai nốt', () => {
    const nganNhien = opts({ hands: 'both', octaves: [4], notesPerQuestion: 'mixed' });
    const nho = pickNextQuestion(pool, null, nganNhien, () => 0.2)!;
    const lon = pickNextQuestion(pool, null, nganNhien, () => 0.9)!;
    expect(nho.parts).toHaveLength(2);
    expect(lon.parts).toHaveLength(1);
  });
});

describe('pickNextQuestion — chồng nốt như hợp âm', () => {
  const chord = (extra: Partial<DrillOptions> = {}) => opts({
    octaves: [4], fiveFinger: false, maxPerStaff: 3, ...extra,
  });

  /** Bốc nhiều câu bằng nhiều giá trị random khác nhau, để không rơi vào một ca may mắn. */
  const nhieuCau = (o: DrillOptions, lan = 30) => {
    const pool = notePoolForOptions(o);
    return Array.from({ length: lan }, (_, i) => pickNextQuestion(pool, null, o, () => (i * 7 % 29) / 29)!);
  };

  it('không câu nào vượt quá số nốt tối đa mỗi khuông', () => {
    for (const q of nhieuCau(chord())) {
      expect(q.parts.length).toBeGreaterThanOrEqual(1);
      expect(q.parts.length).toBeLessThanOrEqual(3);
    }
  });

  it('có câu nhiều hơn một nốt, và cũng có câu ít hơn mức tối đa', () => {
    const soNot = new Set(nhieuCau(chord()).map((q) => q.parts.length));
    expect(Math.max(...soNot)).toBeGreaterThan(1);
    expect(soNot.size).toBeGreaterThan(1);
  });

  it('câu một khuông thì mọi nốt nằm cùng một khuông', () => {
    for (const q of nhieuCau(chord({ hands: 'both', notesPerQuestion: 'one' }))) {
      expect(new Set(q.parts.map((p) => p.clef)).size).toBe(1);
    }
  });

  /*
   * Hai luật của chồng nốt đều là chuyện bàn tay: không quá một quãng tám thì mới
   * với tới, và không có hai nốt cách nhau nửa cung thì mới giống bản nhạc thật.
   */
  it('chồng nốt nằm trong tầm một bàn tay và không có hai nốt sát nhau nửa cung', () => {
    for (const q of nhieuCau(chord({ maxPerStaff: 4, accidentals: true }))) {
      for (const clef of ['treble', 'bass'] as const) {
        const midis = q.parts.filter((p) => p.clef === clef).map((p) => p.note.midi).sort((a, b) => a - b);
        if (midis.length < 2) continue;
        expect(midis.at(-1)! - midis[0]).toBeLessThanOrEqual(12);
        for (let i = 1; i < midis.length; i++) expect(midis[i] - midis[i - 1]).toBeGreaterThanOrEqual(2);
        expect(new Set(midis).size).toBe(midis.length);
      }
    }
  });

  it('hai tay thì mỗi khuông có chồng riêng', () => {
    const haiTay = chord({ hands: 'both', notesPerQuestion: 'both', maxPerStaff: 2 });
    const coCaHai = nhieuCau(haiTay).some((q) => (
      q.parts.filter((p) => p.clef === 'treble').length >= 1
      && q.parts.filter((p) => p.clef === 'bass').length >= 1
    ));
    expect(coCaHai).toBe(true);
  });

  it('kho ít nốt quá thì ra chồng ngắn hơn, không ném lỗi', () => {
    // Thế tay Đô chỉ có năm nốt trắng, mà luật cách nhau nửa cung còn loại bớt.
    const hep = opts({ maxPerStaff: 4 });
    for (const q of nhieuCau(hep, 10)) expect(q.parts.length).toBeGreaterThanOrEqual(1);
  });

  it('trần số nốt mỗi khuông là 4', () => {
    expect(MAX_PER_STAFF).toBe(4);
    const quaTran = opts({ octaves: [4], fiveFinger: false, maxPerStaff: 99 });
    for (const q of nhieuCau(quaTran, 10)) expect(q.parts.length).toBeLessThanOrEqual(MAX_PER_STAFF);
  });
});

describe('questionAbc', () => {
  const mot = (midi: number, clef: 'treble' | 'bass'): DrillQuestion => ({ parts: [{ note: noteAt(midi), clef }] });

  it('vẽ đúng một nốt, đúng khóa, không có số chỉ nhịp', () => {
    expect(questionAbc(mot(60, 'treble'))).toContain('clef=treble');
    expect(questionAbc(mot(48, 'bass'))).toContain('clef=bass');
    expect(questionAbc(mot(48, 'bass'))).toContain('M:none');
    expect(questionAbc(mot(48, 'bass')).trim().endsWith('C,')).toBe(true);
  });

  /*
   * Khuông đôi là chế độ của người chọn tập cả hai tay: đọc được nốt nằm ở
   * khuông NÀO cũng là một phần của bài. Khuông còn lại phải là lặng ẩn `x`,
   * không phải `z` — dấu lặng vẽ ra trông như một ký hiệu phải đọc.
   */
  it('khuông đôi đặt nốt đúng khuông, khuông kia để lặng ẩn', () => {
    const treble = questionAbc(mot(60, 'treble'), true);
    expect(treble).toContain('%%staves {1 2}');
    expect(treble).toContain('V:1 clef=treble\nC');
    expect(treble).toContain('V:2 clef=bass\nx');

    const bass = questionAbc(mot(48, 'bass'), true);
    expect(bass).toContain('V:1 clef=treble\nx');
    expect(bass).toContain('V:2 clef=bass\nC,');
  });

  it('nhiều nốt cùng khuông gom vào một cặp ngoặc, xếp từ thấp lên cao', () => {
    const abc = questionAbc({
      parts: [
        { note: noteAt(67), clef: 'treble' },
        { note: noteAt(60), clef: 'treble' },
        { note: noteAt(64), clef: 'treble' },
      ],
    });
    expect(abc.trim().endsWith('[CEG]')).toBe(true);
  });

  it('câu hai nốt thì mỗi khuông một nốt, không khuông nào để lặng', () => {
    const abc = questionAbc({
      parts: [{ note: noteAt(67), clef: 'treble' }, { note: noteAt(48), clef: 'bass' }],
    }, true);
    expect(abc).toContain('V:1 clef=treble\nG');
    expect(abc).toContain('V:2 clef=bass\nC,');
    expect(abc).not.toContain('x');
  });
});

describe('answerQuestion — so phím với câu đang chờ', () => {
  const mot: DrillQuestion = { parts: [{ note: noteAt(60), clef: 'treble' }] };
  const hai: DrillQuestion = {
    parts: [{ note: noteAt(67), clef: 'treble' }, { note: noteAt(48), clef: 'bass' }],
  };

  it('câu một nốt: bấm đúng là xong', () => {
    expect(answerQuestion(mot, [], 60)).toEqual({ kind: 'correct', collected: [60] });
  });

  it('câu một nốt: cùng tên khác quãng tám được tách riêng', () => {
    expect(answerQuestion(mot, [], 72).kind).toBe('wrong-octave');
    expect(answerQuestion(mot, [], 61).kind).toBe('wrong');
  });

  it('câu hai nốt: bấm một nốt thì báo còn thiếu, chưa xong', () => {
    const out = answerQuestion(hai, [], 67);
    expect(out.kind).toBe('partial');
    if (out.kind === 'partial') {
      expect(out.done.clef).toBe('treble');
      expect(out.collected).toEqual([67]);
    }
  });

  it('câu hai nốt: bấm nốt nào trước cũng được', () => {
    const bassTruoc = answerQuestion(hai, [], 48);
    expect(bassTruoc.kind).toBe('partial');
    if (bassTruoc.kind === 'partial') {
      expect(answerQuestion(hai, bassTruoc.collected, 67)).toEqual({ kind: 'correct', collected: [48, 67] });
    }
  });

  /*
   * **Ca sinh ra từ một lỗ thật.** Micro nghe cả hai nốt trong cùng một lần, nên
   * chỗ gọi xử lý hai phím liền nhau trong một nhịp. Nối kết quả lần trước sang
   * lần sau — như mã trong component làm bằng ref — thì câu mới xong được.
   */
  it('hai phím trong cùng một nhịp: nối collected là xong câu', () => {
    const lan1 = answerQuestion(hai, [], 67);
    const daCo = lan1.kind === 'partial' ? lan1.collected : [];
    expect(answerQuestion(hai, daCo, 48).kind).toBe('correct');
    // Còn đọc lại danh sách cũ (state chưa kịp cập nhật) thì kẹt ở 'partial'.
    expect(answerQuestion(hai, [], 48).kind).toBe('partial');
  });

  it('câu hai nốt: bấm sai vẫn giữ nguyên nốt đã đúng', () => {
    expect(answerQuestion(hai, [67], 50).kind).toBe('wrong');
    expect(answerQuestion(hai, [67], 60).kind).toBe('wrong-octave');
  });

  /*
   * Ca này giữ cho micro khỏi báo sai oan: người học bấm nốt thứ nhất rồi giữ
   * nguyên ngón trong lúc tìm nốt thứ hai, tiếng đàn còn ngân nên lần nghe nào
   * micro cũng nghe lại nốt đó.
   */
  it('nốt đã đúng mà nghe lại thì bỏ qua, không tính là sai', () => {
    expect(answerQuestion(hai, [67], 67).kind).toBe('again');
    expect(answerQuestion(hai, [48, 67], 67).kind).toBe('correct');
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
