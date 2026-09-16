/**
 * Dựng nội dung các lá thư app gửi đi. Phần THUẦN — không chạm mạng, không đọc
 * biến môi trường, nên test được từng chữ sẽ tới hộp thư người học.
 *
 * Tách khỏi `email.ts` (có `import 'server-only'`) vì cùng lý do
 * `env-schema.ts` tách khỏi `env.ts`: vitest không nạp được module có
 * 'server-only', kể cả gián tiếp (bẫy đã ghi ở `docs/_internal/bay-ky-thuat.md`).
 */

export interface EmailMessage {
  subject: string;
  /** Bản chữ trơn — thư nào cũng phải có, không chỉ để lịch sự: thiếu nó thì bộ lọc thư rác chấm điểm nặng hơn hẳn. */
  text: string;
  html: string;
}

export interface AccessGrantedEmailInput {
  /** Tên lấy từ tài khoản Google. Thiếu thì xưng "bạn" chứ không để trống. */
  tenNguoiHoc: string | null;
  tenGoi: string;
  linkApp: string;
  linkMessenger: string;
}

/** Ký tự nào vào giữa HTML cũng phải qua đây — tên người học là chuỗi do người ngoài đặt. */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Câu hỏi xin người học nhắn về.
 *
 * **Cố ý là MỘT câu hỏi cụ thể, không phải lời mời chung chung.** Hai lý do,
 * và lý do thứ hai mới là lý do chính:
 *
 * 1. "Có gì cứ nhắn nhé" thì gần như không ai nhắn; một câu hỏi trả lời được
 *    trong năm giây thì có người trả lời.
 * 2. **Trang Facebook không nhắn tin trước cho ai được** — Meta chỉ cho Trang
 *    trả lời trong 24 giờ sau khi người dùng nhắn trước. Nên câu trả lời của
 *    họ không chỉ là một thông tin: nó là thứ duy nhất mở ra đường để chủ sản
 *    phẩm hỏi tiếp trong suốt đợt thử nghiệm.
 *
 * Chọn đúng câu hỏi "đàn nào" vì câu trả lời còn dùng được thật: đàn có cổng
 * MIDI hay không quyết định app nên mời họ nối dây hay nghe qua micro.
 */
const CAU_HOI_MO_CHUYEN = 'bạn đang tập trên cây đàn nào?';

/**
 * Thư báo đã mở khoá toàn bộ giáo trình, gửi ngay sau khi admin bấm *Cấp gói*.
 *
 * Trước lá thư này, người điền form được hứa "trong vòng 24 giờ mình mở toàn bộ
 * giáo trình cho tài khoản của bạn" (`LessonLocked`) rồi phải **tự mở app ra
 * đoán** xem đã được mở chưa — `AccessGrantedNotice` chỉ lo được phần người tự
 * quay lại. Mục 2 của `docs/_internal/ke-hoach-beta.md` gọi quãng ngồi đợi đó
 * là chỗ người ta rơi mất.
 */
export function buildAccessGrantedEmail(input: AccessGrantedEmailInput): EmailMessage {
  const ten = input.tenNguoiHoc?.trim() || 'bạn';
  const subject = 'Tài khoản của bạn đã mở khoá toàn bộ giáo trình 🎉';

  const text = [
    `Chào ${ten},`,
    '',
    `Mình vừa mở gói ${input.tenGoi} cho tài khoản này. Từ giờ bạn đọc được mọi chương và dùng được mọi mức của bài luyện nhận nốt. Quyền này gắn với tài khoản và không hết hạn.`,
    '',
    `Mở app: ${input.linkApp}`,
    '',
    `Còn một việc mình cần bạn giúp. Đợt này mình muốn đi cùng từng người chứ không chỉ mở khoá rồi thôi, nên bạn nhắn cho mình một câu trên Facebook nhé — chỉ cần trả lời: ${CAU_HOI_MO_CHUYEN}`,
    '',
    `Nhắn cho mình: ${input.linkMessenger}`,
    '',
    'Biết bạn đang có đàn gì thì mình mới biết nên chỉ bạn cho app nghe đàn qua micro hay qua dây MIDI. Và bạn thấy chỗ nào khó, cứ nhắn — mình sửa được.',
    '',
    'Chúc bạn tập vui,',
    'Piano Journey',
  ].join('\n');

  // Thư viết tay bằng HTML nội tuyến, không dùng thư viện dựng khung: Gmail và
  // Outlook cắt phần lớn CSS trong <style>, nên mọi thứ phải nằm ở thuộc tính
  // style của từng thẻ. Giữ một cột, không bảng lồng nhau — người học đọc thư
  // trên điện thoại.
  const html = `<div style="margin:0;padding:24px 16px;background:#f6f4fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2b2438;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px 24px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Chào ${escapeHtml(ten)},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Mình vừa mở gói <strong>${escapeHtml(input.tenGoi)}</strong> cho tài khoản này. Từ giờ bạn đọc được mọi chương và dùng được mọi mức của bài luyện nhận nốt. Quyền này gắn với tài khoản và không hết hạn.</p>
    <p style="margin:0 0 24px;"><a href="${input.linkApp}" style="display:inline-block;background:#7c4dff;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Mở Piano Journey</a></p>
    <hr style="border:none;border-top:1px solid #ece8f5;margin:0 0 24px;" />
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Còn một việc mình cần bạn giúp. Đợt này mình muốn đi cùng từng người chứ không chỉ mở khoá rồi thôi, nên bạn nhắn cho mình một câu trên Facebook nhé — chỉ cần trả lời: <strong>${CAU_HOI_MO_CHUYEN}</strong></p>
    <p style="margin:0 0 16px;"><a href="${input.linkMessenger}" style="display:inline-block;background:#ffffff;color:#7c4dff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 23px;border-radius:999px;border:2px solid #7c4dff;">Nhắn cho mình trên Facebook</a></p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6b6280;">Biết bạn đang có đàn gì thì mình mới biết nên chỉ bạn cho app nghe đàn qua micro hay qua dây MIDI. Và bạn thấy chỗ nào khó, cứ nhắn — mình sửa được.</p>
    <p style="margin:0;font-size:16px;line-height:1.6;">Chúc bạn tập vui,<br />Piano Journey</p>
  </div>
</div>`;

  return { subject, text, html };
}
