import { Text } from '@mantine/core';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { listUsers } from '@/lib/admin-data';
import { PACKAGES } from '@/lib/packages';

export const metadata = { title: 'Quản trị — Người học' };

/** Luôn đọc dữ liệu mới: trang quản trị mà hiện số liệu cũ thì vô dụng. */
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <>
      <Text c="dimmed" size="sm" mb="md">
        {users.length} người học đã đăng nhập ít nhất một lần.
      </Text>
      <AdminUserTable users={users} packages={PACKAGES} />
    </>
  );
}
