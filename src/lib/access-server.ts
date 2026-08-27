import 'server-only';
import type { Session } from 'next-auth';
import { getOwnedPackageIds } from './payment/orders';
import { isAdminEmail } from './admin-allowlist';
import { env } from './env';
import { REQUIRED_PACKAGE_ID } from './access';

/**
 * Người đang xem có mở được toàn bộ giáo trình không.
 *
 * Tính MỘT LẦN cho mỗi request rồi truyền xuống, vì kết quả dùng ở hai nơi:
 * nội dung bài, và ổ khoá trên thanh bên. Mỗi chỗ tự tra là mỗi chỗ thêm một
 * truy vấn database.
 *
 * Admin đi thẳng, để chủ sản phẩm xem lại được bài đã khoá mà không phải tự cấp
 * quyền cho mình trong database. Đây chỉ là ưu ái xem nội dung — cổng bảo mật
 * của khu /admin vẫn là requireAdmin() như cũ.
 */
export async function viewerHasFullAccess(session: Session | null): Promise<boolean> {
  if (isAdminEmail(session?.user?.email, env.ADMIN_EMAILS)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  const owned = await getOwnedPackageIds(userId);
  return owned.has(REQUIRED_PACKAGE_ID);
}
