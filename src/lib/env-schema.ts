import { z } from 'zod';

/**
 * Khai báo biến môi trường của ứng dụng. Phần THUẦN, không chạm process.env.
 *
 * Tách khỏi `env.ts` (có 'server-only') vì cùng lý do `admin-allowlist.ts` tách
 * khỏi `admin.ts`: 'server-only' làm test không nạp được module.
 *
 * Ba tầng dưới đây khác nhau CÓ CHỦ Ý, đừng gộp:
 *
 * 1. BẮT BUỘC — thiếu là ứng dụng không chạy nổi, ném lỗi ngay lúc khởi động.
 * 2. ĐÓNG CỬA AN TOÀN — thiếu thì tính năng đó tự khoá lại, ứng dụng vẫn sống.
 *    `ADMIN_EMAILS` trống nghĩa là không ai vào được /admin;
 *    `SEPAY_WEBHOOK_API_KEY` trống nghĩa là từ chối mọi webhook.
 *    Chuyển hai cái này lên tầng 1 là LÀM YẾU ĐI: thà site chạy ở chế độ an
 *    toàn còn hơn site chết vì thiếu một khoá.
 * 3. TUỲ CHỌN — có thì tốt, không có thì lùi về mặc định.
 */

const batBuoc = z.string().trim().min(1);
const tuyChon = z.string().trim().optional();

export const envSchema = z.object({
  // --- 1. Bắt buộc ---
  DATABASE_URL: batBuoc,
  AUTH_SECRET: batBuoc,
  AUTH_GOOGLE_ID: batBuoc,
  AUTH_GOOGLE_SECRET: batBuoc,

  // --- 2. Đóng cửa an toàn khi thiếu ---
  ADMIN_EMAILS: tuyChon,
  SEPAY_WEBHOOK_API_KEY: tuyChon,

  // --- 3. Tuỳ chọn ---
  /** Chuỗi không qua pooler, chỉ drizzle-kit dùng. Thiếu thì lùi về DATABASE_URL. */
  DATABASE_URL_UNPOOLED: tuyChon,
  SEPAY_BANK_CODE: tuyChon,
  SEPAY_ACCOUNT_NUMBER: tuyChon,
  SEPAY_ACCOUNT_NAME: tuyChon,
});

export type Env = z.infer<typeof envSchema>;

/** Tên mọi biến ứng dụng dùng, để test đối chiếu với .env.example. */
export const ENV_KEYS = Object.keys(envSchema.shape) as (keyof Env)[];

/** Dựng thông báo lỗi nêu ĐỦ mọi biến thiếu cùng lúc, không bắt sửa từng cái. */
export function moTaLoiThieuBien(issues: { path: PropertyKey[] }[]): string {
  const thieu = issues.map((i) => i.path.join('.')).join(', ');
  return (
    `Thiếu hoặc sai biến môi trường bắt buộc: ${thieu}.\n` +
    'Chép .env.example thành .env.local rồi điền, hoặc khai trong bảng điều ' +
    'khiển Vercel (Settings > Environment Variables). ' +
    'Giải thích từng biến: docs/_internal/bien-moi-truong.md'
  );
}
