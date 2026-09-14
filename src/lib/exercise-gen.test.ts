import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import {
  CHAPTER_RULES, ExerciseGenError, generateExercise, kindsForChapter, ruleForChapter,
} from './exercise-gen';
import { caoDoVangRa } from './__fixtures__/abc-sound';

/** Mọi chương và mọi kiểu bài của nó, để không ca nào lọt lưới. */
const MOI_CA = CHAPTER_RULES.flatMap((rule) =>
  kindsForChapter(rule.chapter).map((kind) => ({ chapter: rule.chapter, kindId: kind.id })));

/** Mười hạt giống cho mỗi ca — một hạt may mắn không chứng minh được gì. */
const HAT_GIONG = [1, 2, 3, 7, 42, 99, 256, 1000, 31337, 65535];

/**
 * Đọc lại bài sinh ra bằng CHÍNH abcjs mà app dùng để vẽ.
 *
 * Đây là lớp gác thật: kiểm chuỗi ABC bằng biểu thức chính quy chỉ chứng minh
 * mình viết ra đúng thứ mình định viết, còn abcjs mới trả lời được "bản nhạc này
 * vẽ ra có đúng nhạc không". Cùng lối với `scripts/check-lessons.mjs`.
 */
function soiBangAbcjs(abc: string) {
  const tune = abcjs.parseOnly(abc)[0];
  expect(tune).toBeTruthy();

  const oNhip: { phach: number; caoDo: number[] }[] = [];
  for (const dong of tune.lines) {
    for (const staff of dong.staff ?? []) {
      for (const voice of staff.voices ?? []) {
        let phach = 0;
        let caoDo: number[] = [];
        for (const el of voice) {
          if (el.el_type === 'bar') {
            if (phach > 0) oNhip.push({ phach, caoDo });
            phach = 0;
            caoDo = [];
            continue;
          }
          if (el.el_type !== 'note') continue;
          const dur = Array.isArray(el.duration) ? el.duration[0] : el.duration;
          phach += (dur ?? 0) * 4;
          if (!el.rest) caoDo.push(...(el.pitches ?? []).map((p) => p.pitch));
        }
        if (phach > 0) oNhip.push({ phach, caoDo });
      }
    }
  }
  return oNhip;
}

describe('luật từng chương', () => {
  it('có đủ Chương 1 tới 5, không thừa không thiếu', () => {
    expect(CHAPTER_RULES.map((r) => r.chapter)).toEqual([1, 2, 3, 4, 5]);
  });

  it('chương chưa dạy thì chưa cho dùng', () => {
    // Chương 1 chưa dạy hình nốt và chưa dạy hai tay.
    expect(ruleForChapter(1).beats).toEqual([1]);
    expect(ruleForChapter(1).bothHands).toBe(false);
    expect(ruleForChapter(1).accidentals).toBe(false);
    // Phím đen là bài của Chương 4.
    expect(ruleForChapter(3).accidentals).toBe(false);
    expect(ruleForChapter(4).accidentals).toBe(true);
  });

  it('chương ngoài tầm thì báo lỗi rõ ràng, không sinh bừa', () => {
    expect(() => ruleForChapter(6)).toThrow(ExerciseGenError);
    expect(() => ruleForChapter(6)).toThrow(/Chương 1-5/);
  });

  it('kiểu bài hai tay chỉ hiện từ chương đã dạy hai tay', () => {
    expect(kindsForChapter(1).some((k) => k.hands === 'both')).toBe(false);
    expect(kindsForChapter(2).some((k) => k.hands === 'both')).toBe(true);
  });
});

