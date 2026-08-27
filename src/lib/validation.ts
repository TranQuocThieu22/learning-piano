import { z } from 'zod';

/**
 * Schema dùng chung cho mọi đầu vào đến từ client.
 *
 * Vì sao cần: Server Action là endpoint HTTP thật, gọi được mà không qua giao
 * diện — nên tham số của nó KHÔNG chắc là chuỗi. Client có thể gửi object, mảng,
 * null. Trước khi có chỗ này, `note.trim()` gặp một object là ném lỗi 500.
 *
 * Giới hạn của cách làm này, chép từ tài liệu Next của chính bản đang dùng
 * (`node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, dòng 113):
 * validate schema chỉ kiểm tra HÌNH DẠNG. Một id đúng dạng vẫn có thể trỏ tới
 * dòng mà người gọi không sở hữu. Quyền vẫn phải lấy từ session — Zod không thay
 * thế được `requireAdmin()` hay `auth()`.
 */

/**
 * Khoá chính dạng chuỗi (id người dùng, id đơn...).
 *
 * Cố ý KHÔNG dùng `z.uuid()`: id do adapter Auth.js sinh, ta không kiểm soát
 * định dạng của nó. Siết quá tay ở đây là tự chặn đăng nhập của chính mình khi
 * adapter đổi cách sinh id. Chỉ cần chắc là chuỗi, không rỗng, không dài vô hạn.
 */
export const idSchema = z.string().trim().min(1).max(128);

/** Slug dạng "chuong-01-bai-01". Danh sách hợp lệ vẫn do getAllLessons() chốt. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.');

/** Ghi chú admin gõ tay. Chặn trên để không ai nhét megabyte vào cột text. */
export const noteSchema = z.string().trim().max(500).catch('');
