import { describe, expect, it } from 'vitest';
import {
  allParts, answerBeat, BEATS_PER_BAR, checkAnswer, clefsFor, DEFAULT_OPTIONS, describeMidiNote,
  DRILL_PRESETS, DrillOptions, DrillPart, DrillQuestion, findKey, KEY_SIGNATURES,
  MAX_PER_STAFF, noteAt, notePoolForOptions, octaveLabel, octavesFor, OCTAVES_BY_CLEF,
  pickNextQuestion, presetOf, questionAbc,
} from './midi-notes';
import { isBlackPitch } from './pitch';

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
    for (let midi = 60; midi < 72; midi++) if (isBlackPitch(midi)) black.push(midi);
    expect(black).toEqual([61, 63, 66, 68, 70]);
  });
});

describe('hoá biểu', () => {
  const G = findKey('G');
  const F = findKey('F');

  it('bảy giọng, từ không dấu tới ba dấu mỗi bên', () => {
    expect(KEY_SIGNATURES.map((k) => k.id)).toEqual(['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb']);
    expect(Object.keys(findKey('A').alter)).toHaveLength(3);
    expect(Object.keys(findKey('Eb').alter)).toHaveLength(3);
  });

  it('giọng lạ thì lùi về Đô trưởng chứ không vỡ', () => {
    expect(findKey('khong-co-that').id).toBe('C');
  });

  /*
   * Đây là cả điểm của hoá biểu, và là ca test quan trọng nhất của nhóm này:
   * nốt đã nằm trong hoá biểu thì viết TRƠN, không dấu nào bên cạnh.
   */
  it('nốt nằm trong hoá biểu viết trơn, không dấu cạnh nốt', () => {
    expect(noteAt(66, G).abc).toBe('F');
    expect(noteAt(66, G).name).toBe('Pha thăng');
    expect(noteAt(58, F).abc).toBe('B,');
    expect(noteAt(58, F).name).toBe('Si giáng');
  });

  it('nốt trắng mà hoá biểu có hoá chữ cái đó thì phải ghi dấu bình', () => {
    expect(noteAt(65, G).abc).toBe('=F');
    expect(noteAt(65, G).name).toBe('Pha');
    expect(noteAt(59, F).abc).toBe('=B,');
  });

  it('nốt hoá bất thường viết theo thói quen của giọng', () => {
    // Giọng thăng viết dấu thăng, giọng giáng viết dấu giáng.
    expect(noteAt(61, G).abc).toBe('^C');
    expect(noteAt(61, F).abc).toBe('_D');
  });

  it('giọng Đô trưởng giữ nguyên cách gọi quen của giáo trình', () => {
    expect(noteAt(61).name).toBe('Đô thăng');
    expect(noteAt(63).name).toBe('Mi giáng');
    expect(noteAt(66).name).toBe('Pha thăng');
    expect(noteAt(68).name).toBe('Sol thăng');
    expect(noteAt(70).name).toBe('Si giáng');
  });

  it('dấu quãng tám vẫn bám theo chữ cái', () => {
    expect(noteAt(54, G).abc).toBe('F,');   // Pha thăng quãng 3, nằm trong hoá biểu
    expect(noteAt(46, F).abc).toBe('B,,');  // Si giáng quãng 2
  });

  it('kho nốt theo giọng: Pha thăng có mặt, Pha thường thì không', () => {
    const pool = notePoolForOptions(opts({ octaves: [4], fiveFinger: false }), G);
    const midis = pool.map((p) => p.note.midi);
    expect(midis).toContain(66); // Pha thăng — nốt của giọng
    expect(midis).not.toContain(65); // Pha thường — nốt hoá bất thường
    expect(pool.every((p) => !/[\^_=]/.test(p.note.abc))).toBe(true);
  });

  it('bật nốt hoá bất thường thì đủ mười hai phím, có cả dấu bình', () => {
    const pool = notePoolForOptions(opts({ octaves: [4], fiveFinger: false, accidentals: true }), G);
    expect(pool).toHaveLength(12);
    expect(pool.find((p) => p.note.midi === 65)!.note.abc).toBe('=F');
  });

  it('bản nhạc ghi đúng hoá biểu ở đầu khuông', () => {
    const cau: DrillQuestion = { key: G, beats: [[{ note: noteAt(66, G), clef: 'treble' }]] };
    expect(questionAbc(cau)).toContain('K:G clef=treble');
    expect(questionAbc(cau, true)).toContain('K:G');

    const eb = findKey('Eb');
    expect(questionAbc({ key: eb, beats: [[{ note: noteAt(63, eb), clef: 'treble' }]] })).toContain('K:Eb');
  });

  /*
   * Đây là chỗ chủ sản phẩm bắt sửa: chọn một giọng rồi giữ nguyên thì sau vài
   * câu người học thuộc lòng giọng đó và thôi không nhìn đầu khuông nữa.
   */
  it('bật đổi hoá biểu thì mỗi câu một giọng, và không lặp lại giọng vừa rồi', () => {
    const o = opts({ randomKeys: true, octaves: [4], fiveFinger: false });
    let truoc = pickNextQuestion(o, null, () => 0)!;
    const daGap = new Set([truoc.key.id]);
    for (let i = 1; i < 20; i++) {
      const sau = pickNextQuestion(o, truoc, () => (i * 13 % 31) / 31)!;
      expect(sau.key.id).not.toBe(truoc.key.id);
      daGap.add(sau.key.id);
      truoc = sau;
    }
    expect(daGap.size).toBeGreaterThan(3);
  });

  it('tắt đổi hoá biểu thì câu nào cũng Đô trưởng', () => {
    const o = opts({ randomKeys: false });
    for (let i = 0; i < 10; i++) {
      expect(pickNextQuestion(o, null, () => i / 10)!.key.id).toBe('C');
    }
  });

  /*
   * Nốt của câu phải viết theo ĐÚNG giọng của câu đó. Sai chỗ này thì bản nhạc
   * hiện một đằng, app chờ một nẻo — mà nhìn bằng mắt vẫn thấy hợp lý.
   */
  it('nốt trong câu viết theo đúng giọng của chính câu đó', () => {
    const o = opts({ randomKeys: true, octaves: [4], fiveFinger: false, accidentals: true });
    for (let i = 0; i < 30; i++) {
      const cau = pickNextQuestion(o, null, () => (i * 17 % 41) / 41)!;
      for (const part of cau.beats[0]) {
        expect(part.note.abc).toBe(noteAt(part.note.midi, cau.key).abc);
      }
    }
  });

  /*
   * Kho nốt hiện cho người học (không truyền giọng) phải là kho GỘP: cả buổi tập
   * thì gặp hết các giọng, nên Mi giáng của giọng Mi giáng cũng là nốt đang tập.
   */
  it('không truyền giọng thì gộp kho của mọi giọng đang bật', () => {
    const tat = notePoolForOptions(opts({ octaves: [4], fiveFinger: false, randomKeys: false }));
    const bat = notePoolForOptions(opts({ octaves: [4], fiveFinger: false, randomKeys: true }));
    expect(tat.map((p) => p.note.midi)).not.toContain(63); // Mi giáng
    expect(bat.map((p) => p.note.midi)).toContain(63);
    expect(bat.length).toBeGreaterThan(tat.length);
    // Gộp rồi vẫn không được trùng phím.
    expect(new Set(bat.map((p) => `${p.clef}:${p.note.midi}`)).size).toBe(bat.length);
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
    expect(pool.some((q) => isBlackPitch(q.note.midi))).toBe(false);
  });

  it('bật dấu hoá thì một quãng đủ mười hai nốt', () => {
    const pool = notePoolForOptions(opts({ hands: 'right', octaves: [4], fiveFinger: false, accidentals: true }));
    expect(pool).toHaveLength(12);
    expect(pool.filter((q) => isBlackPitch(q.note.midi))).toHaveLength(5);
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
    expect(octavesFor('right')).toEqual([4, 5, 6]);
    expect(octavesFor('left')).toEqual([2, 3, 4]);
  });

  it('cả hai tay thì gộp lại, không trùng lặp và xếp thấp tới cao', () => {
    expect(octavesFor('both')).toEqual([2, 3, 4, 5, 6]);
  });

  /*
   * Hai quãng rìa đàn bỏ hẳn: Si quãng 7 phải kẻ chín dòng kẻ phụ, vẽ ra cao gấp
   * rưỡi khuông nhạc nên hoặc bị cắt hoặc phải thu nhỏ — mà thu nhỏ thì kích
   * thước chữ nhạc lại nhảy mỗi câu một kiểu.
   */
  it('hai quãng rìa đàn không chọn được ở khóa nào cả', () => {
    for (const hands of ['right', 'left', 'both'] as const) {
      expect(octavesFor(hands)).not.toContain(1);
      expect(octavesFor(hands)).not.toContain(7);
    }
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
    const first: DrillQuestion = { key: KEY_SIGNATURES[0], beats: [[pool[0]]] };
    for (let i = 0; i < 20; i++) {
      const next = pickNextQuestion(DEFAULT_OPTIONS, first, () => i / 20)!;
      expect(next.beats[0]).toHaveLength(1);
      expect(next.beats[0][0].note.midi).not.toBe(pool[0].note.midi);
    }
  });

  /*
   * Né hết kho rồi thì thà hỏi lại còn hơn trả về câu rỗng. Dựng bằng cách cho
   * câu trước ôm trọn kho — không thì không có cách nào chạm tới nhánh này.
   */
  it('né hết kho thì đành hỏi lại nốt cũ chứ không bỏ trống', () => {
    const hep = opts({ octaves: [6], fiveFinger: true });
    const kho = notePoolForOptions(hep);
    const truoc: DrillQuestion = { key: KEY_SIGNATURES[0], beats: [kho] };
    const next = pickNextQuestion(hep, truoc)!;
    expect(next.beats[0]).toHaveLength(1);
    expect(kho.map((p) => p.note.midi)).toContain(next.beats[0][0].note.midi);
  });

  it('kho rỗng thì trả về null chứ không ném lỗi', () => {
    expect(pickNextQuestion(opts({ octaves: [] }), null)).toBeNull();
  });
});

