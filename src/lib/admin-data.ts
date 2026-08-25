import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  entitlements,
  lessonCompletions,
  orders,
  payments,
  users,
} from '@/db/schema';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  lessonsDone: number;
  packages: string[];
}

/**
 * Danh sách người học kèm số bài đã tick và các gói đang sở hữu.
 *
 * Gộp bằng hai truy vấn con thay vì join thẳng rồi đếm ở JS: số người học sẽ
 * tăng dần, còn cách này giữ mỗi người đúng một dòng dù họ có bao nhiêu bài.
 */
export async function listUsers(limit = 200): Promise<AdminUserRow[]> {
  const lessonCounts = db
    .select({
      userId: lessonCompletions.userId,
      total: sql<number>`count(*)::int`.as('total'),
    })
    .from(lessonCompletions)
    .groupBy(lessonCompletions.userId)
    .as('lesson_counts');

  const owned = db
    .select({
      userId: entitlements.userId,
      packages: sql<string[]>`array_agg(${entitlements.packageId})`.as('packages'),
    })
    .from(entitlements)
    .groupBy(entitlements.userId)
    .as('owned');

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      lessonsDone: sql<number>`coalesce(${lessonCounts.total}, 0)`,
      packages: sql<string[] | null>`${owned.packages}`,
    })
    .from(users)
    .leftJoin(lessonCounts, eq(lessonCounts.userId, users.id))
    .leftJoin(owned, eq(owned.userId, users.id))
    .orderBy(users.email)
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    lessonsDone: Number(r.lessonsDone) || 0,
    packages: r.packages ?? [],
  }));
}

export interface AdminPaymentRow {
  id: string;
  providerTxId: string;
  amountVnd: number;
  rawContent: string | null;
  receivedAt: Date;
  orderId: string | null;
  orderStatus: string | null;
  orderAmountVnd: number | null;
  orderTransferCode: string | null;
  buyerEmail: string | null;
}

/**
 * Giao dịch đã nhận, mới nhất trước.
 *
 * Kèm thông tin đơn để nhìn ra ngay ca nào cần xử lý tay — thứ mà hiện chỉ nằm
 * trong log của Vercel.
 */
export async function listPayments(limit = 100): Promise<AdminPaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      providerTxId: payments.providerTxId,
      amountVnd: payments.amountVnd,
      rawContent: payments.rawContent,
      receivedAt: payments.receivedAt,
      orderId: payments.orderId,
      orderStatus: orders.status,
      orderAmountVnd: orders.amountVnd,
      orderTransferCode: orders.transferCode,
      buyerEmail: users.email,
    })
    .from(payments)
    .leftJoin(orders, eq(orders.id, payments.orderId))
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(payments.receivedAt))
    .limit(limit);

  return rows;
}

/** Lý do một giao dịch cần người nhìn tới, hoặc null nếu đã xong xuôi. */
export function needsAttention(row: AdminPaymentRow): string | null {
  if (!row.orderId) {
    return 'Không gắn được vào đơn nào — nhiều khả năng người chuyển quên ghi mã.';
  }
  if (row.orderAmountVnd !== null && row.amountVnd < row.orderAmountVnd) {
    return 'Chuyển thiếu tiền, chưa cấp quyền.';
  }
  if (row.orderStatus === 'paid' && row.orderAmountVnd !== null && row.amountVnd > row.orderAmountVnd) {
    return 'Chuyển dư so với giá đơn — cân nhắc hoàn lại phần thừa.';
  }
  return null;
}

export interface AdminOrderRow {
  id: string;
  transferCode: string;
  packageId: string;
  amountVnd: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  buyerEmail: string | null;
}

export async function listOrders(limit = 100): Promise<AdminOrderRow[]> {
  return db
    .select({
      id: orders.id,
      transferCode: orders.transferCode,
      packageId: orders.packageId,
      amountVnd: orders.amountVnd,
      status: orders.status,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      buyerEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}
