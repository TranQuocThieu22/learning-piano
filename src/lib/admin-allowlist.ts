/**
 * Quyết định ai là quản trị viên.
 *
 * Cố ý đọc từ biến môi trường chứ không từ database: kẻ nào chiếm được quyền ghi
 * vào database vẫn không tự phong mình làm admin được, vì danh sách nằm ở chỗ
 * khác. Đổi danh sách phải vào Vercel và deploy lại — chậm, nhưng đó là điểm mạnh
 * chứ không phải điểm yếu với một cửa cấp được quyền truy cập trả phí.
 *
 * Tách riêng phần thuần này khỏi `admin.ts` (có 'server-only') để kiểm thử được.
 */

/**
 * Tách chuỗi ADMIN_EMAILS thành tập email đã chuẩn hoá.
 *
 * Chấp nhận ngăn cách bằng dấu phẩy, chấm phẩy, khoảng trắng hay xuống dòng, vì
 * dán từ Vercel vào rất dễ lẫn. Chuẩn hoá về chữ thường và bỏ khoảng trắng thừa.
 */
export function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();

  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0)
  );
}

/**
 * Email này có phải quản trị viên không.
 *
 * Mặc định **từ chối**: không cấu hình ADMIN_EMAILS thì không ai là admin. Quên
 * đặt biến môi trường phải dẫn tới "không ai vào được", tuyệt đối không được
 * dẫn tới "ai cũng vào được".
 */
export function isAdminEmail(
  email: string | undefined | null,
  raw: string | undefined | null
): boolean {
  if (!email) return false;

  const allowed = parseAdminEmails(raw);
  if (allowed.size === 0) return false;

  return allowed.has(email.trim().toLowerCase());
}