describe('pickNextQuestion — câu hai nốt', () => {
  const haiTay = opts({ hands: 'both', octaves: [4], notesPerQuestion: 'both' });

  it('ra hai nốt, mỗi khuông một nốt', () => {
    for (let i = 0; i < 10; i++) {
      const q = pickNextQuestion(haiTay, null, () => i / 10)!;
      expect(q.beats[0]).toHaveLength(2);
      expect(q.beats[0].map((p) => p.clef).sort()).toEqual(['bass', 'treble']);
    }
  });

  /*
   * Đường lùi quan trọng nhất: người học đang tập MỘT tay mà lựa chọn còn để
   * "hai nốt" (chọn từ lúc tập hai tay, giờ đổi sang tay phải). Không có đường
   * lùi thì câu hỏi rỗng, màn hình trắng.
   */
  it('kho chỉ có một khóa thì lùi về câu một nốt', () => {
    const motTay = opts({ notesPerQuestion: 'both' });
    const q = pickNextQuestion(motTay, null)!;
    expect(q.beats[0]).toHaveLength(1);
    expect(q.beats[0][0].clef).toBe('treble');
  });

  it('quãng chỉ đọc được ở một khóa cũng lùi về một nốt', () => {
    // Quãng 6 không đọc được ở khóa Pha, nên dù chọn cả hai tay vẫn chỉ có bè trên.
    const chiCao = opts({ hands: 'both', octaves: [6], notesPerQuestion: 'both' });
    const q = pickNextQuestion(chiCao, null)!;
    expect(q.beats[0]).toHaveLength(1);
  });

  it('ngẫu nhiên thì khi một nốt khi hai nốt', () => {
    const nganNhien = opts({ hands: 'both', octaves: [4], notesPerQuestion: 'mixed' });
    const nho = pickNextQuestion(nganNhien, null, () => 0.2)!;
    const lon = pickNextQuestion(nganNhien, null, () => 0.9)!;
    expect(nho.beats[0]).toHaveLength(2);
    expect(lon.beats[0]).toHaveLength(1);
  });
});

