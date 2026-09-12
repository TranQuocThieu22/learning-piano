import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatNgay,
  latestUpdate,
  listUpdates,
  newestFirst,
  parseUpdateFileName,
  stripTitle,
  UPDATES_DIR,
  type UpdatePost,
} from './updates';

describe('tên file bài cập nhật', () => {
  it('tách được ngày và slug', () => {
    expect(parseUpdateFileName('2026-09-12-luyen-nhan-not-tu-chon.md')).toEqual({
      date: '2026-09-12',
      slug: '2026-09-12-luyen-nhan-not-tu-chon',
    });
  });

  it('từ chối tên file không mở đầu bằng ngày', () => {
    for (const xau of [
      'luyen-nhan-not.md',
      '2026-9-12-thieu-so-khong.md',
      '2026-09-12.md',
      '2026-09-12-Chu-Hoa.md',
      '2026-09-12-co dau cach.md',
      '2026-09-12-tieng-viet-có-dấu.md',
      'README.txt',
      '../../.env.local',
    ]) {
      expect(parseUpdateFileName(xau), xau).toBeNull();
    }
  });

  /*
   * Mẫu regex chỉ đếm chữ số nên `2026-13-40` vẫn khớp. Không chặn thì bài đó
   * hiện ra với ngày 40/13/2026 và xếp lẫn vào giữa danh sách.
   */
  it('từ chối ngày không tồn tại', () => {
    expect(parseUpdateFileName('2026-13-01-thang-muoi-ba.md')).toBeNull();
    expect(parseUpdateFileName('2026-02-30-ngay-khong-co.md')).toBeNull();
    expect(parseUpdateFileName('2026-09-31-thang-chin-31-ngay.md')).toBeNull();
  });

  it('nhận ngày 29/02 của năm nhuận', () => {
    expect(parseUpdateFileName('2028-02-29-nam-nhuan.md')?.date).toBe('2028-02-29');
  });
});

describe('ngày hiện cho người học', () => {
  it('đổi sang dd/mm/yyyy', () => {
    expect(formatNgay('2026-09-12')).toBe('12/09/2026');
    expect(formatNgay('2026-01-01')).toBe('01/01/2026');
  });
});

describe('cắt dòng tiêu đề', () => {
  it('bỏ dòng `# ` đầu tiên và khoảng trắng còn lại', () => {
    expect(stripTitle('# Tiêu đề\n\nĐoạn một.\n')).toBe('Đoạn một.\n');
  });

  it('giữ nguyên tiêu đề mục con', () => {
    const body = stripTitle('# Tiêu đề\n\n## Mục con\n\nChữ.\n');
    expect(body).toContain('## Mục con');
    expect(body).not.toContain('# Tiêu đề');
  });

  it('không có dòng `# ` thì trả về nguyên văn', () => {
    expect(stripTitle('Chỉ có chữ.\n')).toBe('Chỉ có chữ.\n');
  });
});

describe('thứ tự mới nhất trước', () => {
  const bai = (date: string, slug: string): UpdatePost => ({
    slug,
    title: slug,
    date,
    dateLabel: formatNgay(date),
    nhan: null,
    body: '',
  });

  it('ngày mới hơn đứng trước', () => {
    const xep = [bai('2026-09-10', 'a'), bai('2026-09-12', 'b')].sort(newestFirst);
    expect(xep.map((p) => p.slug)).toEqual(['b', 'a']);
  });

  /*
   * Một ngày làm được nhiều việc, nên trùng ngày là chuyện thường. Không có mức
   * so thứ hai thì thứ tự phụ thuộc `readdirSync`, tức là đổi theo hệ điều hành.
   */
  it('trùng ngày thì xếp theo slug, không phụ thuộc thứ tự đọc thư mục', () => {
    const xep = [
      bai('2026-09-11', '2026-09-11-a-goc-bai-hat'),
      bai('2026-09-11', '2026-09-11-b-nghe-dan'),
    ].sort(newestFirst);
    expect(xep.map((p) => p.slug)).toEqual([
      '2026-09-11-b-nghe-dan',
      '2026-09-11-a-goc-bai-hat',
    ]);
  });
});

/*
 * Đọc thư mục thật chứ không dựng file giả: thứ dễ vỡ ở đây không phải logic mà
 * là **bài thật có đúng khuôn không** — đặt sai tên file một cái là bài đó im
 * lặng biến khỏi trang, không có lỗi nào báo.
 */
describe('đọc thư mục docs/09-cap-nhat thật', () => {
  const posts = listUpdates();

  it('có bài, và bài nào cũng có tiêu đề lẫn thân bài', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.title, post.slug).not.toBe(post.slug);
      expect(post.title.startsWith('#'), post.slug).toBe(false);
      expect(post.body.trim().length, post.slug).toBeGreaterThan(0);
    }
  });

  it('mọi file .md trong thư mục đều được nhận, không bài nào bị bỏ rơi', () => {
    const soFile = fs
      .readdirSync(path.join(process.cwd(), 'docs', UPDATES_DIR))
      .filter((f) => f.endsWith('.md')).length;
    expect(posts.length).toBe(soFile);
  });

  it('xếp mới nhất trước', () => {
    const ngay = posts.map((p) => p.date);
    expect([...ngay].sort().reverse()).toEqual(ngay);
  });

  it('thân bài không còn lặp lại tiêu đề bài', () => {
    for (const post of posts) {
      expect(post.body, post.slug).not.toContain(`# ${post.title}`);
    }
  });

  it('bài mới nhất đúng là bài đầu danh sách', () => {
    expect(latestUpdate()?.slug).toBe(posts[0].slug);
  });
});
