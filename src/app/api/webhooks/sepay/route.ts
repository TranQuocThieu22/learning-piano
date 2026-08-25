import { createHash, timingSafeEqual } from 'node:crypto';
import { decideReconcile, findTransferCode } from '@/lib/payment/reconcile';
import type { SePayWebhookPayload } from '@/lib/payment/reconcile';
import { findOrderByTransferCode, recordPayment } from '@/lib/payment/orders';

/**
 * Nơi SePay báo về mỗi khi có tiền vào tài khoản.
 *
 * Đây là endpoint công khai duy nhất có thể cấp quyền truy cập, nên toàn bộ giá
 * trị bảo mật nằm ở việc so khớp API key bên dưới. Không có nó thì bất kỳ ai
 * biết đường dẫn cũng tự cấp cho mình gói 399k bằng một lệnh curl.
 *
 * Cấu hình phía SePay: Webhooks > thêm webhook, kiểu xác thực API Key, dán đúng
 * chuỗi trong biến môi trường SEPAY_WEBHOOK_API_KEY.
 */

/** So sánh không phụ thuộc thời gian, tránh dò từng ký tự của khoá. */
function secretsMatch(a: string, b: string): boolean {
  // Băm trước để hai vế luôn cùng độ dài — timingSafeEqual ném lỗi nếu lệch,
  // và chính việc ném lỗi đó đã làm lộ độ dài khoá.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function isAuthorised(request: Request): boolean {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expected) {
    console.error('[sepay] Thiếu SEPAY_WEBHOOK_API_KEY — từ chối mọi webhook.');
    return false;
  }

  const header = request.headers.get('authorization') ?? '';
  const prefix = 'Apikey ';
  if (!header.startsWith(prefix)) return false;

  return secretsMatch(header.slice(prefix.length).trim(), expected);
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return Response.json({ success: false }, { status: 401 });
  }

  let payload: SePayWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  if (payload?.id === undefined || payload?.id === null) {
    console.warn('[sepay] Payload không có id, bỏ qua.');
    return Response.json({ success: false }, { status: 400 });
  }

  const code = findTransferCode(payload);
  const order = code ? await findOrderByTransferCode(code) : null;
  const decision = decideReconcile(payload, order);

  try {
    const isNew = await recordPayment(payload, decision);
    if (!isNew) {
      // Lần gửi lại của một giao dịch đã xử lý. Vẫn phải trả thành công, nếu
      // không SePay sẽ tiếp tục thử lại đủ 7 lần.
      return Response.json({ success: true });
    }
  } catch (err) {
    // Trả lỗi để SePay thử lại — thà xử lý muộn còn hơn mất giao dịch.
    console.error('[sepay] Lỗi khi ghi giao dịch:', err);
    return Response.json({ success: false }, { status: 500 });
  }

  // Những trường hợp cần người nhìn tới. Tiền đã vào tài khoản và đã được ghi
  // nhật ký, chỉ là chưa tự động cấp quyền được.
  if (decision.kind === 'underpaid') {
    console.warn(
      `[sepay] Chuyển thiếu cho đơn ${decision.orderId}: ` +
        `nhận ${decision.receivedVnd}đ, cần ${decision.expectedVnd}đ. Cần xử lý tay.`
    );
  } else if (decision.kind === 'already-paid') {
    console.warn(
      `[sepay] Đơn ${decision.orderId} đã trả rồi mà lại nhận thêm tiền. ` +
        'Nhiều khả năng khách chuyển hai lần, cần xem để hoàn lại.'
    );
  } else if (decision.kind === 'ignore' && decision.reason !== 'not-inbound') {
    console.warn(
      `[sepay] Tiền vào nhưng không gắn được vào đơn nào (${decision.reason}). Cần xử lý tay.`
    );
  }

  return Response.json({ success: true });
}