describe('pickNextQuestion — chồng nốt như hợp âm', () => {
  const chord = (extra: Partial<DrillOptions> = {}) => opts({
    octaves: [4], fiveFinger: false, maxPerStaff: 3, ...extra,
  });

  /** Bốc nhiều câu bằng nhiều giá trị random khác nhau, để không rơi vào một ca may mắn. */
  const nhieuCau = (o: DrillOptions, lan = 30) => Array.from(
    { length: lan },
    (_, i) => pickNextQuestion(o, null, () => (i * 7 % 29) / 29)!,
  );

  it('không câu nào vượt quá số nốt tối đa mỗi khuông', () => {
    for (const q of nhieuCau(chord())) {
      expect(q.beats[0].length).toBeGreaterThanOrEqual(1);
      expect(q.beats[0].length).toBeLessThanOrEqual(3);
    }
  });

  it('có câu nhiều hơn một nốt, và cũng có câu ít hơn mức tối đa', () => {
    const soNot = new Set(nhieuCau(chord()).map((q) => q.beats[0].length));
    expect(Math.max(...soNot)).toBeGreaterThan(1);
    expect(soNot.size).toBeGreaterThan(1);
  });

  it('câu một khuông thì mọi nốt nằm cùng một khuông', () => {
    for (const q of nhieuCau(chord({ hands: 'both', notesPerQuestion: 'one' }))) {
      expect(new Set(q.beats[0].map((p) => p.clef)).size).toBe(1);
    }
  });

  /*
   * Hai luật của chồng nốt đều là chuyện bàn tay: không quá một quãng tám thì mới
   * với tới, và không có hai nốt cách nhau nửa cung thì mới giống bản nhạc thật.
   */
  it('chồng nốt nằm trong tầm một bàn tay và không có hai nốt sát nhau nửa cung', () => {
    for (const q of nhieuCau(chord({ maxPerStaff: 4, accidentals: true }))) {
      for (const clef of ['treble', 'bass'] as const) {
        const midis = q.beats[0].filter((p) => p.clef === clef).map((p) => p.note.midi).sort((a, b) => a - b);
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
      q.beats[0].filter((p) => p.clef === 'treble').length >= 1
      && q.beats[0].filter((p) => p.clef === 'bass').length >= 1
    ));
    expect(coCaHai).toBe(true);
  });

  it('kho ít nốt quá thì ra chồng ngắn hơn, không ném lỗi', () => {
    // Thế tay Đô chỉ có năm nốt trắng, mà luật cách nhau nửa cung còn loại bớt.
    const hep = opts({ maxPerStaff: 4 });
    for (const q of nhieuCau(hep, 10)) expect(q.beats[0].length).toBeGreaterThanOrEqual(1);
  });

  it('trần số nốt mỗi khuông là 4', () => {
    expect(MAX_PER_STAFF).toBe(4);
    const quaTran = opts({ octaves: [4], fiveFinger: false, maxPerStaff: 99 });
    for (const q of nhieuCau(quaTran, 10)) expect(q.beats[0].length).toBeLessThanOrEqual(MAX_PER_STAFF);
  });
});

