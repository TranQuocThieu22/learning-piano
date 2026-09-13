import { describe, expect, it } from 'vitest';
import {
  barNumbers,
  covers,
  drillAbc,
  drillById,
  fingerFor,
  keysOf,
  midiOfWhiteIndex,
  moveKindInfo,
  planHandMoves,
  POSITION_DRILLS,
  positionChoices,
  positionsCovering,
  topOf,
  whiteIndex,
} from './hand-position';
import type { ExerciseNote } from './exercise-gen';

const DO4 = 60;
const RE4 = 62;
const MI4 = 64;
const FA4 = 65;
const FA_THANG_4 = 66;
const SOL4 = 67;
const LA4 = 69;
const SI4 = 71;
const DO5 = 72;

const d = (midi: number | null): ExerciseNote => ({ midi, beats: 1 });
const t = (midi: number | null): ExerciseNote => ({ midi, beats: 2 });

const theDo = { anchor: DO4 };

describe('đếm bằng phím trắng', () => {
  it('phím đen không có số thứ tự phím trắng', () => {
    expect(whiteIndex(FA_THANG_4)).toBe(-1);
  });

  it('đi lên năm phím trắng từ Đô là tới Sol', () => {
    expect(midiOfWhiteIndex(whiteIndex(DO4) + 4)).toBe(SOL4);
  });

  it('một thế tay phủ đúng năm phím trắng liền nhau', () => {
    expect(keysOf(theDo)).toEqual([DO4, RE4, MI4, FA4, SOL4]);
    expect(topOf(theDo)).toBe(SOL4);
  });
});

describe('thế tay với tới nốt nào', () => {
  it('năm nốt của chính nó thì với tới, nốt kế bên thì không', () => {
    expect(covers(theDo, DO4)).toBe(true);
    expect(covers(theDo, SOL4)).toBe(true);
    expect(covers(theDo, LA4)).toBe(false);
    expect(covers(theDo, 59)).toBe(false);
  });

  /*
   * Ca quan trọng nhất của nhóm này. Chương 4 dạy Pha thăng ngay trong thế tay
   * Đô — ngón 4 nhích lên phím đen rồi về. Bỏ luật này thì mọi bài Chương 4 đều
   * bị chấm là "phải chuyển tay", và đó là lời khuyên sai.
   */
  it('phím đen nằm giữa thế tay vẫn tính là với tới, bằng ngón của phím trắng dưới nó', () => {
    expect(covers(theDo, FA_THANG_4)).toBe(true);
    expect(fingerFor(theDo, FA_THANG_4, 'right')).toBe(fingerFor(theDo, FA4, 'right'));
  });
});

describe('số ngón', () => {
  it('tay phải đánh số từ nốt thấp lên', () => {
    expect(fingerFor(theDo, DO4, 'right')).toBe(1);
    expect(fingerFor(theDo, SOL4, 'right')).toBe(5);
  });

  /*
   * Tay trái xếp NGƯỢC: ngón cái ở nốt cao nhất. Đây là chỗ người học hay nhớ
   * nhầm, và cũng là chỗ mã dễ viết nhầm nhất vì hai tay dùng chung một hàm.
   */
  it('tay trái xếp ngược, ngón cái ở nốt cao nhất', () => {
    expect(fingerFor(theDo, DO4, 'left')).toBe(5);
    expect(fingerFor(theDo, SOL4, 'left')).toBe(1);
  });

  it('nốt ngoài thế tay thì không có ngón nào', () => {
    expect(fingerFor(theDo, LA4, 'right')).toBeNull();
  });
});

