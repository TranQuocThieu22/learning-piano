/**
 * Mọi đường liên lạc giữa người học và chủ sản phẩm, gom về một chỗ.
 *
 * **Vì sao tách ra:** link Trang Facebook và link form đăng ký trước đây được
 * chép tay ở `LessonLocked.tsx` và `DrillLevelLocked.tsx` — hai bản sao của
 * cùng một chuỗi, đúng kiểu bản sao mà `.claude/skills/code-standards/SKILL.md`
 * xếp là cách repo này sinh lỗi nhiều nhất. Cái giá ở đây không chỉ là công sửa
 * hai chỗ: đổi Trang mà quên một chỗ thì người học vẫn nhắn vào một hộp thư
 * không ai đọc, và không có triệu chứng nào báo cho ai biết.
 */

/**
 * Mã Trang Facebook — MỌI đường dẫn bên dưới dựng từ đúng con số này.
 *
 * Đây là mã ghi ở mục 8 của `docs/legal/terms.md`, tức là con số đã in ra cho
 * người học từ trước.
 *
 * **Đừng hoảng khi thấy Graph API trả về một mã khác** (`1282536924939717`):
 * Trang lập theo *New Pages Experience* mang hai mã, một cho đường dẫn web và
 * một cho Graph API, nhưng vẫn là **một Trang**. Đã kiểm 16/09/2026 —
 * `m.me/61593938880341` mở ra đúng Trang đang đăng bài. Chuyện này ghi thành
 * bẫy 46 ở `docs/_internal/bay-ky-thuat.md` vì nó đã suýt dẫn tới việc đi sửa
 * một thứ không hỏng.
 *
 * Đổi con số này thì kiểm lại đúng cách đó: mở `MESSENGER_TRANG` trên điện
 * thoại, xem Messenger dừng ở Trang nào và ảnh đại diện có đúng không — tài
 * khoản đang quản trị **hai** Trang trùng tên.
 */
export const FACEBOOK_PAGE_ID = '61593938880341';

/** Trang Facebook — chỗ đọc bài đăng. */
export const TRANG_FACEBOOK = `https://www.facebook.com/profile.php?id=${FACEBOOK_PAGE_ID}`;

/**
 * Mở thẳng Messenger với Trang, khung soạn tin sẵn sàng.
 *
 * **Đây là đường DUY NHẤT để chủ sản phẩm nhắn được cho người học.** Meta chỉ
 * cho Trang *trả lời* trong 24 giờ sau khi người dùng nhắn trước, chứ Trang
 * không mở đầu một cuộc trò chuyện được. Nên mọi chỗ dùng link này đều phải xin
 * người học nhắn câu đầu tiên, và xin bằng **một câu hỏi cụ thể** — lời mời
 * chung chung ("có gì cứ nhắn nhé") gần như không ai trả lời.
 */
export const MESSENGER_TRANG = `https://m.me/${FACEBOOK_PAGE_ID}`;

/**
 * Form đăng ký đợt thử nghiệm.
 *
 * Đặt trước Trang Facebook ở màn hình bài khoá vì nhắn tin là một bước CHỜ:
 * người học phải mở Messenger, nghĩ xem viết gì, rồi đợi tới lúc có người rảnh
 * trả lời. Form thì họ tự làm xong trong ba mươi giây.
 *
 * Gỡ khi đóng đợt beta — xem mục "Còn treo" của
 * `docs/_internal/lam-viec-hang-ngay.md`.
 */
export const FORM_DANG_KY = 'https://forms.gle/aSPhbC82fRXPdciK6';
