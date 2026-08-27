import fs from 'fs';
import path from 'path';

/**
 * Nhúng lại bản nhạc của một bài tập ở bài khác, ngay tại chỗ đang cần.
 *
 * Vấn đề nó giải: mục Khởi động của gần như mọi bài đều bảo "đánh lại Bài tập
 * 2C của bài trước". Trước đây người học phải rời trang, mò tìm, rồi quay lại —
 * ngay phút đầu buổi tập. Nay bản nhạc hiện luôn tại chỗ.
 *
 * Cú pháp, đặt trên một dòng riêng:
 *
 *     {{sheet: chuong-04-bai-01#1A}}
 *
 * Cố ý tham chiếu bằng ĐƯỜNG DẪN BÀI + MÃ chứ không phải mã trần, vì mã bài tập
 * KHÔNG duy nhất trong giáo trình: "1A" tồn tại ở năm bài khác nhau (bài 1 của
 * các Chương 1, 4, 5, 6, 7). Mã trần sẽ nhúng nhầm bản nhạc mà không ai biết.
 *
 * Không chép tay bản nhạc sang bài ôn: chép là đẻ ra 15 bản sao, sửa một nốt
 * sai phải nhớ sửa đủ 15 chỗ, sót một cái là hai trang dạy hai thứ khác nhau.
 */

/** Thư mục chứa bài có thể được nhúng. Bài tập là nguồn duy nhất trong thực tế. */
const LESSON_DIRS = ['03-exercises', '02-chapters'];

const DIRECTIVE = /^[ \t]*\{\{sheet:\s*([a-z0-9-]+)\s*#\s*([0-9]+[A-Z])\s*\}\}[ \t]*$/gm;

export class SheetEmbedError extends Error {}

function docsRoot(): string {
  return path.join(process.cwd(), 'docs');
}

/** Tìm file bài học theo slug, trả về cả đường dẫn lẫn thư mục để dựng link. */
function findLesson(slug: string): { fullPath: string; dir: string } | null {
  for (const dir of LESSON_DIRS) {
    const fullPath = path.join(docsRoot(), dir, `${slug}.md`);
    if (fs.existsSync(fullPath)) return { fullPath, dir };
  }
  return null;
}

/**
 * Lấy khối ```abc đầu tiên nằm dưới tiêu đề "## Bài tập <mã>".
 *
 * Nhận cả `##` lẫn `###`: giáo trình dùng lẫn hai cấp cho bài tập — ví dụ
 * chuong-01-bai-02 để 2A-2D ở `###` nhưng 2E ở `##`.
 *
 * Chỉ quét tới tiêu đề kế tiếp, để một bài tập không có bản nhạc sẽ báo lỗi
 * thay vì lặng lẽ mượn bản nhạc của bài tập bên dưới nó.
 */
export function extractExerciseAbc(fileText: string, code: string): string | null {
  // String.raw: trong template literal thường, `\s` bị rút thành "s" (JS bỏ dấu
  // gạch chéo của escape không hợp lệ), khiến regex thành "^##s+Bài tậps+".
  const heading = new RegExp(String.raw`^#{2,3}\s+Bài tập\s+${code}\b.*$`, 'm');
  const start = heading.exec(fileText);
  if (!start) return null;

  const after = fileText.slice(start.index + start[0].length);
  const nextHeading = /^#{1,3}\s+/m.exec(after);
  const section = nextHeading ? after.slice(0, nextHeading.index) : after;

  const abc = /```abc\r?\n([\s\S]*?)```/.exec(section);
  return abc ? abc[1] : null;
}

/** "Chương 4 - Bài 1" lấy từ tiêu đề H1 của bài nguồn, để đặt tên cho link. */
function lessonLabel(fileText: string, slug: string): string {
  const h1 = /^#\s+(.*)$/m.exec(fileText);
  if (!h1) return slug;
  // Bỏ phần mô tả sau dấu hai chấm: "Chương 4 - Bài 1: Chạm phím đen" -> "Chương 4 - Bài 1"
  return h1[1].split(':')[0].trim();
}

/**
 * Thay mọi chỉ thị {{sheet:}} bằng bản nhạc thật kèm dòng ghi nguồn.
 *
 * Ném lỗi khi không giải được. Trang bài học được dựng sẵn lúc build nên lỗi
 * này làm hỏng build — cố ý: thà build đỏ còn hơn người học trả tiền rồi mở ra
 * thấy một khoảng trắng.
 */
export function resolveSheetEmbeds(markdown: string): string {
  return markdown.replace(DIRECTIVE, (_full, slug: string, code: string) => {
    const lesson = findLesson(slug);
    if (!lesson) {
      throw new SheetEmbedError(
        `{{sheet: ${slug}#${code}}} — không có bài nào tên "${slug}.md" trong ${LESSON_DIRS.join(' hoặc ')}.`
      );
    }

    const fileText = fs.readFileSync(lesson.fullPath, 'utf-8');
    const abc = extractExerciseAbc(fileText, code);
    if (abc === null) {
      throw new SheetEmbedError(
        `{{sheet: ${slug}#${code}}} — bài "${slug}" không có mục "## Bài tập ${code}" kèm khối abc.`
      );
    }

    const label = lessonLabel(fileText, slug);
    const href = `/${lesson.dir}/${slug}`;

    return `> 🎵 **Bài tập ${code}** — ôn lại từ [${label}](${href})\n\n\`\`\`abc\n${abc}\`\`\``;
  });
}

/** Mọi chỉ thị có trong một đoạn markdown, dùng cho kiểm thử toàn giáo trình. */
export function findSheetEmbeds(markdown: string): { slug: string; code: string }[] {
  const found: { slug: string; code: string }[] = [];
  for (const m of markdown.matchAll(DIRECTIVE)) {
    found.push({ slug: m[1], code: m[2] });
  }
  return found;
}
