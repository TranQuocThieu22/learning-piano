import { describe, expect, it } from 'vitest';
import { buildPath, flattenPath, nextStep, shortTitle } from './learning-path';

const file = (category: string, slug: string, title = slug) => ({ category, slug, title });

/** Giáo trình thu nhỏ: Chương 0 chỉ có lý thuyết, Chương 1 và 2 có cả hai. */
const FILES = [
  file('02-chapters', 'chuong-00'),
  file('02-chapters', 'chuong-01'),
  file('02-chapters', 'chuong-02'),
  file('03-exercises', 'chuong-01-bai-01'),
  file('03-exercises', 'chuong-01-bai-02'),
  file('03-exercises', 'chuong-02-bai-01'),
];

describe('buildPath', () => {
  it('gom theo chương, số chương tăng dần', () => {
    expect(buildPath(FILES).map((c) => c.chapterNumber)).toEqual([0, 1, 2]);
  });

  /*
   * Đây là chỗ cả tính năng này sinh ra để sửa: trước đó lý thuyết và bài tập là
   * hai dãy rời, nên đọc xong lý thuyết một chương thì "bài tiếp theo" nhảy sang
   * lý thuyết chương SAU, bỏ qua toàn bộ bài tập của chương vừa đọc.
   */
  it('trong mỗi chương, lý thuyết đứng trước bài tập của chính chương đó', () => {
    expect(flattenPath(buildPath(FILES)).map((s) => s.slug)).toEqual([
      'chuong-00',
      'chuong-01',
      'chuong-01-bai-01',
      'chuong-01-bai-02',
      'chuong-02',
      'chuong-02-bai-01',
    ]);
  });

  it('thứ tự file đưa vào không ảnh hưởng kết quả', () => {
    const daoNguoc = buildPath([...FILES].reverse());
    expect(flattenPath(daoNguoc).map((s) => s.slug)).toEqual(
      flattenPath(buildPath(FILES)).map((s) => s.slug)
    );
  });

  // Chương 0 là chương dẫn nhập, không có bài ngồi vào đàn. Đúng chứ không thiếu.
  it('chương chỉ có lý thuyết vẫn là một chương hợp lệ', () => {
    const chuong0 = buildPath(FILES)[0];
    expect(chuong0.theory?.slug).toBe('chuong-00');
    expect(chuong0.exercises).toEqual([]);
    expect(chuong0.steps).toHaveLength(1);
  });

  it('chương chỉ có bài tập, chưa soạn phần chữ, thì theory là null chứ không mất chương', () => {
    const path = buildPath([file('03-exercises', 'chuong-09-bai-01')]);
    expect(path).toHaveLength(1);
    expect(path[0].theory).toBeNull();
    expect(path[0].steps.map((s) => s.slug)).toEqual(['chuong-09-bai-01']);
  });

  it('bài tập sắp theo số bài, không theo thứ tự chuỗi', () => {
    const path = buildPath([
      file('03-exercises', 'chuong-01-bai-10'),
      file('03-exercises', 'chuong-01-bai-02'),
      file('03-exercises', 'chuong-01-bai-01'),
    ]);
    expect(path[0].exercises.map((s) => s.lessonNumber)).toEqual([1, 2, 10]);
  });

  /*
   * Bỏ qua chứ không đoán vị trí: đoán sai là người học đang đi giữa chừng bị đẩy
   * sang một bài không liên quan, mà chẳng có gì báo.
   */
  it('file không theo mẫu tên thì bỏ qua', () => {
    const path = buildPath([
      file('02-chapters', 'gioi-thieu'),
      file('03-exercises', 'bai-tap-them'),
      file('01-roadmap', 'roadmap'),
      file('07-doc-them', 'lich-su-piano'),
      file('02-chapters', 'chuong-01'),
    ]);
    expect(flattenPath(path).map((s) => s.slug)).toEqual(['chuong-01']);
  });

  it('mỗi bước mang đủ đường dẫn, loại và số chương', () => {
    const [, chuong1] = buildPath(FILES);
    expect(chuong1.theory).toMatchObject({
      kind: 'theory',
      href: '/02-chapters/chuong-01',
      chapterNumber: 1,
    });
    expect(chuong1.exercises[0]).toMatchObject({
      kind: 'exercise',
      href: '/03-exercises/chuong-01-bai-01',
      chapterNumber: 1,
      lessonNumber: 1,
    });
  });
});

describe('nextStep', () => {
  const steps = flattenPath(buildPath(FILES));

  it('chưa tick gì thì là bước đầu tiên', () => {
    expect(nextStep(steps, new Set())?.slug).toBe('chuong-00');
  });

  it('bỏ qua các bước đã tick, kể cả tick không liền mạch', () => {
    const done = new Set(['chuong-00', 'chuong-01', 'chuong-01-bai-02']);
    expect(nextStep(steps, done)?.slug).toBe('chuong-01-bai-01');
  });

  // "Học tiếp" mà trỏ vào bài đã xong là nói dối; phía gọi tự quyết hiện gì.
  it('tick hết thì trả về null chứ không trỏ vào bước cuối', () => {
    expect(nextStep(steps, new Set(steps.map((s) => s.slug)))).toBeNull();
  });
});

describe('shortTitle', () => {
  it('cắt tiền tố chương', () => {
    expect(shortTitle('Chương 3: Đọc bản nhạc (Sight-reading) cơ bản')).toBe(
      'Đọc bản nhạc (Sight-reading) cơ bản'
    );
  });

  it('cắt tiền tố chương và bài', () => {
    expect(shortTitle('Chương 3 - Bài 1: Đọc nốt trên dòng kẻ phụ (Đô, Rê, Mi)')).toBe(
      'Đọc nốt trên dòng kẻ phụ (Đô, Rê, Mi)'
    );
  });

  it('nhận cả gạch ngang dài mà người soạn hay gõ nhầm', () => {
    expect(shortTitle('Chương 7 — Bài 2: Hợp âm rải')).toBe('Hợp âm rải');
    expect(shortTitle('Chương 7 – Bài 2: Hợp âm rải')).toBe('Hợp âm rải');
  });

  // Thà để thừa chữ còn hơn cắt nhầm mất tên bài.
  it('không khớp mẫu thì giữ nguyên', () => {
    expect(shortTitle('Trạm dừng chân: Tổng ôn')).toBe('Trạm dừng chân: Tổng ôn');
    expect(shortTitle('Vì sao bạn muốn chơi piano?')).toBe('Vì sao bạn muốn chơi piano?');
  });

  // Một dòng trống trên giao diện tệ hơn một dòng thừa chữ.
  it('cắt xong mà rỗng thì trả lại bản gốc', () => {
    expect(shortTitle('Chương 3:')).toBe('Chương 3:');
  });
});
