import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// --- Thanh toán: đơn hàng, giao dịch nhận được, và quyền truy cập ---
//
// Tách làm ba bảng thay vì một, vì ba thứ này có vòng đời khác nhau:
//   orders       — ý định mua, do người học tạo ra, có thể không bao giờ được trả
//   payments     — tiền thật đã vào tài khoản, là bản ghi kế toán, không bao giờ sửa
//   entitlements — quyền truy cập, có thể cấp tay mà không cần đơn nào (hoàn tiền,
//                  tặng, hoặc khách chuyển khoản sai cú pháp phải xử lý thủ công)

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export const orders = pgTable(
  'payment_order',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Khoá gói trong PACKAGES (src/lib/packages.ts), ví dụ "nen-tang". */
    packageId: text('package_id').notNull(),
    /** Số tiền chốt lúc tạo đơn, để đổi giá sau này không ảnh hưởng đơn cũ. */
    amountVnd: integer('amount_vnd').notNull(),
    /**
     * Mã người học phải ghi trong nội dung chuyển khoản. Đây là thứ duy nhất
     * nối tiền vào tài khoản với một đơn cụ thể, nên bắt buộc là duy nhất.
     */
    transferCode: text('transfer_code').notNull(),
    status: text('status').$type<OrderStatus>().notNull().default('pending'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { mode: 'date' }),
  },
  (t) => [
    uniqueIndex('payment_order_transfer_code_idx').on(t.transferCode),
    index('payment_order_user_idx').on(t.userId),
  ]
);

export const payments = pgTable(
  'payment_received',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Mã giao dịch bên SePay. Ràng buộc duy nhất ở đây chính là cơ chế chống
     * trùng: SePay gửi lại webhook tối đa 7 lần theo dãy Fibonacci trong 5 giờ
     * nếu chưa nhận được phản hồi thành công, nên cùng một giao dịch sẽ tới
     * nhiều lần. Chèn trùng sẽ lỗi, và đó là hành vi mong muốn.
     */
    providerTxId: text('provider_tx_id').notNull(),
    orderId: text('order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    amountVnd: integer('amount_vnd').notNull(),
    /** Nội dung chuyển khoản thô, giữ nguyên để đối chiếu khi có tranh chấp. */
    rawContent: text('raw_content'),
    /** Toàn bộ payload webhook, phòng khi cần dựng lại chuyện đã xảy ra. */
    rawPayload: jsonb('raw_payload'),
    receivedAt: timestamp('received_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('payment_received_provider_tx_idx').on(t.providerTxId)]
);

export type EntitlementSource = 'sepay' | 'manual';

export const entitlements = pgTable(
  'entitlement',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    packageId: text('package_id').notNull(),
    source: text('source').$type<EntitlementSource>().notNull(),
    orderId: text('order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    /** Ghi chú khi cấp tay: lý do, ai duyệt. Để trống với đơn tự động. */
    note: text('note'),
    grantedAt: timestamp('granted_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('entitlement_user_package_idx').on(t.userId, t.packageId),
  ]
);
