import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { resolveSheetEmbeds } from './sheet-embed';

/**
 * **Có gì mới**: các bài kể cho người học biết web vừa đổi gì.
 *
 * Vì sao cần có mục này: người học vào một trang đã lâu không đổi thì không có
 * cách nào biết nó đang được làm tiếp hay đã bị bỏ. Trong giai đoạn beta, "trang
 * này có người chăm" là thứ phải **nhìn thấy được**, không phải thứ để hứa.
 *
 * Vì sao đọc tách khỏi `markdown.ts` chứ không thêm vào `contentDirs`:
 *
 * - Bài cập nhật **không phải bài học**. Vào `contentDirs` là chúng lọt vào
 *   `getAllMarkdownFiles()`, tức là lọt vào đường đi, vào cổng chặn trả phí, và
 *   vào mọi chỗ đang suy số chương từ slug — mà slug ở đây mở đầu bằng ngày.
 * - Mỗi bài cập nhật chỉ dài vài đoạn. Cho mỗi bài một trang riêng là bắt người
 *   học chạm thêm một lần để đọc ba đoạn, rồi bấm quay lại. Ở đây cả danh sách
 *   hiện trọn nội dung trên **một trang** `/updates`.
 *
 * Cùng lối tách như `internal-docs.ts`: hai đường đọc riêng, không dính vào nhau.
 */

/** Thư mục nội dung. Tên tiếng Việt là ngoại lệ có chủ ý — xem `AGENTS.md`. */
export const UPDATES_DIR = '09-cap-nhat';

/**
 * Tên file phải mở đầu bằng ngày: `2026-09-12-luyen-nhan-not.md`.
 *
 * Ngày lấy từ TÊN FILE chứ không khai trong phần đầu file, để không bao giờ có
 * hai ngày lệch nhau cho cùng một bài. Đổi lại, đặt tên file sai mẫu thì bài
 * không hiện ra — `listUpdates()` bỏ qua nó chứ không đoán.
 */
const FILE_NAME = /^(\d{4})-(\d{2})-(\d{2})-([a-z0-9-]+)\.md$/;

export interface UpdatePost {
  /** Slug đầy đủ kể cả tiền tố ngày, dùng làm neo `#` trên trang. */
  slug: string;
  title: string;
  /** `yyyy-mm-dd`, để xếp thứ tự. */
  date: string;
  /** `dd/mm/yyyy`, để hiện cho người học đọc. */
  dateLabel: string;
  /** Nhãn ngắn phân loại ("Giao diện", "Bài hát"). `null` nếu file không khai. */
  nhan: string | null;
  /** Thân bài, đã bỏ dòng tiêu đề vì trang tự in tiêu đề riêng. */
  body: string;
}

/** `{ date, slug }` từ tên file, hoặc `null` nếu tên file sai mẫu. */
export function parseUpdateFileName(file: string): { date: string; slug: string } | null {
  const m = FILE_NAME.exec(file);
  if (!m) return null;

  const [, year, month, day] = m;
  // Chặn ngày không tồn tại (`2026-13-40`): mẫu regex chỉ đếm chữ số.
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(iso)) return null;

  return { date: iso, slug: file.replace(/\.md$/, '') };
}

/** `2026-09-12` → `12/09/2026`, dạng ngày người Việt đọc. */
export function formatNgay(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Bỏ dòng `# ` đầu tiên khỏi thân bài.
 *
 * Trang `/updates` in tiêu đề bằng thẻ riêng (để gắn được ngày và nhãn cạnh nó),
 * nên để nguyên dòng `# ` là tiêu đề hiện hai lần liền nhau.
 */
export function stripTitle(content: string): string {
  return content.replace(/^\s*#\s+.*$/m, '').trimStart();
}

/** Tiêu đề lấy từ dòng `# ` đầu tiên; không có thì dùng chính slug. */
function extractTitle(content: string, fallback: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : fallback;
}

/**
 * So sánh để xếp mới nhất lên trước.
 *
 * Cùng một ngày có thể có nhiều bài (một ngày làm được nhiều việc), nên phải có
 * mức so thứ hai — lấy luôn slug để thứ tự không phụ thuộc `readdirSync`.
 */
export function newestFirst(a: UpdatePost, b: UpdatePost): number {
  return b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug);
}

function updatesRoot(): string {
  return path.join(process.cwd(), 'docs', UPDATES_DIR);
}

/** Toàn bộ bài cập nhật, mới nhất trước. Thư mục chưa có thì trả về danh sách rỗng. */
export function listUpdates(): UpdatePost[] {
  const root = updatesRoot();
  if (!fs.existsSync(root)) return [];

  const posts = fs.readdirSync(root).flatMap((file): UpdatePost[] => {
    const parsed = parseUpdateFileName(file);
    if (!parsed) return [];

    const raw = fs.readFileSync(path.join(root, file), 'utf-8');
    const { content, data } = matter(raw);
    const nhan = typeof data.nhan === 'string' && data.nhan.trim() ? data.nhan.trim() : null;

    return [
      {
        slug: parsed.slug,
        title: extractTitle(content, parsed.slug),
        date: parsed.date,
        dateLabel: formatNgay(parsed.date),
        nhan,
        // Cho phép nhúng bản nhạc thật vào bài cập nhật, giống bài học: một bài
        // kể về bài hát mới mà nghe thử được ngay tại chỗ thì thuyết phục hơn.
        body: resolveSheetEmbeds(stripTitle(content)),
      },
    ];
  });

  return posts.sort(newestFirst);
}

/** Bài mới nhất, để màn hình chủ và Mục lục khoe được mà không đọc cả danh sách. */
export function latestUpdate(): UpdatePost | null {
  return listUpdates()[0] ?? null;
}
