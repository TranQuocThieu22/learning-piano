import 'server-only';
import { auth } from '@/auth';
import { isAdminEmail } from './admin-allowlist';

/**
 * Định nghĩa DUY NHẤT của "người này có phải admin không".
 *
 * Mọi trang admin và mọi Server Action admin đều phải đi qua đây. Đặc biệt là
 * Server Action: chặn ở giao diện **không** chặn được hành động, vì Server Action
 * là một endpoint HTTP thật — ai biết id của nó đều gọi được, kể cả khi không bao
 * giờ nhìn thấy nút bấm. Mỗi action phải tự kiểm tra lại, không dựa vào layout.
 */
export async function getAdminSession() {
  const session = await auth();
  const email = session?.user?.email;

  if (!isAdminEmail(email, process.env.ADMIN_EMAILS)) return null;
  return session;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export class NotAdminError extends Error {
  constructor() {
    super('Không có quyền quản trị.');
  }
}

/** Dùng đầu mỗi Server Action admin. Ném lỗi nếu người gọi không phải admin. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new NotAdminError();
  return session;
}
