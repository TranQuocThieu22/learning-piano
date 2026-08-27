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
