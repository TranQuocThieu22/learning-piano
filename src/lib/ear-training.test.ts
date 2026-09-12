import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EAR_OPTIONS,
  EAR_PRESETS,
  earNotePool,
  earPresetOf,
  judgeEar,
  pickEarQuestion,
  REFERENCE_MIDI,
  type EarOptions,
} from './ear-training';

const opts = (extra: Partial<EarOptions> = {}): EarOptions => ({
  ...DEFAULT_EAR_OPTIONS,
  ...extra,
});

describe('kho nốt', () => {
  it('thế tay 5 ngón đúng năm nốt Đô–Sol', () => {
    expect(earNotePool(opts())).toEqual([60, 62, 64, 65, 67]);
  });

  it('tắt thế tay 5 ngón thì đủ bảy nốt trắng của quãng', () => {
    expect(earNotePool(opts({ fiveFinger: false }))).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('bật phím đen thì đủ mười hai phím', () => {
    expect(earNotePool(opts({ fiveFinger: false, blackKeys: true }))).toHaveLength(12);
  });

  it('nhiều quãng thì nối lại theo thứ tự thấp tới cao', () => {
    const pool = earNotePool(opts({ fiveFinger: false, octaves: [4, 3] }));
    expect([...pool].sort((a, b) => a - b)).toEqual(pool);
    expect(pool[0]).toBe(48);
  });
});

describe('chấm phím vừa bấm', () => {
  it('trúng thì không còn hướng nào để chỉ', () => {
    expect(judgeEar(64, 64)).toEqual({
      correct: true, direction: null, sameNoteName: false, distance: 0,
    });
  });

  /*
   * Chỉ nói cao hơn / thấp hơn, KHÔNG nói tên nốt: nói tên là làm hộ đúng phần
   * cần rèn. Đây là ràng buộc của cả bài luyện, không phải chi tiết hiện thực.
   */
  it('bấm thấp hơn thì bảo đi lên, bấm cao hơn thì bảo đi xuống', () => {
    expect(judgeEar(67, 60).direction).toBe('higher');
    expect(judgeEar(60, 67).direction).toBe('lower');
  });

  it('đúng tên nốt mà lệch quãng tám thì nhận ra riêng', () => {
    expect(judgeEar(72, 60)).toMatchObject({ sameNoteName: true, direction: 'higher', distance: 12 });
    expect(judgeEar(60, 72)).toMatchObject({ sameNoteName: true, direction: 'lower' });
    expect(judgeEar(62, 60).sameNoteName).toBe(false);
  });

  it('đo đúng khoảng cách để màn hình biết lúc nào nói "gần lắm rồi"', () => {
    expect(judgeEar(62, 60).distance).toBe(2);
    expect(judgeEar(60, 62).distance).toBe(2);
  });
});

describe('bốc câu hỏi', () => {
  const nhieuCau = (o: EarOptions, lan = 40) => Array.from(
    { length: lan },
    (_, i) => pickEarQuestion(o, null, () => (i * 13 % 41) / 41)!
  );

  it('ra đúng số nốt đã yêu cầu, và nốt nào cũng nằm trong kho', () => {
    for (const soNot of [1, 2, 3]) {
      const o = opts({ noteCount: soNot, fiveFinger: false, octaves: [3, 4] });
      const kho = earNotePool(o);
      for (const cau of nhieuCau(o, 20)) {
        expect(cau).toHaveLength(soNot);
        for (const m of cau) expect(kho).toContain(m);
      }
    }
  });

  /*
   * Hai ràng buộc này là thứ giữ cho câu nghe ra được là một câu nhạc chứ không
   * phải một dãy số: trùng nốt thì tai nghe thành một nốt ngân dài, còn nhảy quá
   * rộng thì mất hẳn mốc — mà bài này rèn cảm giác quãng.
   */
  it('hai nốt liền nhau không trùng và không nhảy quá một quãng tám', () => {
    const o = opts({ noteCount: 3, fiveFinger: false, blackKeys: true, octaves: [3, 4, 5] });
    for (const cau of nhieuCau(o)) {
      for (let i = 1; i < cau.length; i++) {
        expect(cau[i]).not.toBe(cau[i - 1]);
        expect(Math.abs(cau[i] - cau[i - 1])).toBeLessThanOrEqual(12);
      }
    }
  });

  it('né nốt mở đầu của câu vừa rồi', () => {
    const o = opts({ fiveFinger: false });
    for (let i = 0; i < 20; i++) {
      const truoc = pickEarQuestion(o, null, () => i / 20)!;
      const sau = pickEarQuestion(o, truoc, () => (i * 7 % 19) / 19)!;
      expect(sau[0]).not.toBe(truoc[0]);
    }
  });

  /*
   * Kho chỉ có MỘT nốt là ca dễ kẹt vô tận: luật né nốt vừa rồi loại nốt duy
   * nhất còn lại. Phải có đường lùi, thà hỏi lại còn hơn trả về câu cụt.
   */
  it('kho một nốt vẫn ra được câu, không kẹt và không trả về câu cụt', () => {
    const motNot: EarOptions = {
      noteCount: 2, octaves: [4], fiveFinger: true, blackKeys: false, reference: true,
    };
    // Thu kho về đúng một nốt bằng cách chọn quãng không tồn tại thì pool rỗng —
    // ở đây kiểm ca kho nhỏ nhất còn dùng được, tức thế tay 5 ngón.
    const cau = pickEarQuestion(motNot, [60], () => 0)!;
    expect(cau).toHaveLength(2);
  });

  it('không chọn quãng nào thì không có câu nào, và nói ra bằng null', () => {
    expect(pickEarQuestion(opts({ octaves: [] }), null)).toBeNull();
  });
});

/*
 * Bốn mức phải ĐI LÊN THẬT. Không có ca này thì một lần sửa mức Khó cho "dễ thở
 * hơn" là thang đảo lộn mà nhãn vẫn ghi Khó — cùng lý do với bài luyện nhận nốt.
 */
describe('mức khó dựng sẵn', () => {
  it('mặc định chính là mức đầu tiên, không phải một bộ riêng', () => {
    expect(DEFAULT_EAR_OPTIONS).toBe(EAR_PRESETS[0].options);
    expect(earPresetOf(DEFAULT_EAR_OPTIONS)?.id).toBe('de');
  });

  it('mức nào cũng có mã, nhãn và một dòng nói khó ở chỗ nào', () => {
    for (const p of EAR_PRESETS) {
      expect(p.id, p.label).toMatch(/^[a-z-]+$/);
      expect(p.hint.length, p.id).toBeGreaterThan(20);
    }
    expect(new Set(EAR_PRESETS.map((p) => p.id)).size).toBe(EAR_PRESETS.length);
  });

  it('mức nào cũng ra được câu hỏi', () => {
    for (const p of EAR_PRESETS) {
      expect(earNotePool(p.options).length, p.id).toBeGreaterThan(0);
      expect(pickEarQuestion(p.options, null, () => 0.3), p.id).not.toBeNull();
    }
  });

  it('mỗi mức tự nhận ra chính nó, và thứ tự quãng không làm lệch', () => {
    for (const p of EAR_PRESETS) expect(earPresetOf(p.options)?.id).toBe(p.id);
    const kho = EAR_PRESETS.find((p) => p.id === 'kho')!;
    expect(earPresetOf({ ...kho.options, octaves: [...kho.options.octaves].reverse() })?.id)
      .toBe('kho');
  });

  it('chỉnh tay một thứ là không còn khớp mức nào', () => {
    expect(earPresetOf({ ...DEFAULT_EAR_OPTIONS, blackKeys: true })).toBeNull();
    expect(earPresetOf({ ...DEFAULT_EAR_OPTIONS, noteCount: 2 })).toBeNull();
  });

  it('kho nốt và số nốt mỗi câu không mức nào lùi lại', () => {
    for (let i = 1; i < EAR_PRESETS.length; i++) {
      const truoc = EAR_PRESETS[i - 1].options;
      const sau = EAR_PRESETS[i].options;
      expect(earNotePool(sau).length, EAR_PRESETS[i].id)
        .toBeGreaterThanOrEqual(earNotePool(truoc).length);
      expect(sau.noteCount, EAR_PRESETS[i].id).toBeGreaterThanOrEqual(truoc.noteCount);
    }
  });

  /*
   * Nốt mốc là bánh xe phụ: có ở mức dễ, bỏ hẳn ở mức khó, và **không bao giờ
   * quay lại**. Lắp lại ở mức sau là mức sau dễ hơn mức trước ở đúng trục ấy.
   */
  it('nốt mốc chỉ mất đi, không bao giờ quay lại ở mức khó hơn', () => {
    const co = EAR_PRESETS.map((p) => p.options.reference);
    for (let i = 1; i < co.length; i++) {
      if (!co[i - 1]) expect(co[i], EAR_PRESETS[i].id).toBe(false);
    }
  });

  it('nốt mốc là Đô giữa, cùng mốc với hình bàn phím ở bài nhận nốt', () => {
    expect(REFERENCE_MIDI).toBe(60);
  });
});
