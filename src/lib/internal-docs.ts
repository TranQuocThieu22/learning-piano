import fs from 'fs';
import path from 'path';

/**
 * Đọc tài liệu nội bộ (`docs/_internal` và `docs/OVERVIEW.md`) cho khu quản trị.
 *
 * Vì sao tách hẳn khỏi `markdown.ts`: `getAllMarkdownFiles()` ở đó quét
 * `contentDirs` để dựng thanh bên cho người học. Thêm `_internal` vào danh sách
 * ấy là định hướng kinh doanh, kế hoạch beta và mô tả biến môi trường nằm ngay
 * trong thanh điều hướng của người học. Hai đường đọc phải tách rời nhau; cửa
 * chặn là layout của `/admin`, và không có liên kết nào từ giao diện người học
 * trỏ tới đây.
 */

const INTERNAL_DIR = '_internal';

/** Ngoại lệ duy nhất: OVERVIEW.md nằm ở gốc `docs/` chứ không trong `_internal`. */
const OVERVIEW_SLUG = 'overview';

export interface InternalDoc {
  slug: string;
  title: string;
  /** Ngày ở dòng đầu bảng "Lịch sử cập nhật", giữ nguyên dạng dd/mm/yyyy. */
  updatedAt: string | null;
  /** Câu mở đầu, để biết tài liệu nói về cái gì mà không phải mở ra. */
  summary: string | null;
}

/**
 * Slug chỉ được gồm chữ thường, số và gạch ngang.
 *
 * Đây là cửa chặn duy nhất giữa tham số URL và `path.join`. Thiếu nó thì
 * `/admin/docs/..%2F..%2F.env.local` đọc được file ngoài thư mục `docs`.
 */
export function isValidInternalSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

/** Đường dẫn tương đối tính từ `docs/`, hoặc `null` nếu slug không hợp lệ. */
export function resolveInternalDocPath(slug: string): string | null {
  if (!isValidInternalSlug(slug)) return null;
  if (slug === OVERVIEW_SLUG) return 'OVERVIEW.md';
  return `${INTERNAL_DIR}/${slug}.md`;
}

/** Tiêu đề lấy từ dòng `# ` đầu tiên; không có thì dùng chính slug. */
export function extractTitle(content: string, fallback: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : fallback;
}

/**
 * Ngày mới nhất trong bảng "Lịch sử cập nhật".
 *
 * Chỉ dò từ chỗ có tiêu đề mục đó trở đi: nhiều tài liệu có bảng khác nằm trên,
 * quét cả file thì dễ nhặt nhầm ngày của bảng không liên quan.
 */
export function extractUpdatedAt(content: string): string | null {
  const start = content.indexOf('## Lịch sử cập nhật');
  if (start === -1) return null;

  const match = /^\|\s*(\d{2}\/\d{2}\/\d{4})\s*\|/m.exec(content.slice(start));
  return match ? match[1] : null;
}

/** Đoạn văn thường đầu tiên sau tiêu đề, cắt ngắn để xếp vừa một dòng. */
export function extractSummary(content: string, maxLength = 180): string | null {
  const lines = content.split(/\r?\n/);
  let seenTitle = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!seenTitle) {
      if (line.startsWith('# ')) seenTitle = true;
      continue;
    }
    // Bỏ qua khối trích dẫn (mọi tài liệu nội bộ đều mở đầu bằng một khối
    // cảnh báo), bảng, tiêu đề con, gạch ngang và dòng trống.
    if (!line || line.startsWith('>') || line.startsWith('#')) continue;
    if (line.startsWith('|') || line.startsWith('---')) continue;

    const plain = line.replace(/[*_`]/g, '');
    return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain;
  }

  return null;
}

/**
 * Đổi liên kết chéo giữa các tài liệu thành đường dẫn của khu quản trị.
 *
 * Trong repo, các file này trỏ sang nhau bằng đường dẫn tương đối
 * (`[...](dinh-huong-kinh-doanh.md)`) — đúng khi đọc trên GitHub hay trong
 * trình soạn thảo, nhưng trên web thì thành liên kết chết. Viết lại thành
 * `/admin/docs/<slug>` để bấm được, giữ nguyên phần neo `#muc-3` nếu có.
 */
export function rewriteInternalLinks(content: string): string {
  return content.replace(
    /\]\((?:\.\/)?([A-Za-z0-9-]+)\.md(#[^)]*)?\)/g,
    (match, name: string, anchor: string | undefined) => {
      const slug = name.toLowerCase();
      if (!isValidInternalSlug(slug)) return match;
      return `](/admin/docs/${slug}${anchor ?? ''})`;
    }
  );
}

function docsRoot(): string {
  return path.join(process.cwd(), 'docs');
}

/** Toàn bộ tài liệu nội bộ, OVERVIEW trước rồi tới `_internal` theo thứ tự chữ cái. */
export function listInternalDocs(): InternalDoc[] {
  const root = docsRoot();
  const slugs: string[] = [];

  if (fs.existsSync(path.join(root, 'OVERVIEW.md'))) slugs.push(OVERVIEW_SLUG);

  const internalDir = path.join(root, INTERNAL_DIR);
  if (fs.existsSync(internalDir)) {
    slugs.push(
      ...fs
        .readdirSync(internalDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.replace(/\.md$/, ''))
        .filter(isValidInternalSlug)
        .sort()
    );
  }

  return slugs.flatMap((slug) => {
    const relative = resolveInternalDocPath(slug);
    if (!relative) return [];

    const content = fs.readFileSync(path.join(root, relative), 'utf-8');
    return [
      {
        slug,
        title: extractTitle(content, slug),
        updatedAt: extractUpdatedAt(content),
        summary: extractSummary(content),
      },
    ];
  });
}

/** Nội dung một tài liệu, đã viết lại liên kết chéo. `null` nếu không có. */
export function readInternalDoc(slug: string): string | null {
  const relative = resolveInternalDocPath(slug);
  if (!relative) return null;

  const fullPath = path.join(docsRoot(), relative);
  if (!fs.existsSync(fullPath)) return null;

  return rewriteInternalLinks(fs.readFileSync(fullPath, 'utf-8'));
}
