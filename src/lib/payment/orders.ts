import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { entitlements, orders, payments } from '@/db/schema';
import { findPackage } from '@/lib/packages';
import { generateTransferCode } from './transfer-code';
import type { OrderSnapshot, ReconcileDecision, SePayWebhookPayload } from './reconcile';

/** Số lần thử sinh mã khi đụng mã đã tồn tại. Xác suất đụng cực thấp nên 5 là thừa. */
const CODE_ATTEMPTS = 5;

export class PaymentError extends Error {}

/**
 * Tạo đơn mới cho người học, kèm mã chuyển khoản chưa ai dùng.
 *
 * Giá lấy từ danh mục tại thời điểm gọi và **ghi cứng vào đơn**, để sau này tăng
 * giá theo mục 5 của tài liệu định hướng thì đơn cũ vẫn giữ giá cũ.
 */
export async function createOrder(userId: string, packageId: string) {
  const pkg = findPackage(packageId);
  if (!pkg) throw new PaymentError(`Không có gói "${packageId}"`);

  // Đã sở hữu rồi thì đừng để họ trả tiền lần nữa.
  if (await hasEntitlement(userId, packageId)) {
    throw new PaymentError('Bạn đã sở hữu gói này rồi.');
  }

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const transferCode = generateTransferCode();
    const [row] = await db
      .insert(orders)
      .values({
        userId,
        packageId: pkg.id,
        amountVnd: pkg.priceVnd,
        transferCode,
      })
      .onConflictDoNothing({ target: orders.transferCode })
      .returning();

    if (row) return row;
  }

  throw new PaymentError('Không sinh được mã chuyển khoản, thử lại giúp mình.');
}

export async function findOrderByTransferCode(
  transferCode: string
): Promise<OrderSnapshot | null> {
  const [row] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      packageId: orders.packageId,
      amountVnd: orders.amountVnd,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.transferCode, transferCode))
    .limit(1);

  return row ?? null;
}

export async function getOrder(orderId: string, userId: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function hasEntitlement(userId: string, packageId: string) {
  const rows = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(
      and(eq(entitlements.userId, userId), eq(entitlements.packageId, packageId))
    )
    .limit(1);

  return rows.length > 0;
}

/** Các gói người học đang sở hữu. */
export async function getOwnedPackageIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ packageId: entitlements.packageId })
    .from(entitlements)
    .where(eq(entitlements.userId, userId));

  return new Set(rows.map((r) => r.packageId));
}

/**
 * Cấp quyền truy cập. Dùng chung cho cả đường tự động (webhook) lẫn đường tay
 * (scripts/grant-access.mjs), nên chỗ nào cũng chỉ có một định nghĩa "sở hữu".
 *
 * `onConflictDoNothing` khiến hàm này gọi lại bao nhiêu lần cũng không sao.
 */
export async function grantEntitlement(params: {
  userId: string;
  packageId: string;
  source: 'sepay' | 'manual';
  orderId?: string | null;
  note?: string | null;
}) {
  await db
    .insert(entitlements)
    .values({
      userId: params.userId,
      packageId: params.packageId,
      source: params.source,
      orderId: params.orderId ?? null,
      note: params.note ?? null,
    })
    .onConflictDoNothing({
      target: [entitlements.userId, entitlements.packageId],
    });
}

/**
 * Ghi nhận một giao dịch nhận được và áp dụng quyết định đối soát.
 *
 * Trả về `false` khi giao dịch này đã được xử lý trước đó — SePay gửi lại tối đa
 * 7 lần nên trường hợp này là bình thường, không phải lỗi.
 *
 * Thứ tự quan trọng: **ghi giao dịch trước, cấp quyền sau**. Ràng buộc duy nhất
 * trên `providerTxId` chính là cửa chống trùng; nếu cấp quyền trước rồi mới ghi
 * thì một lần gửi lại có thể lọt qua trước khi bản ghi kịp tồn tại.
 */
export async function recordPayment(
  payload: SePayWebhookPayload,
  decision: ReconcileDecision
): Promise<boolean> {
  const orderId =
    decision.kind === 'ignore' ? null : decision.orderId;

  const [inserted] = await db
    .insert(payments)
    .values({
      providerTxId: String(payload.id),
      orderId,
      amountVnd: Number(payload.transferAmount) || 0,
      rawContent: payload.content ?? payload.description ?? null,
      rawPayload: payload,
    })
    .onConflictDoNothing({ target: payments.providerTxId })
    .returning({ id: payments.id });

  // Không chèn được nghĩa là đã có bản ghi cùng providerTxId — lần gửi lại.
  if (!inserted) return false;

  if (decision.kind === 'grant') {
    await db
      .update(orders)
      .set({ status: 'paid', paidAt: new Date() })
      .where(and(eq(orders.id, decision.orderId), eq(orders.status, 'pending')));

    await grantEntitlement({
      userId: decision.userId,
      packageId: decision.packageId,
      source: 'sepay',
      orderId: decision.orderId,
    });
  }

  return true;
}
