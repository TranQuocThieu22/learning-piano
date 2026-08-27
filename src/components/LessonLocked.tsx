'use client';

import { Button, Card, Group, List, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { findPackage } from '@/lib/packages';
import { formatVnd } from '@/lib/payment/vietqr';
import { FREE_THROUGH_CHAPTER, REQUIRED_PACKAGE_ID } from '@/lib/access';

/**
 * Màn hình thay cho nội dung bài khi người học chưa sở hữu gói.
 *
 * Cố ý KHÔNG hiện một phần bài rồi làm mờ phần còn lại: nội dung vẫn nằm trong
 * HTML thì ai xem mã nguồn cũng đọc được, tức là khoá giả. Ở đây server không
 * gửi nội dung xuống chút nào.
 *
 * Cũng cố ý không có "giá gốc" gạch ngang hay đồng hồ đếm ngược — mục 6 của
 * docs/_internal/dinh-huong-kinh-doanh.md cấm, và Nghị định 81/2018 điều chỉnh
 * chuyện đó thật.
 */
export function LessonLocked({
  title,
  signedIn,
}: {
  title: string;
  signedIn: boolean;
}) {
  const pkg = findPackage(REQUIRED_PACKAGE_ID);

  return (
    <Stack gap="lg" maw={640}>
      <div>
        <Text size="sm" c="dimmed">
          Bài này nằm trong phần trả phí
        </Text>
        <Title order={2} mt={4}>
          {title}
        </Title>
      </div>

      <Text>
        Toàn bộ giáo trình mở miễn phí tới hết{' '}
        <strong>Chương {FREE_THROUGH_CHAPTER}</strong>. Từ Chương{' '}
        {FREE_THROUGH_CHAPTER + 1} trở đi — chỗ bắt đầu ghép hai tay — cần gói{' '}
        <strong>{pkg?.name ?? 'Nền tảng'}</strong>.
      </Text>

      {pkg && (
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Text fw={600} size="lg">
                {pkg.name}
              </Text>
              <Text size="sm" c="dimmed">
                {pkg.description}
              </Text>
            </div>
            <Text fw={700} size="xl">
              {formatVnd(pkg.priceVnd)}
            </Text>
          </Group>

          <List size="sm" spacing="xs" mt="md">
            <List.Item>Mua đứt một lần, không phải thuê bao</List.Item>
            <List.Item>Học tới đâu tùy tốc độ của bạn, không giới hạn thời gian</List.Item>
            <List.Item>Đích đến: tự đệm được một bài hát hoàn chỉnh</List.Item>
          </List>
        </Card>
      )}

      {!signedIn && (
        <Text size="sm" c="dimmed">
          Nếu bạn đã mua, hãy đăng nhập bằng đúng tài khoản Google đã dùng khi
          mua — quyền truy cập gắn với tài khoản đó.
        </Text>
      )}

      <Group>
        <Button component={Link} href="/checkout" size="md">
          Xem gói và mở khoá
        </Button>
        <Button component={Link} href="/01-roadmap/roadmap" variant="default">
          Xem lộ trình
        </Button>
        <Button component={Link} href="/journal" variant="subtle">
          Về nhật ký
        </Button>
      </Group>
    </Stack>
  );
}