describe('planHandMoves — ba luật đặt tay', () => {
  it('luật 1: cả câu nằm gọn trong một thế tay thì không dời tay lần nào', () => {
    const plan = planHandMoves([d(DO4), d(MI4), d(SOL4), d(MI4)], 'right');
    expect(plan.moves).toHaveLength(0);
    expect(plan.segments).toHaveLength(1);
    expect(plan.segments[0].position.anchor).toBe(DO4);
    expect(plan.fingers).toEqual([1, 3, 5, 3]);
  });

  it('luật 2: lố đúng một nốt thì với thêm ngón, không dời tay', () => {
    const plan = planHandMoves([d(DO4), d(MI4), d(SOL4), d(LA4), d(SOL4), d(MI4)], 'right');
    expect(plan.moves).toHaveLength(0);
    expect(plan.segments[0].stretched).toEqual([LA4]);
    // Nốt phải với dùng ngón ngoài cùng về phía nó.
    expect(plan.fingers[3]).toBe(5);
  });

  it('lố nhiều nốt thì phải dời tay thật, không khuyên duỗi tay ra mãi', () => {
    const plan = planHandMoves(
      [d(DO4), d(MI4), t(SOL4), d(LA4), d(SI4), d(DO5), t(SI4)],
      'right',
    );
    expect(plan.moves).toHaveLength(1);
    expect(plan.segments).toHaveLength(2);
  });

  /*
   * Ca đã bắt được một lời khuyên sai chỗ. Nốt Sol đầu nửa sau vẫn nằm trong thế
   * tay Đô, nên bản tham lam kéo dài đoạn một qua hết dấu lặng rồi bảo người học
   * nhấc tay ở GIỮA nửa sau — đúng chỗ không còn chỗ nghỉ nào để nhấc.
   */
  it('có dấu lặng thì dời tay ngay tại đó, dù thế tay cũ còn với được thêm', () => {
    const notes = [
      d(DO4), d(MI4), d(SOL4), t(DO4), d(null),
      d(SOL4), d(SI4), d(DO5), t(SI4),
    ];
    const plan = planHandMoves(notes, 'right');
    expect(plan.moves).toHaveLength(1);
    // Nốt đầu của thế tay mới là nốt Sol ngay sau dấu lặng, không phải nốt nào sau đó.
    expect(plan.moves[0].atIndex).toBe(5);
    expect(plan.moves[0].gap).toBe('lang');
    expect(plan.moves[0].kind).toBe('nhay-tay');
  });

  it('nốt ngân dài cũng là chỗ nghỉ đủ để dời tay', () => {
    const notes = [d(MI4), d(RE4), t(DO4), t(SOL4), d(LA4), d(SI4), d(DO5), d(LA4)];
    const plan = planHandMoves(notes, 'right');
    expect(plan.moves).toHaveLength(1);
    expect(plan.moves[0].gap).toBe('ngan-dai');
  });

  it('mỗi nốt có tiếng đều được chỉ ngón, dấu lặng thì không', () => {
    const notes = [d(DO4), d(null), d(SOL4)];
    const plan = planHandMoves(notes, 'right');
    expect(plan.fingers[1]).toBeNull();
    expect(plan.fingers.filter((f) => f !== null)).toHaveLength(2);
  });
});

describe('barNumbers', () => {
  it('bốn phách một ô, nốt trắng và nốt tròn tính đủ phách của chúng', () => {
    expect(barNumbers([d(DO4), d(RE4), d(MI4), d(FA4), d(SOL4)])).toEqual([1, 1, 1, 1, 2]);
    expect(barNumbers([t(DO4), t(RE4), d(MI4)])).toEqual([1, 1, 2]);
  });

  it('dấu lặng cũng chiếm phách như nốt', () => {
    expect(barNumbers([t(DO4), t(null), d(MI4)])).toEqual([1, 1, 2]);
  });
});

