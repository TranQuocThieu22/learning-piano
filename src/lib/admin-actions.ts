'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { entitlements, users } from '@/db/schema';
import { requireAdmin } from './admin';
import { findPackage } from './packages';
import { grantEntitlement } from './payment/orders';
import { buildAccessGrantedEmail } from './email-message';
import { sendEmail } from './email';
import { MESSENGER_TRANG } from './contact-links';
import { SITE_URL } from './site';
import { idSchema, noteSchema } from './validation';

const grantAccessInput = z.object({
  userId: idSchema,
  packageId: idSchema,
  note: noteSchema,
});

const revokeAccessInput = z.object({
  userId: idSchema,
  packageId: idSchema,
});

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

/**
 * Cấp quyền truy cập bằng tay.
 *
 * `requireAdmin()` ở dòng đầu KHÔNG phải hình thức: Server Action là một endpoint
 * HTTP thật, gọi được mà không cần nhìn thấy giao diện. Việc layout đã chặn
 * người lạ không giúp gì cho hàm này.
 */
export async function grantAccessAction(
  userId: string,
  packageId: string,
  note: string
): Promise<AdminActionResult> {
  const session = await requireAdmin();

  const input = grantAccessInput.safeParse({ userId, packageId, note });
  if (!input.success) {
    return { ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' };
  }

  const pkg = findPackage(input.data.packageId);
  if (!pkg) return { ok: false, message: `Không có gói "${input.data.packageId}".` };

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, input.data.userId))
    .limit(1);

  if (!user) return { ok: false, message: 'Không tìm thấy người học này.' };

  await grantEntitlement({
    userId: user.id,
    packageId: pkg.id,
    source: 'manual',
    // Ghi lại ai cấp: entitlement bảng này không có cột riêng cho người thao tác,
    // nên nhét vào ghi chú để sau còn truy được.
    note: `${input.data.note || 'Cấp tay từ trang quản trị'} — bởi ${session.user?.email}`,
  });

  revalidatePath('/admin');

  // Báo tin cho người học NGAY, và cố ý gửi sau khi quyền đã ghi xong.
  //
  // Trước lá thư này, người điền form được hứa mở khoá "trong vòng 24 giờ" rồi
  // phải tự mở app ra đoán xem đã được mở chưa — mục 2 của
  // docs/_internal/ke-hoach-beta.md gọi quãng ngồi đợi đó là chỗ người ta rơi
  // mất. Thẻ AccessGrantedNotice chỉ lo được phần người tự quay lại.
  //
  // Thư hỏng thì KHÔNG coi là cấp trượt: quyền đã nằm trong database, báo đỏ ở
  // đây chỉ khiến admin bấm cấp lại một lần nữa cho cùng một người. Thay vào
  // đó nói thẳng là phải nhắn tay — đúng việc vẫn đang làm trước khi có thư.
  //
  // Người ĐÃ có gói thì `grantEntitlement` không ghi gì (onConflictDoNothing)
  // nhưng thư vẫn gửi — cố ý để nguyên như vậy. Đó là đường duy nhất báo tin
  // cho những người được cấp trước khi có lá thư này; đổi lại, bấm hai lần là
  // họ nhận hai thư, nên đừng bấm cho vui.
  const thu = await sendEmail(
    user.email,
    buildAccessGrantedEmail({
      tenNguoiHoc: user.name,
      tenGoi: pkg.name,
      linkApp: SITE_URL,
      linkMessenger: MESSENGER_TRANG,
    })
  );

  return {
    ok: true,
    message: thu.ok
      ? `Đã cấp "${pkg.name}" cho ${user.email} và gửi thư báo.`
      : `Đã cấp "${pkg.name}" cho ${user.email}, nhưng CHƯA gửi được thư (${thu.reason}) — nhắn tay cho họ.`,
  };
}

/**
 * Thu hồi quyền truy cập, dùng khi hoàn tiền.
 *
 * Chỉ xoá dòng quyền truy cập. Dấu vết tiền vẫn còn nguyên ở `payment_received`
 * và `payment_order` — cố ý không đụng tới hai bảng đó, vì chúng là sổ kế toán,
 * còn quyền truy cập chỉ là trạng thái hiện tại.
 */
export async function revokeAccessAction(
  userId: string,
  packageId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const input = revokeAccessInput.safeParse({ userId, packageId });
  if (!input.success) {
    return { ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' };
  }

  const deleted = await db
    .delete(entitlements)
    .where(
      and(
        eq(entitlements.userId, input.data.userId),
        eq(entitlements.packageId, input.data.packageId)
      )
    )
    .returning({ id: entitlements.id });

  revalidatePath('/admin');

  if (deleted.length === 0) {
    return { ok: false, message: 'Người học này vốn không có gói đó.' };
  }
  return { ok: true, message: `Đã thu hồi gói "${input.data.packageId}".` };
}
