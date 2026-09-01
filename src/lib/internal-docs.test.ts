import { describe, expect, it } from 'vitest';
import {
  extractSummary,
  extractTitle,
  extractUpdatedAt,
  isValidInternalSlug,
  listInternalDocs,
  readInternalDoc,
  resolveInternalDocPath,
  rewriteInternalLinks,
} from './internal-docs';

describe('cửa chặn slug', () => {
  it('nhận slug chữ thường có gạch ngang', () => {
    expect(isValidInternalSlug('quy-trinh-lam-viec')).toBe(true);
    expect(isValidInternalSlug('overview')).toBe(true);
  });

  it('từ chối mọi thứ có thể trèo ra khỏi thư mục docs', () => {
    for (const xau of ['../env', '..', 'a/b', 'a.b', './x', 'CON', 'a b', '']) {
      expect(isValidInternalSlug(xau)).toBe(false);
    }
  });

  it('không dựng được đường dẫn từ slug xấu', () => {
    expect(resolveInternalDocPath('../../.env.local')).toBeNull();
    expect(readInternalDoc('../../.env.local')).toBeNull();
  });

  it('OVERVIEW nằm ở gốc docs, phần còn lại trong _internal', () => {
    expect(resolveInternalDocPath('overview')).toBe('OVERVIEW.md');
    expect(resolveInternalDocPath('ke-hoach-beta')).toBe('_internal/ke-hoach-beta.md');
  });
});

describe('rút thông tin từ nội dung', () => {
  const mau = [
    '# Kế hoạch chạy beta',
    '',
    '> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**',
    '',
    'Kế hoạch này nhằm trả lời một câu hỏi duy nhất.',
    '',
    '| Ngày | Ghi chú |',
    '|---|---|',
    '| 15/07/2026 | bảng khác, không phải lịch sử |',
    '',
    '## Lịch sử cập nhật',
    '',
    '| Ngày | Tiêu đề commit | Cập nhật gì |',
    '|---|---|---|',
    '| 28/08/2026 | `docs: Một thay đổi` | Nội dung |',
    '| 25/08/2026 | `docs: Cũ hơn` | Nội dung |',
  ].join('\n');

  it('lấy tiêu đề từ dòng h1', () => {
    expect(extractTitle(mau, 'du-phong')).toBe('Kế hoạch chạy beta');
    expect(extractTitle('không có tiêu đề', 'du-phong')).toBe('du-phong');
  });

  it('lấy ngày ở bảng Lịch sử cập nhật, không nhặt nhầm bảng phía trên', () => {
    expect(extractUpdatedAt(mau)).toBe('28/08/2026');
    expect(extractUpdatedAt('# Chưa có bảng nào')).toBeNull();
  });

  it('bỏ qua khối trích dẫn để lấy câu mở đầu thật', () => {
    expect(extractSummary(mau)).toBe('Kế hoạch này nhằm trả lời một câu hỏi duy nhất.');
  });

  it('cắt ngắn phần tóm tắt quá dài', () => {
    const dai = `# Tiêu đề\n\n${'a'.repeat(300)}`;
    const summary = extractSummary(dai, 50);
    expect(summary).toHaveLength(51);
    expect(summary?.endsWith('…')).toBe(true);
  });
});

describe('viết lại liên kết chéo', () => {
  it('đổi đường dẫn tương đối thành đường dẫn khu quản trị', () => {
    expect(rewriteInternalLinks('xem [tài liệu](dinh-huong-kinh-doanh.md) nhé')).toBe(
      'xem [tài liệu](/admin/docs/dinh-huong-kinh-doanh) nhé'
    );
  });

  it('giữ nguyên phần neo và chấp nhận tiền tố ./', () => {
    expect(rewriteInternalLinks('[x](./bay-ky-thuat.md#muc-8)')).toBe(
      '[x](/admin/docs/bay-ky-thuat#muc-8)'
    );
  });

  it('hạ chữ thường cho OVERVIEW.md vì slug luôn là chữ thường', () => {
    expect(rewriteInternalLinks('[x](OVERVIEW.md)')).toBe('[x](/admin/docs/overview)');
  });

  it('không đụng tới liên kết ngoài', () => {
    const ngoai = '[x](https://example.com/a.md)';
    expect(rewriteInternalLinks(ngoai)).toBe(ngoai);
  });
});

describe('đọc từ đĩa', () => {
  it('liệt kê được tài liệu thật trong repo', () => {
    const docs = listInternalDocs();
    const slugs = docs.map((doc) => doc.slug);

    expect(slugs).toContain('overview');
    expect(slugs).toContain('quy-trinh-lam-viec');
    expect(docs.every((doc) => doc.title.length > 0)).toBe(true);
  });

  it('đọc được nội dung và trả null cho tài liệu không tồn tại', () => {
    expect(readInternalDoc('quy-trinh-lam-viec')).toContain('# Quy trình làm việc');
    expect(readInternalDoc('khong-co-that')).toBeNull();
  });
});