describe('bảng câu luyện', () => {
  it('mã câu không trùng nhau', () => {
    const ids = POSITION_DRILLS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
   * Mỗi ô nhịp phải đủ bốn phách. Thiếu phách thì abcjs vẫn vẽ ra một bản nhạc
   * trông bình thường, chỉ có vạch nhịp rơi sai chỗ — loại lỗi không nhìn ra
   * bằng mắt nếu không đếm.
   */
  it('mọi câu đều chia trọn thành ô nhịp 4 phách', () => {
    for (const drill of POSITION_DRILLS) {
      const tong = drill.notes.reduce((s, n) => s + n.beats, 0);
      expect(tong % 4, drill.id).toBe(0);
    }
  });

  it('câu nào cũng lên được kế hoạch, và mọi nốt đều có ngón từ 1 tới 5', () => {
    for (const drill of POSITION_DRILLS) {
      const plan = planHandMoves(drill.notes, drill.hand);
      drill.notes.forEach((note, i) => {
        if (note.midi === null) return;
        const ngon = plan.fingers[i];
        expect(ngon, `${drill.id} nốt ${i}`).toBeGreaterThanOrEqual(1);
        expect(ngon, `${drill.id} nốt ${i}`).toBeLessThanOrEqual(5);
      });
    }
  });

  /*
   * **Lớp gác quan trọng nhất của file này.**
   *
   * Mọi lần dời tay trong bảng phải rơi vào chỗ có dấu lặng hoặc nốt ngân dài.
   * Không phải vì luồn ngón và vắt ngón là sai — chúng có thật và Chương 6 dạy
   * chúng — mà vì công cụ này KHÔNG dựng được thế ngón chuẩn cho một câu chạy
   * liền bậc: thế ngón thang âm (1231234) là quy ước riêng của thang âm, không
   * suy ra được từ luật phủ năm phím. In một thế ngón tự nghĩ ra mà trái với
   * Chương 6 thì tệ hơn là không in gì.
   *
   * Nên câu chạy liền bậc không có chỗ nghỉ thì **đừng thêm vào bảng này** —
   * chúng đã có bài riêng ở Chương 6. Ca test này giữ đúng ranh giới đó.
   */
  it('mọi lần dời tay trong bảng đều rơi vào chỗ nghỉ thật', () => {
    for (const drill of POSITION_DRILLS) {
      const plan = planHandMoves(drill.notes, drill.hand);
      for (const move of plan.moves) {
        expect(move.gap, `${drill.id} dời tay ở nốt ${move.atIndex}`).not.toBeNull();
      }
    }
  });

  /*
   * Hai ca dưới đây bắt hai lỗi mà test cũ để lọt và tôi phải đọc bản in ra mới
   * thấy: một "lần dời tay" từ thế Pha sang chính thế Pha, và một đoạn Sol–La–Si
   * bị xếp vào thế tay Pha trong khi nốt Pha không hề được đánh. Cả hai đều làm
   * đúng phép đếm, chỉ sai ở chỗ nó khuyên người học đặt tay thế nào.
   */
  it('không có lần dời tay nào sang đúng thế tay đang đứng', () => {
    for (const drill of POSITION_DRILLS) {
      for (const move of planHandMoves(drill.notes, drill.hand).moves) {
        expect(move.from.anchor, drill.id).not.toBe(move.to.anchor);
      }
    }
  });

  it('thế tay của mỗi đoạn phải ôm sát nốt của đoạn đó', () => {
    for (const drill of POSITION_DRILLS) {
      const plan = planHandMoves(drill.notes, drill.hand);
      for (const seg of plan.segments) {
        const trong = drill.notes
          .slice(seg.from, seg.to + 1)
          .map((n, k) => ({ midi: n.midi, ngon: plan.fingers[seg.from + k] }))
          .filter((x) => x.midi !== null);
        // Tay phải: nốt thấp nhất của đoạn phải rơi vào ngón 1 hoặc 2 — đặt tay
        // mà nốt thấp nhất đã là ngón 4 thì cả bàn tay đang lệch khỏi đoạn nhạc.
        const bien = drill.hand === 'right'
          ? trong.reduce((a, b) => ((b.midi as number) < (a.midi as number) ? b : a))
          : trong.reduce((a, b) => ((b.midi as number) > (a.midi as number) ? b : a));
        expect(bien.ngon, `${drill.id} đoạn từ nốt ${seg.from}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('câu tay trái đánh số ngón ngược với tay phải', () => {
    const drill = drillById('tay-trai-doi-the');
    const plan = planHandMoves(drill.notes, 'left');
    // Nốt đầu là nốt thấp nhất của thế tay, tay trái bấm bằng ngón 5.
    expect(plan.fingers[0]).toBe(5);
  });
});

describe('bốn lựa chọn cho câu hỏi', () => {
  it('đáp án luôn nằm trong các lựa chọn, và các lựa chọn không trùng nhau', () => {
    const chon = positionChoices(theDo);
    expect(chon).toHaveLength(4);
    expect(chon.some((p) => p.anchor === DO4)).toBe(true);
    expect(new Set(chon.map((p) => p.anchor)).size).toBe(4);
  });

  it('các lựa chọn sai nằm quanh đáp án chứ không ở tận đâu', () => {
    for (const pos of positionChoices(theDo)) {
      expect(Math.abs(whiteIndex(pos.anchor) - whiteIndex(DO4))).toBeLessThanOrEqual(3);
    }
  });
});

describe('chuỗi ABC của câu luyện', () => {
  it('viết số ngón lên trên đầu nốt và chia đúng ô nhịp', () => {
    const drill = drillById('gon-mot-the');
    const plan = planHandMoves(drill.notes, drill.hand);
    const abc = drillAbc(drill, plan.fingers);
    expect(abc).toContain('"^1"');
    expect(abc.split('|').length).toBeGreaterThan(3);
  });

  it('câu tay trái vẽ ở khuông Pha', () => {
    const drill = drillById('tay-trai-doi-the');
    expect(drillAbc(drill)).toContain('clef=bass');
  });

  it('dấu lặng vẫn còn trong bản nhạc chứ không bị nuốt mất', () => {
    const drill = drillById('doi-o-cho-nghi');
    expect(drillAbc(drill)).toMatch(/z/);
  });
});

describe('positionsCovering', () => {
  it('không thế tay nào phủ nổi một câu rộng hơn năm phím trắng', () => {
    expect(positionsCovering([DO4, LA4, DO5])).toHaveLength(0);
  });

  it('mọi kiểu dời tay đều có lời hướng dẫn đi kèm', () => {
    for (const id of ['mo-rong', 'nhay-tay', 'luon-ngon', 'vat-ngon'] as const) {
      expect(moveKindInfo(id).how.length).toBeGreaterThan(20);
    }
  });
});
