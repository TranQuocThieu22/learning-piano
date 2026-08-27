import { Alert, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { NavAnchor } from '@/components/NavAnchor';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { viewerHasFullAccess } from '@/lib/access-server';
import { REQUIRED_PACKAGE_ID } from '@/lib/access';
import { findPackage } from '@/lib/packages';
import { formatVnd } from '@/lib/payment/vietqr';
import { getOwnedPackageIds } from '@/lib/payment/orders';
import { createOrderAction } from '@/lib/payment/order-actions';
import { signInWithGoogle } from '@/lib/auth-actions';

const ERROR_MESSAGES: Record<string, string> = {
  'not-signed-in': 'Bạn cần đăng nhập trước khi tạo đơn.',
  'invalid-package': 'Gói không hợp lệ.',
  'already-owned': 'Bạn đã sở hữu gói này rồi.',
  'order-failed': 'Chưa tạo được đơn, thử lại giúp mình.',
};

export default async function MuaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const allFiles = getAllMarkdownFiles();

  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  const pkg = findPackage(REQUIRED_PACKAGE_ID);
  const owned = session?.user
    ? await getOwnedPackageIds(session.user.id)
    : new Set<string>();
  const alreadyOwns = owned.has(REQUIRED_PACKAGE_ID);

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs} hasFullAccess={hasFullAccess}>
      <Container size="sm" px={0}>
        <Title order={2} mb="xs">
          Mở khoá toàn bộ giáo trình
        </Title>
        <Text c="dimmed" mb="lg">
          Chương 0 và Chương 1 luôn miễn phí. Gói dưới đây mở phần còn lại.
        </Text>

        {error && ERROR_MESSAGES[error] && (
          <Alert color="red" variant="light" mb="lg">
            {ERROR_MESSAGES[error]}
          </Alert>
        )}

        {!pkg && (
          <Alert color="red" variant="light">
            Chưa cấu hình gói bán. Kiểm tra PACKAGES trong src/lib/packages.ts.
          </Alert>
        )}

        {pkg && (
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" align="flex-start" wrap="wrap" mb="md">
              <div>
                <Text fw={600} size="lg">{pkg.name}</Text>
                <Text size="sm" c="dimmed">{pkg.description}</Text>
              </div>
              <Text fw={700} size="xl">{formatVnd(pkg.priceVnd)}</Text>
            </Group>

            {/*
              Cố ý KHÔNG dùng <List><List.Item>: Mantine là client component, và
              truy cập thuộc tính ghép như List.Item từ một Server Component trả
              về undefined — React báo "Element type is invalid" và trang trả 500.
              Xem src/components/admin/AdminUserTable.tsx cho cách còn lại: bọc
              phần dùng component ghép vào một client component riêng.
            */}
            <Stack gap={6} mb="lg">
              {[
                'Mua đứt một lần, không phải thuê bao',
                'Không giới hạn thời gian học',
                'Đích đến: tự đệm được một bài hát hoàn chỉnh',
              ].map((item) => (
                <Text key={item} size="sm">— {item}</Text>
              ))}
            </Stack>

            {alreadyOwns ? (
              <Alert color="green" variant="light">
                Bạn đã có quyền truy cập gói này.{' '}
                <NavAnchor href="/journal">Về nhật ký học tập</NavAnchor>
              </Alert>
            ) : !session?.user ? (
              <Stack gap="sm">
                <Text size="sm">
                  Đăng nhập trước đã — quyền truy cập gắn với tài khoản Google,
                  nên phải có tài khoản thì tiền vào mới biết mở khoá cho ai.
                </Text>
                <form action={signInWithGoogle}>
                  <Button type="submit">Đăng nhập với Google</Button>
                </form>
              </Stack>
            ) : (
              <form action={createOrderAction}>
                <input type="hidden" name="packageId" value={pkg.id} />
                <Button type="submit" size="md">
                  Tạo đơn và lấy mã chuyển khoản
                </Button>
              </form>
            )}
          </Card>
        )}

        <Text size="xs" c="dimmed" mt="lg">
          Thanh toán bằng chuyển khoản ngân hàng. Sau khi chuyển đúng số tiền và
          đúng nội dung, quyền truy cập được mở tự động trong ít phút.
        </Text>
      </Container>
    </AppLayout>
  );
}
