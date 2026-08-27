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
