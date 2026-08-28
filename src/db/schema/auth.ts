import { pgTable, text, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// --- Auth.js (NextAuth) required tables ---
// Schema shape follows the Auth.js Drizzle adapter contract:
// https://authjs.dev/getting-started/adapters/drizzle

/**
 * Vai trò của người dùng trong ứng dụng.
 *
 * KHÔNG phải cổng chặn /admin. Quyền vào khu quản trị vẫn đọc từ biến môi
 * trường ADMIN_EMAILS (src/lib/admin-allowlist.ts) — cố ý không đọc từ
 * database, để người chiếm được quyền ghi DB vẫn không tự phong mình làm
 * admin. Cột này là dữ liệu bổ sung: hiển thị, và phân cấp về sau.
 */
export type UserRole = 'member' | 'admin' | 'superadmin';

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role').$type<UserRole>().notNull().default('member'),
  /**
   * Ngày tạo tài khoản.
   *
   * KHÔNG nằm trong hợp đồng adapter của Auth.js — adapter chỉ ghi những cột nó
   * biết, nên giá trị phải do chính Postgres điền. Vì vậy ở đây là `.defaultNow()`
   * (sinh ra `DEFAULT now()` thật trong database) chứ KHÔNG phải `$defaultFn`
   * như cột `id` — cái đó chỉ chạy ở tầng Drizzle, đi đường khác vào là bỏ trống.
   * Xem bẫy 6 trong `docs/_internal/bay-ky-thuat.md`.
   *
   * Có cột này mới đo được tầng T2→T3 của phễu (đăng ký rồi không bao giờ tick
   * bài nào — thường là chỗ rơi to nhất), và mới biết từng người đã tham gia bao
   * lâu, thứ mà quy tắc "sau hai tuần chưa xong Chương 1 thì coi như đã rơi"
   * của `docs/_internal/ke-hoach-beta.md` bắt buộc phải có. Không ghi lúc đó thì
   * sau này không dựng lại được.
   */
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);
