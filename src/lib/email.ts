import 'server-only';
import { env } from './env';
import { diaChiGuiThu } from './env-schema';
import type { EmailMessage } from './email-message';

/**
 * Gửi thư đi, qua Resend.
 *
 * **Chọn Resend chứ không phải SMTP** vì đây là một lời gọi HTTP bình thường:
 * không mở cổng TCP nào, nên chạy được trên hàm serverless của Vercel mà không
 * phải chờ kết nối. Chuyển tiếp thư ở `rehover.io` (Cloudflare Email Routing)
 * chỉ có chiều NHẬN, không gửi được — xem mục 8 của
 * `docs/_internal/ke-hoach-beta.md`.
 *
 * **Hàm này không bao giờ ném lỗi.** Nơi gọi nó là hành động cấp quyền cho
 * người học: quyền đã ghi vào database rồi thì một lá thư không gửi được không
 * được phép làm hỏng việc đó, cũng không được phép làm admin tưởng là cấp
 * trượt rồi bấm cấp lại. Thay vào đó nó trả về lý do để màn hình quản trị nói
 * thẳng "chưa gửi được thư, nhắn tay cho họ".
 */

export interface SendEmailResult {
  ok: boolean;
  /** Vì sao không gửi được — viết cho admin đọc ngay trên màn hình, không phải mã lỗi. */
  reason?: string;
}

/** Quá giờ này thì bỏ cuộc: admin đang đứng chờ màn hình quản trị trả lời. */
const HET_GIO_MS = 10_000;

export async function sendEmail(to: string, message: EmailMessage): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, reason: 'chưa khai RESEND_API_KEY nên app không gửi thư' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: diaChiGuiThu(env.EMAIL_FROM),
        to: [to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(HET_GIO_MS),
    });

    if (res.ok) return { ok: true };

    // Resend trả lỗi dưới dạng JSON có `message`; đọc được thì đưa nguyên văn
    // cho admin, vì lỗi hay gặp nhất là "tên miền chưa xác minh" — câu đó tự
    // nó đã nói phải đi làm gì, còn mã 403 thì không.
    const body: unknown = await res.json().catch(() => null);
    const chiTiet =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `mã lỗi ${res.status}`;
    return { ok: false, reason: chiTiet };
  } catch (err) {
    const laHetGio = err instanceof Error && err.name === 'TimeoutError';
    return { ok: false, reason: laHetGio ? 'dịch vụ gửi thư không trả lời' : 'không gọi được dịch vụ gửi thư' };
  }
}