describe('questionAbc', () => {
  const mot = (midi: number, clef: 'treble' | 'bass'): DrillQuestion => ({
    key: KEY_SIGNATURES[0],
    beats: [[{ note: noteAt(midi), clef }]],
  });

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
      key: KEY_SIGNATURES[0],
      beats: [[
        { note: noteAt(67), clef: 'treble' },
        { note: noteAt(60), clef: 'treble' },
        { note: noteAt(64), clef: 'treble' },
      ]],
    });
    expect(abc.trim().endsWith('[CEG]')).toBe(true);
  });

  it('câu hai nốt thì mỗi khuông một nốt, không khuông nào để lặng', () => {
    const abc = questionAbc({
      key: KEY_SIGNATURES[0],
      beats: [[{ note: noteAt(67), clef: 'treble' }, { note: noteAt(48), clef: 'bass' }]],
    }, true);
    expect(abc).toContain('V:1 clef=treble\nG');
    expect(abc).toContain('V:2 clef=bass\nC,');
    expect(abc).not.toContain('x');
  });
});

/*
 * Ô nhịp 4/4 — bước từ "đọc một nốt" sang "đọc một câu nhạc".
 *
 * Ranh giới quan trọng nhất ở đây là hai tầng **cùng lúc** và **lần lượt**:
 * trong một phách thì bấm nốt nào trước cũng được, còn giữa các phách thì bắt
 * buộc trái sang phải. Trộn hai tầng là thành nhảy cóc, đúng thứ `AGENTS.md` cấm.
 */
