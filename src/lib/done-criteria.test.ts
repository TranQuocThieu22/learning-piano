import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { splitDoneCriteria, unrenderableCriteriaLines } from './done-criteria';

const BAI = [
  '# Chương 1 - Bài 2: Bước nhảy',
  '',
  '## Yêu cầu thực hành',
  '',
  '1. Cổ tay đứng yên.',
  '',
  '## Xong bài khi',
  '',
  '- Đánh trọn 2E từ đầu tới cuối.',
  '- Nhảy quãng mà không nhìn tay.',
  '',
  '---',
  '',
  '**Tiếp theo:** Chương 2.',
].join('\n');

describe('splitDoneCriteria', () => {
  it('lấy ra từng dòng tiêu chí theo đúng thứ tự', () => {
    expect(splitDoneCriteria(BAI).criteria).toEqual([
      'Đánh trọn 2E từ đầu tới cuối.',
      'Nhảy quãng mà không nhìn tay.',
    ]);
  });

  // Tiêu chí đã hiện cạnh nút tick, in thêm trong thân bài là đọc hai lần cùng một thứ.
  it('thân bài không còn mục này, nhưng giữ nguyên phần trước và phần sau nó', () => {
    const { body } = splitDoneCriteria(BAI);
    expect(body).not.toContain('Xong bài khi');
    expect(body).not.toContain('Đánh trọn 2E');
    expect(body).toContain('1. Cổ tay đứng yên.');
    expect(body).toContain('**Tiếp theo:** Chương 2.');
  });

  it('mục nằm cuối file cũng tách được', () => {
    const md = '# Bài\n\nNội dung.\n\n## Xong bài khi\n\n- Một.\n- Hai.\n';
    const { body, criteria } = splitDoneCriteria(md);
    expect(criteria).toEqual(['Một.', 'Hai.']);
    expect(body.trim()).toBe('# Bài\n\nNội dung.');
  });

  it('dừng ở tiêu đề kế tiếp, không nuốt mục sau', () => {
    const md = '## Xong bài khi\n- Một.\n## Thực hành tự do\n- Không phải tiêu chí.';
    const { body, criteria } = splitDoneCriteria(md);
    expect(criteria).toEqual(['Một.']);
    expect(body).toContain('- Không phải tiêu chí.');
  });

  // File soạn trên Windows có \r cuối dòng — không được lọt vào chữ hiện cho người học.
  it('file xuống dòng kiểu Windows vẫn tách đúng và không dính ký tự lạ', () => {
    const { criteria } = splitDoneCriteria(BAI.replace(/\n/g, '\r\n'));
    expect(criteria).toEqual([
      'Đánh trọn 2E từ đầu tới cuối.',
      'Nhảy quãng mà không nhìn tay.',
    ]);
  });

  it('nhận cả danh sách đánh số', () => {
    expect(splitDoneCriteria('## Xong bài khi\n1. Một.\n2. Hai.').criteria).toEqual(['Một.', 'Hai.']);
  });

  it('bài không có mục này thì giữ nguyên bài, tiêu chí rỗng', () => {
    const md = '# Chương 3\n\nLý thuyết.';
    expect(splitDoneCriteria(md)).toEqual({ body: md, criteria: [] });
  });
});

describe('unrenderableCriteriaLines', () => {
  it('bắt đoạn văn và định dạng markdown sẽ không hiện được cạnh nút tick', () => {
    const md = '## Xong bài khi\n\nĐoạn văn.\n- Đánh **to**.\n- Bình thường.\n';
    expect(unrenderableCriteriaLines(md)).toEqual(['Đoạn văn.', '- Đánh **to**.']);
  });
});

/*
 * Soi cả giáo trình, cùng lối với `sheet-embed.test.ts`. Mục này là lời hứa với
 * người học ở cạnh nút tick, nên thiếu ở một bài là một bài im lặng không nói
 * khi nào thì xong — đúng cái lỗ mà nó sinh ra để lấp.
 */
describe('toàn bộ bài tập trong giáo trình', () => {
  const EXERCISE_DIR = join(process.cwd(), 'docs/03-exercises');
  const lessonFiles = readdirSync(EXERCISE_DIR).filter((f) => f.endsWith('.md'));
  const read = (file: string) => readFileSync(join(EXERCISE_DIR, file), 'utf8');

  it.each(lessonFiles)('%s: có mục Xong bài khi với 2-4 dòng', (file) => {
    const { criteria } = splitDoneCriteria(read(file));
    expect(criteria.length).toBeGreaterThanOrEqual(2);
    expect(criteria.length).toBeLessThanOrEqual(4);
  });

  it.each(lessonFiles)('%s: mọi dòng tiêu chí hiện được cạnh nút tick', (file) => {
    expect(unrenderableCriteriaLines(read(file))).toEqual([]);
  });

  // Đọc trên điện thoại đặt trên giá nhạc: một dòng dài quá là phải cuộn giữa lúc hai tay còn trên phím.
  it.each(lessonFiles)('%s: mỗi dòng tiêu chí đủ ngắn để liếc là đọc được', (file) => {
    for (const item of splitDoneCriteria(read(file)).criteria) {
      expect(item.length, item).toBeLessThanOrEqual(130);
    }
  });
});