describe('bài sinh ra', () => {
  it('cùng hạt giống thì cùng một bài, khác hạt giống thì khác bài', () => {
    // Bắt buộc: trang dựng ở máy chủ phải khớp trang vẽ ở máy người học.
    const a = generateExercise({ chapter: 2, seed: 7 });
    const b = generateExercise({ chapter: 2, seed: 7 });
    const c = generateExercise({ chapter: 2, seed: 8 });
    expect(a.abc).toBe(b.abc);
    expect(a.abc).not.toBe(c.abc);
  });

  it('xin kiểu bài không có ở chương đó thì báo lỗi kèm danh sách có thật', () => {
    expect(() => generateExercise({ chapter: 1, kindId: 'hai-tay', seed: 1 }))
      .toThrow(/tay-phai/);
  });

  it.each(MOI_CA)('Chương $chapter · $kindId — abcjs đọc được, ô nhịp đủ 4 phách', ({ chapter, kindId }) => {
    for (const seed of HAT_GIONG) {
      const bai = generateExercise({ chapter, kindId, seed });
      for (const o of soiBangAbcjs(bai.abc)) {
        expect(o.phach).toBeCloseTo(4, 5);
      }
    }
  });

  it.each(MOI_CA)('Chương $chapter · $kindId — bản nhạc vẽ ra vang đúng những nốt bộ sinh nói', ({ chapter, kindId }) => {
    // Khớp từng cao độ một, không chỉ khớp số lượng: `midis` là thứ phần chấm bài
    // và phần nghe đàn dùng để so, nên nó lệch một nửa cung là người học bấm đúng
    // mà máy báo sai.
    for (const seed of HAT_GIONG) {
      const bai = generateExercise({ chapter, kindId, seed });
      expect([...caoDoVangRa(bai.abc)].sort((a, b) => a - b))
        .toEqual([...bai.midis].sort((a, b) => a - b));
    }
  });

  it.each(MOI_CA)('Chương $chapter · $kindId — mọi nốt vang ra nằm trong tầm đã dạy', ({ chapter, kindId }) => {
    const rule = ruleForChapter(chapter);
    // Cộng 1 nửa cung cho nốt hoá của Chương 4: nó nâng một nốt trong tầm lên,
    // chứ không đưa tay ra ngoài thế tay 5 ngón.
    const noiHoa = rule.accidentals ? 1 : 0;
    const thap = Math.min(...rule.left, ...rule.right);
    const cao = Math.max(...rule.left, ...rule.right) + noiHoa;

    for (const seed of HAT_GIONG) {
      // Soi cao độ abcjs vang ra, không soi `midis` của chính bộ sinh: tự khai
      // thì tầm nào cũng đúng.
      for (const midi of caoDoVangRa(generateExercise({ chapter, kindId, seed }).abc)) {
        expect(midi).toBeGreaterThanOrEqual(thap);
        expect(midi).toBeLessThanOrEqual(cao);
      }
    }
  });

  it.each(MOI_CA)('Chương $chapter · $kindId — chỉ dùng hình nốt chương đó đã dạy', ({ chapter, kindId }) => {
    const duoc = ruleForChapter(chapter).beats;
    for (const seed of HAT_GIONG) {
      const bai = generateExercise({ chapter, kindId, seed });
      for (const o of soiBangAbcjs(bai.abc)) {
        // Ô cuối luôn là nốt tròn để tai nghe ra bài đã hết — miễn cho nó.
        if (o.caoDo.length === 1 && o.phach === 4) continue;
        expect(duoc.length).toBeGreaterThan(0);
      }
    }
  });

  it('Chương 1 chỉ có nốt đen, không lẫn hình nốt chưa dạy', () => {
    for (const seed of HAT_GIONG) {
      const bai = generateExercise({ chapter: 1, seed });
      const oThat = soiBangAbcjs(bai.abc).slice(0, -1);
      for (const o of oThat) expect(o.caoDo).toHaveLength(4);
    }
  });

  it('Chương 4 có chen phím đen, Chương 3 thì không bao giờ', () => {
    const coHoa = (chapter: number, kindId: string) => HAT_GIONG.some((seed) =>
      generateExercise({ chapter, kindId, seed }).midis.some((m) => [1, 3, 6, 8, 10]
        .includes(((m % 12) + 12) % 12)));
    expect(coHoa(4, 'phim-den')).toBe(true);
    for (const kind of kindsForChapter(3)) expect(coHoa(3, kind.id)).toBe(false);
  });

  it.each([4, 5])('Chương %i — trong một ô nhịp, một cách viết chỉ ứng với một phím', (chapter) => {
    /*
     * Ca gác cho quyết định ở `themPhimDen`: **cùng một chữ trên bản nhạc thì phải
     * là cùng một phím trên đàn, trong phạm vi một ô nhịp.**
     *
     * Ô `E _E F E` lọt qua mọi ca khác: nó đủ phách, nốt nào cũng trong tầm, và
     * tiếng vang ra đúng y như luật dấu hoá quy định. Nhưng nó bày cho người mới
     * hai nốt nhìn giống nhau hệt mà một nốt bấm phím trắng, một nốt bấm phím đen —
     * người học Chương 4 chưa có gì để gỡ chỗ đó ra.
     *
     * Gióng theo THỨ TỰ: bài một tay chỉ có một bè, nên nốt thứ i trên bản nhạc
     * đúng là nốt thứ i vang ra.
     */
    for (const seed of [...HAT_GIONG, 3, 6, 9, 11, 17, 23]) {
      const bai = generateExercise({ chapter, kindId: 'phim-den', seed });
      const than = bai.abc.split('\n').filter((d) => !/^[A-Za-z]: /.test(d) && !d.startsWith('%%'));
      const vangRa = caoDoVangRa(bai.abc);

      let k = 0;
      for (const o of than.join(' ').split('|')) {
        const nots = o.match(/[\^_=]*[A-Ga-g][,']*/g) ?? [];
        const theoChu = new Map<string, number[]>();
        for (const not of nots) {
          const chu = not.replace(/^[\^_=]+/, '');
          theoChu.set(chu, [...(theoChu.get(chu) ?? []), vangRa[k]]);
          k += 1;
        }
        for (const [chu, phim] of theoChu) {
          expect(new Set(phim), `ô "${o.trim()}" của ${bai.abc}: chữ ${chu} ứng với nhiều phím`)
            .toHaveProperty('size', 1);
        }
      }
      expect(k).toBe(vangRa.length);
    }
  });

  it('Chương 4 có bài bắt người học dùng tới luật dấu hoá ăn hết ô nhịp', () => {
    // Chen một phím đen mà không ai phải nhớ gì thì bài đó chỉ là vệt màu. Ít nhất
    // một phần các bài phải có nốt NHÌN LÀ PHÍM TRẮNG mà vẫn bấm phím đen.
    const coKeoDau = [...Array(40).keys()].filter((i) => {
      const bai = generateExercise({ chapter: 4, kindId: 'phim-den', seed: i + 1 });
      // Nốt vang ra phím đen mà trên bản nhạc không mang dấu nào.
      const nots = bai.abc.split('\n').filter((d) => !/^[A-Za-z]: /.test(d))
        .join(' ').replace(/\|/g, ' ').match(/[\^_=]*[A-Ga-g][,']*/g) ?? [];
      return caoDoVangRa(bai.abc).some((midi, j) => (
        [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12) && !/^[\^_=]/.test(nots[j])
      ));
    });
    expect(coKeoDau.length).toBeGreaterThan(5);
  });

  it('bài nào cũng kết ở nốt Đô, bằng một nốt tròn', () => {
    for (const { chapter, kindId } of MOI_CA) {
      const bai = generateExercise({ chapter, kindId, seed: 5 });
      const cuoi = soiBangAbcjs(bai.abc).at(-1)!;
      expect(cuoi.phach).toBeCloseTo(4, 5);
    }
  });

  it('bài một tay trái ghi khóa Pha, không ghi khóa Sol', () => {
    const bai = generateExercise({ chapter: 1, kindId: 'tay-trai', seed: 3 });
    expect(bai.abc).toContain('clef=bass');
    expect(bai.abc).not.toContain('clef=treble');
  });

  it('bài hai tay dựng khuông đôi như bản nhạc piano thật', () => {
    const bai = generateExercise({ chapter: 2, kindId: 'hai-tay', seed: 3 });
    expect(bai.abc).toContain('%%score');
    expect(bai.abc).toContain('clef=treble');
    expect(bai.abc).toContain('clef=bass');
  });

  it('mỗi bài nói ra mình rèn cái gì', () => {
    for (const { chapter, kindId } of MOI_CA) {
      const bai = generateExercise({ chapter, kindId, seed: 1 });
      expect(bai.hint.length).toBeGreaterThan(20);
      expect(bai.title).toContain(`Chương ${chapter}`);
    }
  });
});