describe('pickNextQuestion — ô nhịp 4/4', () => {
  const oNhip = (extra: Partial<DrillOptions> = {}) => opts({
    questionLength: 'bar', octaves: [4], fiveFinger: false, ...extra,
  });

  const nhieuCau = (o: DrillOptions, lan = 30) => Array.from(
    { length: lan },
    (_, i) => pickNextQuestion(o, null, () => (i * 11 % 37) / 37)!,
  );

  it('mặc định vẫn là một phách, không ai bị đổi chế độ ngoài ý muốn', () => {
    expect(DEFAULT_OPTIONS.questionLength).toBe('one');
    expect(pickNextQuestion(DEFAULT_OPTIONS, null, () => 0)!.beats).toHaveLength(1);
  });

  it('bật lên thì mỗi câu đúng bốn phách, phách nào cũng có nốt', () => {
    for (const q of nhieuCau(oNhip())) {
      expect(q.beats).toHaveLength(BEATS_PER_BAR);
      for (const beat of q.beats) expect(beat.length).toBeGreaterThanOrEqual(1);
    }
  });

  /*
   * Cả ô nhịp phải cùng MỘT hoá biểu. Mỗi phách một giọng thì hoá biểu ở đầu
   * khuông không còn nói lên điều gì — mà đọc được nó mới là việc đang tập.
   */
  it('cả ô nhịp dùng chung một hoá biểu, và mọi nốt viết theo đúng giọng đó', () => {
    for (const q of nhieuCau(oNhip({ randomKeys: true, accidentals: true }))) {
      for (const part of allParts(q)) {
        expect(part.note.abc).toBe(noteAt(part.note.midi, q.key).abc);
      }
    }
  });

  it('hai phách liền nhau không lặp lại đúng nốt vừa rồi', () => {
    for (const q of nhieuCau(oNhip())) {
      for (let i = 1; i < q.beats.length; i++) {
        const truoc = new Set(q.beats[i - 1].map((p) => `${p.clef}:${p.note.midi}`));
        const sau = q.beats[i].map((p) => `${p.clef}:${p.note.midi}`);
        expect(sau.some((k) => truoc.has(k))).toBe(false);
      }
    }
  });

  /*
   * Né liền kề thôi, KHÔNG né cả ô: cấm hết thì ô nhịp nào cũng là bốn nốt khác
   * nhau, nghe ra ngay là máy sinh chứ không giống bản nhạc thật.
   */
  it('nốt vẫn được phép quay lại ở phách xa hơn', () => {
    const hep = oNhip({ fiveFinger: true });
    const coLap = nhieuCau(hep, 40).some((q) => {
      const midis = q.beats.map((b) => b.map((p) => p.note.midi).join(','));
      return new Set(midis).size < midis.length;
    });
    expect(coLap).toBe(true);
  });

  it('một tay thì cả ô nhịp nằm trên cùng một khóa', () => {
    for (const q of nhieuCau(oNhip({ hands: 'right' }))) {
      expect(new Set(allParts(q).map((p) => p.clef))).toEqual(new Set(['treble']));
    }
  });

  it('kho chỉ có một nốt vẫn dựng đủ bốn phách chứ không trả về câu rỗng', () => {
    // Đô giữa là nốt trắng duy nhất còn lại khi chỉ chọn một quãng, năm ngón,
    // mà `pickPart` phải né nốt vừa rồi — không có đường lùi là kẹt vô tận.
    const q = pickNextQuestion(oNhip({ fiveFinger: true, maxPerStaff: 1 }), null, () => 0)!;
    expect(q.beats).toHaveLength(BEATS_PER_BAR);
  });
});

