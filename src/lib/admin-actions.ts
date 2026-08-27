'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { entitlements, users } from '@/db/schema';
import { requireAdmin } from './admin';
import { findPackage } from './packages';
import { grantEntitlement } from './payment/orders';
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
    .select({ id: users.id, email: users.email })
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
  return { ok: true, message: `Đã cấp "${pkg.name}" cho ${user.email}.` };
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
