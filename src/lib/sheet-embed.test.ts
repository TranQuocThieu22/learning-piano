import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  extractExerciseAbc,
  findSheetEmbeds,
  resolveSheetEmbeds,
  SheetEmbedError,
} from './sheet-embed';

const EXERCISE_DIR = join(process.cwd(), 'docs/03-exercises');
const lessonFiles = readdirSync(EXERCISE_DIR).filter((f) => f.endsWith('.md'));

describe('extractExerciseAbc', () => {
  const bai01 = readFileSync(join(EXERCISE_DIR, 'chuong-01-bai-01.md'), 'utf8');

  it('lấy đúng bản nhạc của bài tập được chỉ định', () => {
    const abc = extractExerciseAbc(bai01, '1A');
    expect(abc).toBeTruthy();
    // Khối abc tự khai tên bài tập trong trường T:, dùng nó để chắc không lấy nhầm.
    expect(abc).toContain('1A');
  });

  it('không lấy nhầm bản nhạc của bài tập kế tiếp', () => {
    const a = extractExerciseAbc(bai01, '1A');
    const b = extractExerciseAbc(bai01, '1B');
    expect(a).not.toBe(b);
  });

  it('trả null khi mã không tồn tại', () => {
    expect(extractExerciseAbc(bai01, '9Z')).toBeNull();
  });
});

describe('resolveSheetEmbeds', () => {
  it('thay chỉ thị bằng bản nhạc kèm dòng ghi nguồn', () => {
    const out = resolveSheetEmbeds('{{sheet: chuong-01-bai-01#1A}}');
    expect(out).toContain('```abc');
    expect(out).toContain('Bài tập 1A');
    expect(out).toContain('/03-exercises/chuong-01-bai-01');
  });

  it('để yên đoạn markdown không có chỉ thị', () => {
    const md = '# Tiêu đề\n\nMột đoạn văn bình thường.\n';
    expect(resolveSheetEmbeds(md)).toBe(md);
  });

  it('ném lỗi khi trỏ vào bài không tồn tại', () => {
    expect(() => resolveSheetEmbeds('{{sheet: chuong-99-bai-99#1A}}')).toThrow(
      SheetEmbedError
    );
  });

  it('ném lỗi khi bài có thật nhưng không có mã đó', () => {
    expect(() => resolveSheetEmbeds('{{sheet: chuong-01-bai-01#9Z}}')).toThrow(
      SheetEmbedError
    );
  });
});

/**
 * Lưới an toàn thật sự: mọi chỉ thị trong toàn bộ giáo trình phải giải được.
 *
 * Trang bài học được dựng sẵn lúc build nên một tham chiếu hỏng sẽ làm đỏ build,
 * nhưng test chạy nhanh hơn nhiều và chỉ thẳng ra chỗ sai.
 */
describe('toàn bộ giáo trình', () => {
  const withEmbeds = lessonFiles
    .map((file) => ({ file, text: readFileSync(join(EXERCISE_DIR, file), 'utf8') }))
    .filter(({ text }) => findSheetEmbeds(text).length > 0);

  it('có ít nhất một bài dùng chỉ thị nhúng', () => {
    expect(withEmbeds.length).toBeGreaterThan(0);
  });

  it.each(lessonFiles)('%s: mọi chỉ thị nhúng đều giải được', (file) => {
    const text = readFileSync(join(EXERCISE_DIR, file), 'utf8');
    expect(() => resolveSheetEmbeds(text)).not.toThrow();
  });
});
