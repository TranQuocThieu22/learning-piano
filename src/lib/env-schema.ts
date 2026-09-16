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
  /** Thiếu hoặc khác "true" thì KHÔNG bán — xem `dangBan()` bên dưới. */
  SELLING_ENABLED: tuyChon,
  /** Chỉ có tác dụng khi chạy `next dev` — xem `moKhoaKhiDev()` bên dưới. */
  DEV_UNLOCK_ALL: tuyChon,
  /**
   * Khoá của Resend — dịch vụ gửi thư. Thiếu thì app KHÔNG gửi thư nào cả,
   * phần còn lại chạy như thường: cấp gói vẫn xong, chỉ là người học không
   * nhận được thư báo. Xem `sendEmail()` ở `email.ts`.
   */
  RESEND_API_KEY: tuyChon,

  // --- 3. Tuỳ chọn ---
  /** Chuỗi không qua pooler, chỉ drizzle-kit dùng. Thiếu thì lùi về DATABASE_URL. */
  DATABASE_URL_UNPOOLED: tuyChon,
  SEPAY_BANK_CODE: tuyChon,
  SEPAY_ACCOUNT_NUMBER: tuyChon,
  SEPAY_ACCOUNT_NAME: tuyChon,
  /** Người gửi đứng tên trên thư. Thiếu thì lùi về `DIA_CHI_GUI_MAC_DINH`. */
  EMAIL_FROM: tuyChon,
});

export type Env = z.infer<typeof envSchema>;

/**
 * Có đang mở bán không.
 *
 * **Chiều của cờ này là cố ý ngược với trực giác:** không đặt gì thì KHÔNG bán.
 * Cùng tầng đóng cửa an toàn với `ADMIN_EMAILS`, và lý do cũng vậy — hai kiểu
 * quên dẫn tới hai hậu quả rất khác nhau:
 *
 * - Quên BẬT lúc mở bán: không ai mua được. Bạn phát hiện ngay lần thử đầu tiên,
 *   sửa bằng một biến môi trường.
 * - Quên TẮT trong lúc beta: người thử thấy bảng giá 399k và tạo được đơn thật,
 *   trên gói Vercel Hobby vốn cấm dùng thương mại (mục 6 của
 *   dinh-huong-kinh-doanh.md). Không có triệu chứng nào cả — đó mới là kiểu hỏng
 *   đáng sợ.
 *
 * Nhận đúng chuỗi "true", không nhận "1" hay "yes": một giá trị duy nhất thì
 * không có chuyện bật hụt vì gõ khác kiểu.
 */
export function dangBan(raw: string | undefined | null): boolean {
  return raw?.trim().toLowerCase() === 'true';
}

/**
 * Có mở khoá toàn bộ nội dung trả phí cho mọi người xem không — CHỈ ở máy làm việc.
 *
 * Vì sao cần (14/09/2026): soạn lại Chương 2-7 xong mà không đọc thử được, vì
 * trình duyệt dùng để kiểm ở máy không đăng nhập Google được (redirect URI chỉ
 * khớp tên miền thật) nên bài nào sau Chương 1 cũng chỉ thấy màn hình khoá.
 *
 * Mở khi và chỉ khi **cả hai** điều cùng đúng:
 *
 * 1. `DEV_UNLOCK_ALL` là đúng chuỗi "true" — cùng lối nhận cờ với `dangBan()`.
 * 2. `NODE_ENV` là "development", tức đang chạy `next dev`.
 *
 * Điều 2 là cái chốt thật. `next build` và `next start` luôn đặt `NODE_ENV` là
 * "production", Vercel cũng vậy ở cả production lẫn preview — nên lỡ ai khai
 * biến này trên Vercel thì nó vẫn không mở gì. Đừng nới điều 2 ra thành "khác
 * production": `NODE_ENV` còn là "test" khi chạy vitest, và mọi giá trị lạ đều
 * phải là đóng.
 */
export function moKhoaKhiDev(raw: string | undefined | null, nodeEnv: string | undefined): boolean {
  return nodeEnv === 'development' && dangBan(raw);
}

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

/**
 * Người gửi mặc định của mọi thư app gửi đi.
 *
 * Địa chỉ `@rehover.io` chứ không phải `@gmail.com`: mục 8 của
 * `docs/_internal/ke-hoach-beta.md` đã chốt rằng trước khi mở bán thì thư phải
 * đi đúng tên miền, vì hoá đơn gửi từ một địa chỉ Gmail trông không đáng tin.
 * Tên miền phải được xác minh ở Resend trước, nếu không thư bị từ chối ngay.
 */
export const DIA_CHI_GUI_MAC_DINH = 'Piano Journey <pianojourney@rehover.io>';

/** Địa chỉ đứng tên người gửi; khai thiếu hay khai chuỗi rỗng đều lùi về mặc định. */
export function diaChiGuiThu(raw: string | undefined | null): string {
  return raw?.trim() || DIA_CHI_GUI_MAC_DINH;
}
