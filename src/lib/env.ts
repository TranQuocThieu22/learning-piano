import 'server-only';
import { envSchema, moKhoaKhiDev, moTaLoiThieuBien, type Env } from './env-schema';

/**
 * Nơi DUY NHẤT phía ứng dụng đọc process.env.
 *
 * Trước đây năm file mỗi nơi tự kiểm một kiểu, nên thiếu một biến trên
 * production thì phát hiện ra lúc có người đang dùng chứ không phải lúc khởi
 * động. Gom về đây để hỏng là hỏng ngay, và báo thiếu TẤT CẢ cùng lúc.
 *
 * Có test canh (env.test.ts) rằng không file nào khác trong src/ đọc thẳng
 * process.env nữa. Script trong scripts/ không tính: chúng là Node độc lập,
 * tự nạp dotenv và tự kiểm lấy.
 */
function doc(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;
  throw new Error(moTaLoiThieuBien(parsed.error.issues));
}

export const env = doc();

/**
 * Mở khoá toàn bộ nội dung trả phí trên máy làm việc — xem `moKhoaKhiDev()`.
 *
 * Đọc `NODE_ENV` ở đây chứ không qua schema: nó do Next.js đặt, không phải cấu
 * hình của dự án, nên không thuộc `.env.example`.
 */
export const devUnlockAll = moKhoaKhiDev(env.DEV_UNLOCK_ALL, process.env.NODE_ENV);
