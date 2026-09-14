import 'server-only';
import type { Session } from 'next-auth';
import { getEntitlementGrantedAt, getOwnedPackageIds } from './payment/orders';
import { isAdminEmail } from './admin-allowlist';
import { devUnlockAll, env } from './env';
import { isFreshGrant, REQUIRED_PACKAGE_ID } from './access';

/**
 * Người đang xem có mở được toàn bộ giáo trình không.
 *
 * Tính MỘT LẦN cho mỗi request rồi truyền xuống, vì một trang thường cần nó ở
 * hai chỗ: cổng chặn nội dung, và các ổ khoá vẽ kèm (bản đồ `/exercises`, mục lục
 * `/library`). Mỗi chỗ tự tra là mỗi chỗ thêm một truy vấn database.
 *
 * Admin đi thẳng, để chủ sản phẩm xem lại được bài đã khoá mà không phải tự cấp
 * quyền cho mình trong database. Đây chỉ là ưu ái xem nội dung — cổng bảo mật
 * của khu /admin vẫn là requireAdmin() như cũ.
 *
 * `devUnlockAll` mở cho cả người chưa đăng nhập, nhưng chỉ khi chạy `next dev`
 * với `DEV_UNLOCK_ALL="true"` — để đọc thử bài trả phí ở máy làm việc, nơi không
 * đăng nhập Google được. Nó chỉ mở phần XEM; tick, phản hồi, kho nhạc riêng vẫn
 * cần đăng nhập như cũ.
 */
export async function viewerHasFullAccess(session: Session | null): Promise<boolean> {
  if (devUnlockAll) return true;
  if (isAdminEmail(session?.user?.email, env.ADMIN_EMAILS)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  const owned = await getOwnedPackageIds(userId);
  return owned.has(REQUIRED_PACKAGE_ID);
}

/**
 * Người đang xem có vừa được mở khoá không — dùng để báo cho họ biết.
 *
 * Trả về **mốc thời gian** chứ không phải một chữ có/không: màn hình chủ cần nó
 * làm khoá ghi nhớ "lời báo này đã tắt rồi", để lần cấp sau (đổi gói, cấp lại
 * sau khi thu hồi) vẫn báo được thay vì im luôn mãi mãi.
 *
 * Admin không lọt vào đây: `viewerHasFullAccess` cho họ đi thẳng bằng
 * `ADMIN_EMAILS` mà không có dòng nào trong `entitlement`, nên chủ sản phẩm
 * không phải xem lời chúc mừng chính mình mỗi lần mở app.
 */
export async function viewerFreshGrantAt(session: Session | null): Promise<Date | null> {
  const userId = session?.user?.id;
  if (!userId) return null;

  const grantedAt = await getEntitlementGrantedAt(userId, REQUIRED_PACKAGE_ID);
  return isFreshGrant({ grantedAt, now: new Date() }) ? grantedAt : null;
}
