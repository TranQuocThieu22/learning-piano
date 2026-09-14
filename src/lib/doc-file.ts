import fs from 'fs';

/**
 * Đọc một file văn bản trong `docs/`, xuống dòng đã quy hết về `\n`.
 *
 * Vì sao phải có cửa này (bẫy 42): trên Windows với `core.autocrlf=true`, git
 * checkout file ra với xuống dòng `\r\n`, còn Vercel và CI chạy Linux thì là
 * `\n`. Mọi regex phía sau viết theo `\n` — ví dụ /```abc\n/ — sẽ lặng lẽ không
 * khớp ở máy Windows: bài hát mất bản nhạc, không lỗi nào báo, chỉ có test trượt.
 *
 * Quy về `\n` ngay tại đây thay vì vá từng regex thành `\r?\n`: đã vá kiểu đó ở
 * `sheet-embed.ts` và `check-lessons.mjs`, rồi `songs.ts` viết regex mới vẫn quên.
 * Mọi đường đọc `docs/` (`markdown.ts`, `sheet-embed.ts`, `updates.ts`,
 * `internal-docs.ts`) phải đi qua hàm này, đừng gọi `readFileSync` thẳng.
 */
export function readDocFile(fullPath: string): string {
  return fs.readFileSync(fullPath, 'utf-8').replace(/\r\n?/g, '\n');
}
