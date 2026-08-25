import type { OrderStatus } from '@/db/schema';
import { extractTransferCode } from './transfer-code';

/**
 * Payload SePay gửi tới webhook. Xem https://docs.sepay.vn/tich-hop-webhooks.html
 *
 * Khai báo lỏng ở những trường ta không dùng tới, vì đây là dữ liệu từ bên ngoài
 * — không được phép giả định nó luôn đủ và đúng kiểu.
 */
export interface SePayWebhookPayload {
  id: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string | null;
  /** "in" là tiền vào, "out" là tiền ra. Chỉ quan tâm tiền vào. */
  transferType?: string;
  description?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
}

export interface OrderSnapshot {
  id: string;
  userId: string;
  packageId: string;
  amountVnd: number;
  status: OrderStatus;
}

export type ReconcileDecision =
  /** Không làm gì với quyền truy cập, nhưng giao dịch vẫn được ghi nhật ký. */
  | { kind: 'ignore'; reason: 'not-inbound' | 'no-transfer-code' | 'order-not-found' }
  /** Đơn đã trả rồi — nhiều khả năng khách chuyển nhầm hai lần, cần người xem. */
  | { kind: 'already-paid'; orderId: string }
  /** Chuyển thiếu tiền. Không cấp quyền, để người xử lý tay. */
  | { kind: 'underpaid'; orderId: string; expectedVnd: number; receivedVnd: number }
  | {
      kind: 'grant';
      orderId: string;
      userId: string;
      packageId: string;
      receivedVnd: number;
    };

/** Mã chuyển khoản nằm ở `content`, nhưng có ngân hàng đẩy sang `description`. */
export function findTransferCode(payload: SePayWebhookPayload): string | null {
  return (
    extractTransferCode(payload.content) ?? extractTransferCode(payload.description)
  );
}

/**
 * Quyết định một giao dịch nhận được có ý nghĩa gì với đơn hàng.
 *
 * Thuần, không chạm database, để kiểm thử được mọi nhánh — đây là chỗ sai sẽ
 * mất tiền thật hoặc cho không quyền truy cập. Việc tra đơn theo mã do phía gọi
 * làm, rồi truyền `order` vào (null nếu không tìm thấy).
 */
export function decideReconcile(
  payload: SePayWebhookPayload,
  order: OrderSnapshot | null
): ReconcileDecision {
  // Tiền ra khỏi tài khoản thì không liên quan gì tới việc bán hàng.
  if (payload.transferType !== 'in') {
    return { kind: 'ignore', reason: 'not-inbound' };
  }

  if (findTransferCode(payload) === null) {
    return { kind: 'ignore', reason: 'no-transfer-code' };
  }

  if (!order) {
    return { kind: 'ignore', reason: 'order-not-found' };
  }

  if (order.status === 'paid') {
    return { kind: 'already-paid', orderId: order.id };
  }

  const receivedVnd = Number(payload.transferAmount);
  if (!Number.isFinite(receivedVnd) || receivedVnd < order.amountVnd) {
    // Cố tình không có biên độ châm chước. Người chuyển chịu phí ngân hàng nên
    // số tiền phải khớp; nới ra là mở đường cho việc chuyển 10k lấy quyền 399k.
    return {
      kind: 'underpaid',
      orderId: order.id,
      expectedVnd: order.amountVnd,
      receivedVnd: Number.isFinite(receivedVnd) ? receivedVnd : 0,
    };
  }

  // Chuyển dư thì vẫn cấp quyền — tiền thừa là chuyện xử lý tay, không phải lý
  // do bắt người đã trả đủ phải chờ.
  return {
    kind: 'grant',
    orderId: order.id,
    userId: order.userId,
    packageId: order.packageId,
    receivedVnd,
  };
}