describe('questionAbc — ô nhịp 4/4', () => {
  const bar = (midis: number[], clef: 'treble' | 'bass' = 'treble'): DrillQuestion => ({
    key: KEY_SIGNATURES[0],
    beats: midis.map((m) => [{ note: noteAt(m), clef }]),
  });

  /*
   * Số chỉ nhịp là MỘT PHẦN của thứ đang tập đọc ở chế độ này, nên nó phải hiện.
   * Chế độ một phách thì ngược lại: `M:none`, vì thêm ký hiệu nào cũng là thêm
   * thứ phải đọc mà không mang nghĩa gì.
   */
  it('có số chỉ nhịp 4/4, nốt đen, và vạch nhịp đóng ô', () => {
    const abc = questionAbc(bar([60, 62, 64, 65]));
    expect(abc).toContain('M:4/4');
    // Không có dòng này thì `staffwidth` chỉ là mức trần: bốn nốt xếp theo
    // khoảng cách tự nhiên rồi dừng, chiếm quá nửa khung, phần còn lại trắng trơn.
    expect(abc).toContain('%%stretchlast 1');
    expect(abc).toContain('L:1/4');
    expect(abc.trim().endsWith('|')).toBe(true);
    expect(abc).toContain('C D E F|');
  });

  it('một phách thì vẫn không có số chỉ nhịp lẫn vạch nhịp', () => {
    const abc = questionAbc(bar([60]));
    expect(abc).toContain('M:none');
    expect(abc).not.toContain('|');
    expect(abc).not.toContain('stretchlast');
  });

  /*
   * Khuông đôi: phách nào khuông kia không có nốt thì phải là lặng ẩn `x`, và
   * hai bè phải có **cùng số phách** — lệch một cái là abcjs vẽ hai ô nhịp dài
   * khác nhau, nốt không còn thẳng hàng với nốt.
   */
  it('khuông đôi giữ hai bè thẳng hàng, chỗ trống là lặng ẩn', () => {
    const q: DrillQuestion = {
      key: KEY_SIGNATURES[0],
      beats: [
        [{ note: noteAt(60), clef: 'treble' }],
        [{ note: noteAt(48), clef: 'bass' }],
        [{ note: noteAt(64), clef: 'treble' }, { note: noteAt(48), clef: 'bass' }],
        [{ note: noteAt(65), clef: 'treble' }],
      ],
    };
    const abc = questionAbc(q, true);
    expect(abc).toContain('V:1 clef=treble\nC x E F|');
    expect(abc).toContain('V:2 clef=bass\nx C, C, x|');
  });

  it('chồng nốt trong một phách vẫn gom vào ngoặc vuông', () => {
    const q: DrillQuestion = {
      key: KEY_SIGNATURES[0],
      beats: [
        [{ note: noteAt(64), clef: 'treble' }, { note: noteAt(60), clef: 'treble' }],
        [{ note: noteAt(65), clef: 'treble' }],
        [{ note: noteAt(67), clef: 'treble' }],
        [{ note: noteAt(69), clef: 'treble' }],
      ],
    };
    expect(questionAbc(q)).toContain('[CE] F G A|');
  });
});

