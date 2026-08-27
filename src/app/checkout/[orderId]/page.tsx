import { Alert, Badge, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { NavAnchor } from '@/components/NavAnchor';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { viewerHasFullAccess } from '@/lib/access-server';
import { findPackage } from '@/lib/packages';
import { getOrder } from '@/lib/payment/orders';
import { buildVietQrUrl, formatVnd, getBankAccount } from '@/lib/payment/vietqr';

/**
 * Hướng dẫn chuyển khoản cho một đơn.
 *
 * Luôn hiện số tài khoản, số tiền và mã chuyển khoản DƯỚI DẠNG CHỮ bên cạnh mã
 * QR — ảnh QR do một tên miền ngoài dựng, hỏng lúc nào không biết, mà nhiều
 * người vẫn quen nhập tay thay vì quét.
 */
export default async function DonHangPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();

  // Chưa đăng nhập thì coi như không có đơn nào — getOrder cũng lọc theo userId
  // nên không ai xem được đơn của người khác.
  if (!session?.user?.id) notFound();

  const order = await getOrder(orderId, session.user.id);
  if (!order) notFound();

  const allFiles = getAllMarkdownFiles();
  const completedSlugs = await getCompletedLessonSlugs(session.user.id);
  const hasFullAccess = await viewerHasFullAccess(session);

  const pkg = findPackage(order.packageId);
  const account = getBankAccount();
  const paid = order.status === 'paid';

  return (
    <AppLayout files={allFiles} user={session.user} completedSlugs={completedSlugs} hasFullAccess={hasFullAccess}>
      <Container size="sm" px={0}>
        <Group justify="space-between" align="center" mb="xs" wrap="wrap">
          <Title order={2}>Đơn hàng</Title>
          <Badge color={paid ? 'green' : 'yellow'} variant="light" size="lg">
            {paid ? 'Đã thanh toán' : 'Chờ chuyển khoản'}
          </Badge>
        </Group>

        <Text c="dimmed" mb="lg">
          {pkg?.name ?? order.packageId} — {formatVnd(order.amountVnd)}
        </Text>

        {paid ? (
          <Alert color="green" variant="light">
            Đã nhận được tiền và mở khoá xong.{' '}
            <NavAnchor href="/journal">Vào học thôi</NavAnchor>
          </Alert>
        ) : !account ? (
          <Alert color="red" variant="light">
            Chưa cấu hình tài khoản nhận tiền. Đặt SEPAY_BANK_CODE và
            SEPAY_ACCOUNT_NUMBER trong biến môi trường.
          </Alert>
        ) : (
          <Stack gap="lg">
            <Card withBorder padding="lg" radius="md">
              <Text fw={600} mb="md">Chuyển khoản theo đúng thông tin sau</Text>

              <Group align="flex-start" wrap="wrap" gap="xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildVietQrUrl({
                    account,
                    amountVnd: order.amountVnd,
                    transferCode: order.transferCode,
                  })}
                  alt={`Mã VietQR cho đơn ${order.transferCode}`}
                  width={220}
                  height={220}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />

                {/*
                  Cố ý KHÔNG dùng <Table><Table.Tr>: Mantine là client component,
                  và truy cập thuộc tính ghép như Table.Tbody từ một Server
                  Component trả về undefined — React báo "Element type is invalid"
                  và trang trả 500. Cách còn lại là bọc vào một client component
                  riêng, xem src/components/admin/AdminUserTable.tsx.
                */}
                <Stack gap="xs" style={{ flex: '1 1 260px' }}>
                  {[
                    ['Ngân hàng', account.bankCode, false],
                    ['Số tài khoản', account.accountNumber, false],
                    ...(account.accountName
                      ? [['Chủ tài khoản', account.accountName, false] as const]
                      : []),
                    ['Số tiền', formatVnd(order.amountVnd), true],
                    ['Nội dung', order.transferCode, true],
                  ].map(([nhan, giaTri, nhanManh]) => (
                    <Group key={String(nhan)} justify="space-between" wrap="nowrap" gap="md">
                      <Text size="sm" c="dimmed">{nhan}</Text>
                      <Text size="sm" fw={nhanManh ? 700 : 500} style={{ textAlign: 'right' }}>
                        {giaTri}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Group>
            </Card>

            <Alert color="yellow" variant="light" title="Hai chỗ dễ sai">
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Nội dung chuyển khoản phải là {order.transferCode}</strong>.
                  Đây là thứ duy nhất nối tiền của bạn với đơn này. Ghi thiếu hoặc
                  ghi thừa chữ khác vẫn nhận ra được, nhưng ghi sai mã thì phải xử
                  lý tay.
                </Text>
                <Text size="sm">
                  <strong>Chuyển đúng {formatVnd(order.amountVnd)}</strong>. Chuyển
                  thiếu sẽ không tự mở khoá.
                </Text>
              </Stack>
            </Alert>

            <Text size="sm" c="dimmed">
              Chuyển xong cứ chờ vài phút rồi tải lại trang này — quyền truy cập
              được mở tự động khi ngân hàng báo về. Nếu quá lâu mà chưa thấy, giữ
              lại ảnh chụp giao dịch và liên hệ để được xử lý tay.
            </Text>
          </Stack>
        )}
      </Container>
    </AppLayout>
  );
}
