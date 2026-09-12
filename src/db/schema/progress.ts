import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';

// --- App-specific table: one row per (user, lesson) that has been ticked ---

export const lessonCompletions = pgTable(
  'lesson_completion',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // e.g. "chuong-01-bai-01" — matches the markdown file slug in docs/03-exercises
    lessonSlug: text('lesson_slug').notNull(),
    completedAt: timestamp('completed_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('lesson_completion_user_lesson_idx').on(
      t.userId,
      t.lessonSlug
    ),
  ]
);

/**
 * Phản hồi một chạm ở cuối mỗi bài: *bài này ổn* hay *chỗ này tôi không hiểu*.
 *
 * **Vì sao cần một bảng riêng thay vì hỏi người học sau:** cổng Giai đoạn A đòi
 * biết vì sao người ta bỏ giữa chừng (xem mục 7 `lo-trinh-phat-trien.md`), mà
 * người bỏ cuộc thì **không trả lời tin nhắn và không điền form** — họ chỉ đóng
 * tab. Một cú chạm ngay lúc đang bí là thứ phản hồi duy nhất lấy được từ họ.
 * `lesson_completion` đã trả lời "họ dừng ở bài nào", bảng này trả lời "vì sao".
 *
 * **Một dòng cho mỗi (người, bài).** Bấm lại là ĐỔI ý, không phải bỏ thêm phiếu:
 * đếm số lần chạm thì một người chạm ba lần thành ba tín hiệu, và con số "bao
 * nhiêu người thấy bài này khó" — con số duy nhất đáng đọc — sai ngay.
 */
export const lessonFeedback = pgTable(
  'lesson_feedback',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonSlug: text('lesson_slug').notNull(),
    /**
     * `'ok'` hoặc `'stuck'`. Để text chứ không dùng kiểu enum của Postgres: thêm
     * một giá trị vào enum là ALTER TYPE, mà suốt beta chỉ được THÊM cột/bảng,
     * không đổi kiểu (xem mục 7 `quy-trinh-lam-viec.md`). Danh sách hợp lệ chốt
     * ở `feedbackVerdictSchema` phía ứng dụng.
     */
    verdict: text('verdict').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('lesson_feedback_user_lesson_idx').on(t.userId, t.lessonSlug),
  ]
);
