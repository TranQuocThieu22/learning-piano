'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { idSchema } from '@/lib/validation';
import { createOrder, hasEntitlement, PaymentError } from './orders';

const createOrderInput = z.object({ packageId: idSchema });

/**
 * Tạo đơn cho người đang đăng nhập rồi chuyển sang trang hướng dẫn chuyển khoản.
 *
 * `requireAdmin`-style kiểm tra ở đây là kiểm ĐĂNG NHẬP: đơn phải gắn với một
 * tài khoản, vì webhook SePay sau này cấp quyền theo `userId` của đơn. Không có
 * tài khoản thì tiền vào cũng không biết mở khoá cho ai.
 */
export async function createOrderAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/checkout?error=not-signed-in');

  const input = createOrderInput.safeParse({
    packageId: formData.get('packageId'),
  });
  if (!input.success) redirect('/checkout?error=invalid-package');

  if (await hasEntitlement(userId, input.data.packageId)) {
    redirect('/checkout?error=already-owned');
  }

  let orderId: string;
  try {
    const order = await createOrder(userId, input.data.packageId);
    orderId = order.id;
  } catch (err) {
    if (err instanceof PaymentError) redirect('/checkout?error=order-failed');
    throw err;
  }

  // redirect() ném lỗi điều khiển luồng nên phải nằm NGOÀI khối try ở trên,
  // không thì chính nó bị bắt và nuốt mất.
  redirect(`/checkout/${orderId}`);
}
