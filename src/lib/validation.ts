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

/**
 * Hai lựa chọn của nút phản hồi cuối bài.
 *
 * Đúng hai, và đừng thêm mức thứ ba kiểu "tạm được": cái giá của một cú chạm
 * phải bằng không thì người đang bí mới chạm. Ba lựa chọn là bắt người ta cân
 * nhắc, mà cân nhắc thì họ đóng tab.
 *
 * Danh sách hợp lệ chốt ở đây chứ không ở cột database: cột để `text` vì suốt
 * beta không được đổi kiểu (mục 7 `quy-trinh-lam-viec.md`).
 */
export const feedbackVerdictSchema = z.enum(['ok', 'stuck']);

export type FeedbackVerdict = z.infer<typeof feedbackVerdictSchema>;

/**
 * Tên bản nhạc người học tự đặt trong *Kho nhạc của tôi*.
 *
 * Cắt ở 120 ký tự chứ không để tự do: tên hiện trên một dòng của danh sách trên
 * màn hình điện thoại, mà cột `title` thì không có gì chặn nếu ai đó gọi thẳng
 * Server Action. Để rỗng thì lấy tên mặc định ở chỗ gọi, không báo lỗi — người
 * học vừa mất công chọn file, bắt họ làm lại vì cái tên là mất công vô ích.
 */
export const sheetTitleSchema = z.string().trim().min(1).max(120);

/**
 * Chuỗi ABC gửi lên từ trình duyệt.
 *
 * Việc đọc file diễn ra ở MÁY CỦA NGƯỜI HỌC (xem `import-sheet.ts`), nên thứ tới
 * máy chủ chỉ là chữ. Vẫn phải chặn trên: Server Action gọi được mà không qua
 * giao diện, và không có giới hạn nào thì một lệnh curl nhét được vài megabyte
 * vào một dòng database.
 */
export const sheetAbcSchema = z.string().trim().min(1).max(60_000);

/** Hai định dạng file app đọc được nốt. Ảnh chụp đi đường riêng. */
export const sheetNoteSourceSchema = z.enum(['midi', 'musicxml']);

/**
 * Một trang ảnh, dạng `data:image/jpeg;base64,...`.
 *
 * Chỉ kiểm ĐỘ DÀI ở đây; hình dạng thật do `parseImageDataUrl` kiểm, vì ở đó mới
 * biết kiểu ảnh nào được nhận. Chặn dài hơn mức ảnh một chút để thông báo lỗi nói
 * đúng chuyện ("ảnh quá nặng") thay vì một lỗi Zod chung chung.
 */
export const sheetPageDataSchema = z.string().min(1).max(1_200_000);
