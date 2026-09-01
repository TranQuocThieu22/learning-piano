import { notFound } from 'next/navigation';
import { Container, Group, Title } from '@mantine/core';
import { NavAnchor } from '@/components/NavAnchor';
import { isCurrentUserAdmin } from '@/lib/admin';

/**
 * Cửa chặn chung cho mọi trang dưới /admin.
 *
 * Trả `notFound()` chứ không phải trang "bạn không có quyền": người lạ dò đường
 * dẫn sẽ thấy đúng như mọi đường dẫn không tồn tại khác, không xác nhận cho họ
 * biết ở đây có khu quản trị.
 *
 * Lưu ý: layout chặn được việc NHÌN THẤY trang, không chặn được việc GỌI Server
 * Action. Mỗi action trong admin-actions.ts phải tự gọi requireAdmin().
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isCurrentUserAdmin())) notFound();

  return (
    <Container size="xl" py="lg">
      <Group justify="space-between" mb="lg" wrap="wrap">
        <Title order={2}>Quản trị</Title>
        <Group gap="md">
          <NavAnchor href="/admin" size="sm" c="blue">
            Người học
          </NavAnchor>
          <NavAnchor href="/admin/payments" size="sm" c="blue">
            Thanh toán
          </NavAnchor>
          <NavAnchor href="/admin/docs" size="sm" c="blue">
            Tài liệu
          </NavAnchor>
          <NavAnchor href="/" size="sm" c="dimmed">
            Về trang học
          </NavAnchor>
        </Group>
      </Group>
      {children}
    </Container>
  );
}
