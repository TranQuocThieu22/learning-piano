import { z } from 'zod';
import type { OrderStatus } from '@/db/schema';
import { extractTransferCode } from './transfer-code';

/**
 * Payload SePay gửi tới webhook. Xem https://docs.sepay.vn/tich-hop-webhooks.html
 *
 * Đây là dữ liệu từ bên ngoài — không được phép giả định nó đủ và đúng kiểu, nên
 * schema này là thứ duy nhất được phép biến `unknown` thành kiểu dùng được.
 *
 * Ba lựa chọn có chủ ý:
 *
 * 1. `looseObject` chứ không phải object thường: field lạ được GIỮ NGUYÊN, vì cả
 *    payload được lưu vào cột `raw_payload` để sau còn dựng lại chuyện đã xảy ra.
 *    Cắt bớt field lạ là tự huỷ bằng chứng khi có tranh chấp.
 * 2. Chỉ `id` là bắt buộc. Nó là khoá chống trùng, không có thì không xử lý nổi.
 *    Siết chặt những field còn lại nghe có vẻ an toàn hơn, nhưng SePay đổi format
 *    là mọi giao dịch bị từ chối — mất tiền thật, tệ hơn hẳn.
 * 3. `transferAmount` nhận cả số lẫn chuỗi vì cổng thanh toán hay gửi số dưới
 *    dạng chuỗi. Việc quy đổi vẫn do decideReconcile làm như cũ.
 */
export const sePayWebhookPayloadSchema = z.looseObject({
  id: z.union([z.number(), z.string()]),
  gateway: z.string().optional(),
  transactionDate: z.string().optional(),
  accountNumber: z.string().optional(),
  subAccount: z.string().nullish(),
  code: z.string().nullish(),
  content: z.string().nullish(),
  /** "in" là tiền vào, "out" là tiền ra. Chỉ quan tâm tiền vào. */
  transferType: z.string().optional(),
  description: z.string().optional(),
  transferAmount: z.union([z.number(), z.string()]).optional(),
  accumulated: z.union([z.number(), z.string()]).optional(),
  referenceCode: z.string().optional(),
});

export type SePayWebhookPayload = z.infer<typeof sePayWebhookPayloadSchema>;

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