/*
 * Bốn mức khó dựng sẵn. Thứ dễ hỏng nhất ở đây không phải logic mà là **một mức
 * khai ra bộ lựa chọn không dùng được** — chọn quãng không đọc được ở khoá đang
 * bật chẳng hạn — vì lúc đó màn hình trống trơn mà không có lỗi nào báo.
 */
describe('mức khó dựng sẵn', () => {
  it('mặc định chính là mức đầu tiên, không phải một bộ riêng', () => {
    expect(DEFAULT_OPTIONS).toBe(DRILL_PRESETS[0].options);
    expect(presetOf(DEFAULT_OPTIONS)?.id).toBe('de');
  });

  it('mức nào cũng có mã, nhãn và một dòng nói khó ở chỗ nào', () => {
    for (const p of DRILL_PRESETS) {
      expect(p.id, p.label).toMatch(/^[a-z-]+$/);
      expect(p.label.length, p.id).toBeGreaterThan(0);
      expect(p.hint.length, p.id).toBeGreaterThan(20);
    }
    expect(new Set(DRILL_PRESETS.map((p) => p.id)).size).toBe(DRILL_PRESETS.length);
  });

  /*
   * Quãng phải đọc được ở khoá đang bật. Khai bừa thì kho nốt rỗng và bài luyện
   * hiện "chưa có nốt nào để hỏi" ngay khi bấm vào mức đó.
   */
  it('mức nào cũng ra được câu hỏi, và mọi quãng đều dùng được với tay đã chọn', () => {
    for (const p of DRILL_PRESETS) {
      const hopLe = octavesFor(p.options.hands);
      for (const o of p.options.octaves) expect(hopLe, `${p.id}: quãng ${o}`).toContain(o);
      expect(notePoolForOptions(p.options).length, p.id).toBeGreaterThan(0);
      expect(pickNextQuestion(p.options, null, () => 0.3), p.id).not.toBeNull();
    }
  });

  it('mỗi mức tự nhận ra chính nó, và không mức nào trùng mức khác', () => {
    for (const p of DRILL_PRESETS) expect(presetOf(p.options)?.id).toBe(p.id);
  });

  it('thứ tự quãng không làm lệch việc nhận mức', () => {
    const kho = DRILL_PRESETS.find((p) => p.id === 'kho')!;
    const daoNguoc = { ...kho.options, octaves: [...kho.options.octaves].reverse() };
    expect(presetOf(daoNguoc)?.id).toBe('kho');
  });

  it('chỉnh tay một ô là không còn khớp mức nào', () => {
    expect(presetOf({ ...DEFAULT_OPTIONS, accidentals: true })).toBeNull();
    expect(presetOf({ ...DEFAULT_OPTIONS, octaves: [4, 5] })).toBeNull();
    expect(presetOf({ ...DEFAULT_OPTIONS, maxPerStaff: 2 })).toBeNull();
  });

  /*
   * Thang khó phải ĐI LÊN THẬT. Không có ca này thì một lần sửa mức Khó cho "dễ
   * thở hơn" là thang đảo lộn mà chẳng ai nhận ra — nhãn vẫn ghi Khó.
   */
  it('kho nốt của mức sau không bao giờ nhỏ hơn mức trước', () => {
    const co = DRILL_PRESETS.map((p) => notePoolForOptions(p.options).length);
    for (let i = 1; i < co.length; i++) {
      expect(co[i], DRILL_PRESETS[i].id).toBeGreaterThanOrEqual(co[i - 1]);
    }
  });

  it('mức khó dần theo từng thứ đã bật, không mức nào lùi lại', () => {
    const diem = (o: DrillOptions) => [
      o.hands === 'both' ? 1 : 0,
      o.fiveFinger ? 0 : 1,
      o.randomKeys ? 1 : 0,
      o.accidentals ? 1 : 0,
      o.questionLength === 'bar' ? 1 : 0,
      o.maxPerStaff > 1 ? 1 : 0,
    ];
    for (let i = 1; i < DRILL_PRESETS.length; i++) {
      const truoc = diem(DRILL_PRESETS[i - 1].options);
      const sau = diem(DRILL_PRESETS[i].options);
      for (let k = 0; k < truoc.length; k++) {
        expect(sau[k], `${DRILL_PRESETS[i].id}, trục ${k}`).toBeGreaterThanOrEqual(truoc[k]);
      }
    }
  });

  it('mức Rất khó dùng tới trần chồng nốt, không để thừa mức nào', () => {
    expect(DRILL_PRESETS.at(-1)!.options.maxPerStaff).toBe(MAX_PER_STAFF);
  });
});

