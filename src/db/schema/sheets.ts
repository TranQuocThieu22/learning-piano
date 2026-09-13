import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

// --- Kho nhạc của tôi: bản nhạc do chính người học đưa lên ---
//
// Hai bảng vì hai thứ có vòng đời khác nhau và cỡ khác nhau hẳn:
//   user_sheet       — một dòng cho mỗi bản nhạc. Bài nhập từ file giữ luôn chuỗi
//                      ABC ở đây vì nó chỉ vài chục KB chữ.
//   user_sheet_page  — một dòng cho mỗi TRANG ẢNH. Tách ra để một bản nhạc nhiều
//                      trang không thành một dòng khổng lồ, và để người học thêm
//                      hoặc bỏ từng trang mà không phải gửi lại cả tập.
//
// **Luật và lý do sản phẩm nằm ở `src/lib/user-sheets.ts`** — đọc phần đầu file đó
// trước khi sửa gì ở đây, nhất là bốn điều giữ cho app ở vị trí nơi chứa chứ không
// phải người phát hành.

/**
 * Ảnh lưu thành chuỗi base64 trong Postgres, **cố ý không dùng kho file riêng**.
 *
 * Cân nhắc lúc chọn: kho file (Vercel Blob, S3) đúng bài hơn về kỹ thuật, nhưng nó
 * kéo theo một nhà cung cấp nữa, một biến môi trường nữa, một hoá đơn nữa và một
 * đường xoá dữ liệu nữa phải nhớ khi người học xoá tài khoản. Ở quy mô beta — vài
 * chục người, mỗi bản nhạc vài trang đã thu nhỏ còn khoảng 300KB — Postgres chứa
 * thoải mái, và xoá tài khoản là dữ liệu ảnh đi theo luôn nhờ `onDelete: cascade`.
 *
 * **Ngưỡng phải đổi ý:** khi tổng dung lượng ảnh vượt khoảng một GB, hoặc khi
 * người học bắt đầu than chậm lúc mở bản nhạc nhiều trang. Lúc đó chuyển sang kho
 * file và giữ bảng này làm bảng chỉ mục — cột `data_base64` khi ấy để trống dần,
 * không phải xoá (suốt beta chỉ được THÊM, xem mục 7 `quy-trinh-lam-viec.md`).
 */
export const userSheets = pgTable(
  'user_sheet',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /**
     * `'notes'` (đọc được nốt, có chuỗi ABC) hoặc `'photo'` (chỉ là ảnh).
     * Để `text` chứ không dùng enum của Postgres: thêm một giá trị vào enum là
     * ALTER TYPE, mà suốt beta không được đổi kiểu. Danh sách hợp lệ chốt ở
     * `SHEET_SOURCES` trong `src/lib/user-sheets.ts`.
     */
    kind: text('kind').notNull(),
    /** `'midi'`, `'musicxml'` hoặc `'photo'` — bản nhạc này từ đâu ra. */
    source: text('source').notNull(),
    /** Chuỗi ABC với bài nhập từ file; `null` với bài chụp ảnh. */
    abc: text('abc'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('user_sheet_user_idx').on(t.userId, t.createdAt)]
);

export const userSheetPages = pgTable(
  'user_sheet_page',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sheetId: text('sheet_id')
      .notNull()
      .references(() => userSheets.id, { onDelete: 'cascade' }),
    /**
     * Chủ sở hữu, chép xuống đây dù đã suy được qua `sheet_id`.
     *
     * Có cột này thì đường phục vụ ảnh (`/api/sheet-pages/[id]`) hỏi đúng MỘT câu
     * — "trang này có phải của người đang đăng nhập không" — thay vì nối bảng.
     * Ảnh là thứ riêng tư nhất trong app này, nên câu hỏi quyền phải ngắn tới mức
     * không viết sai được.
     */
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Thứ tự trang, đếm từ 1. */
    position: integer('position').notNull(),
    mimeType: text('mime_type').notNull(),
    /** Ảnh đã thu nhỏ ở trình duyệt, mã base64 (không kèm tiền tố `data:`). */
    dataBase64: text('data_base64').notNull(),
    /** Cỡ thật sau khi giải mã, để hiện cho người học và để đo dung lượng kho. */
    byteSize: integer('byte_size').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('user_sheet_page_sheet_idx').on(t.sheetId, t.position)]
);
