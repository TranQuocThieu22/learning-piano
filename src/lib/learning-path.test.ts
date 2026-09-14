import { describe, expect, it } from 'vitest';
import { buildPath, flattenPath, nextStep, shortTitle, skippedStep } from './learning-path';

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
  // Chương 0 chỉ có lý thuyết, không có gì để ngồi vào đàn — nên không phải một chương trên đường đi.
  it('gom theo chương có bài tập, số chương tăng dần', () => {
    expect(buildPath(FILES).map((c) => c.chapterNumber)).toEqual([1, 2]);
  });

  /*
   * Đổi 14/09/2026: tập trước, ai muốn thì đọc thêm. Trước đó lý thuyết đứng đầu
   * mỗi chương và phải tick, nên người học phải đọc cả trang chữ mới được chạm phím.
   */
  it('đường đi chỉ gồm bài tập, lý thuyết không phải một bước', () => {
    expect(flattenPath(buildPath(FILES)).map((s) => s.slug)).toEqual([
      'chuong-01-bai-01',
      'chuong-01-bai-02',
      'chuong-02-bai-01',
    ]);
  });

  it('lý thuyết vẫn gắn vào chương để dẫn tới như bài đọc thêm', () => {
    const [chuong1] = buildPath(FILES);
    expect(chuong1.theory).toMatchObject({ slug: 'chuong-01', href: '/02-chapters/chuong-01' });
    expect(chuong1.steps.every((s) => s.kind === 'exercise')).toBe(true);
  });

  it('thứ tự file đưa vào không ảnh hưởng kết quả', () => {
    const daoNguoc = buildPath([...FILES].reverse());
    expect(flattenPath(daoNguoc).map((s) => s.slug)).toEqual(
      flattenPath(buildPath(FILES)).map((s) => s.slug)
    );
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
      file('03-exercises', 'chuong-01-bai-01'),
    ]);
    expect(flattenPath(path).map((s) => s.slug)).toEqual(['chuong-01-bai-01']);
  });

  it('mỗi bước mang đủ đường dẫn, loại và số chương', () => {
    const [chuong1] = buildPath(FILES);
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

  // Mở app ra lần đầu là vào thẳng bài ngồi vào đàn, không phải một trang chữ.
  it('chưa tick gì thì là bài tập đầu tiên', () => {
    expect(nextStep(steps, new Set())?.slug).toBe('chuong-01-bai-01');
  });

  // Tick lý thuyết từ hồi nó còn là một bước vẫn nằm trong database — không được làm lệch gì.
  it('tick cũ của bài lý thuyết không làm lệch bước đang tới', () => {
    expect(nextStep(steps, new Set(['chuong-00', 'chuong-01']))?.slug).toBe('chuong-01-bai-01');
  });

  it('bỏ qua các bước đã tick, kể cả tick không liền mạch', () => {
    const done = new Set(['chuong-01-bai-02']);
    expect(nextStep(steps, done)?.slug).toBe('chuong-01-bai-01');
  });

  // "Học tiếp" mà trỏ vào bài đã xong là nói dối; phía gọi tự quyết hiện gì.
  it('tick hết thì trả về null chứ không trỏ vào bước cuối', () => {
    expect(nextStep(steps, new Set(steps.map((s) => s.slug)))).toBeNull();
  });
});

describe('skippedStep', () => {
  const steps = flattenPath(buildPath(FILES));

  it('mở bài đứng sau chỗ chưa tick thì nhắc đúng bước chưa tick đầu tiên', () => {
    expect(skippedStep(steps, new Set(), 'chuong-02-bai-01')?.slug).toBe('chuong-01-bai-01');
  });

  it('mở đúng bài đang học tới thì không nhắc gì', () => {
    expect(skippedStep(steps, new Set(), 'chuong-01-bai-01')).toBeNull();
  });

  // Quay lại ôn một bài đã tick là việc nên khuyến khích, không phải vượt bài.
  it('mở lại bài cũ phía trước thì không nhắc gì', () => {
    const done = new Set(['chuong-01-bai-01', 'chuong-01-bai-02']);
    expect(skippedStep(steps, done, 'chuong-01-bai-01')).toBeNull();
  });

  // Tick nhảy cóc rồi quay lại: chỗ bị vượt là bước chưa tick sớm nhất, không phải bước liền trước.
  it('tick không liền mạch thì nhắc bước chưa tick sớm nhất', () => {
    const done = new Set(['chuong-01-bai-02']);
    expect(skippedStep(steps, done, 'chuong-02-bai-01')?.slug).toBe('chuong-01-bai-01');
  });

  // Đây là chỗ đổi 14/09/2026 phải giữ: người bỏ qua lý thuyết để tập luôn không được bị nhắc.
  it('mở bài tập khi chưa đọc lý thuyết thì không nhắc gì', () => {
    expect(skippedStep(steps, new Set(), 'chuong-01-bai-01')).toBeNull();
    expect(skippedStep(steps, new Set(['chuong-01-bai-01', 'chuong-01-bai-02']), 'chuong-02-bai-01')).toBeNull();
  });

  it('bài lý thuyết và bài không nằm trên đường đi thì không có gì để vượt', () => {
    expect(skippedStep(steps, new Set(), 'chuong-02')).toBeNull();
    expect(skippedStep(steps, new Set(), 'roadmap')).toBeNull();
  });

  it('tick hết rồi thì không nhắc gì', () => {
    expect(skippedStep(steps, new Set(steps.map((s) => s.slug)), 'chuong-02-bai-01')).toBeNull();
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