describe('answerBeat — so phím với phách đang chờ', () => {
  const mot: DrillPart[] = [{ note: noteAt(60), clef: 'treble' }];
  const hai: DrillPart[] = [
    { note: noteAt(67), clef: 'treble' },
    { note: noteAt(48), clef: 'bass' },
  ];

  it('câu một nốt: bấm đúng là xong', () => {
    expect(answerBeat(mot, [], 60)).toEqual({ kind: 'correct', collected: [60] });
  });

  it('câu một nốt: cùng tên khác quãng tám được tách riêng', () => {
    expect(answerBeat(mot, [], 72).kind).toBe('wrong-octave');
    expect(answerBeat(mot, [], 61).kind).toBe('wrong');
  });

  it('câu hai nốt: bấm một nốt thì báo còn thiếu, chưa xong', () => {
    const out = answerBeat(hai, [], 67);
    expect(out.kind).toBe('partial');
    if (out.kind === 'partial') {
      expect(out.done.clef).toBe('treble');
      expect(out.collected).toEqual([67]);
    }
  });

  it('câu hai nốt: bấm nốt nào trước cũng được', () => {
    const bassTruoc = answerBeat(hai, [], 48);
    expect(bassTruoc.kind).toBe('partial');
    if (bassTruoc.kind === 'partial') {
      expect(answerBeat(hai, bassTruoc.collected, 67)).toEqual({ kind: 'correct', collected: [48, 67] });
    }
  });

  /*
   * **Ca sinh ra từ một lỗ thật.** Micro nghe cả hai nốt trong cùng một lần, nên
   * chỗ gọi xử lý hai phím liền nhau trong một nhịp. Nối kết quả lần trước sang
   * lần sau — như mã trong component làm bằng ref — thì câu mới xong được.
   */
  it('hai phím trong cùng một nhịp: nối collected là xong câu', () => {
    const lan1 = answerBeat(hai, [], 67);
    const daCo = lan1.kind === 'partial' ? lan1.collected : [];
    expect(answerBeat(hai, daCo, 48).kind).toBe('correct');
    // Còn đọc lại danh sách cũ (state chưa kịp cập nhật) thì kẹt ở 'partial'.
    expect(answerBeat(hai, [], 48).kind).toBe('partial');
  });

  it('câu hai nốt: bấm sai vẫn giữ nguyên nốt đã đúng', () => {
    expect(answerBeat(hai, [67], 50).kind).toBe('wrong');
    expect(answerBeat(hai, [67], 60).kind).toBe('wrong-octave');
  });

  /*
   * Ca này giữ cho micro khỏi báo sai oan: người học bấm nốt thứ nhất rồi giữ
   * nguyên ngón trong lúc tìm nốt thứ hai, tiếng đàn còn ngân nên lần nghe nào
   * micro cũng nghe lại nốt đó.
   */
  it('nốt đã đúng mà nghe lại thì bỏ qua, không tính là sai', () => {
    expect(answerBeat(hai, [67], 67).kind).toBe('again');
    expect(answerBeat(hai, [48, 67], 67).kind).toBe('correct');
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
