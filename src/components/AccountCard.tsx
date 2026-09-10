'use client';

import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import { ThemeToggle } from './ThemeToggle';
import { signInWithGoogle, signOutAction } from '@/lib/auth-actions';
import type { AppSessionUser } from './AppLayout';

/**
 * Thẻ tài khoản ở cuối màn hình chủ.
 *
 * Đây là nơi hai thứ của thanh tiêu đề cũ đi về sau khi bỏ nó: nút đăng
 * nhập/đăng xuất và nút đổi nền sáng-tối. Chúng thuộc loại **thỉnh thoảng mới
 * dùng** — vài tháng một lần, hoặc một lần rồi thôi — nên chiếm một góc màn hình
 * suốt cả buổi tập là không đáng. Đặt ở màn hình chủ thì vẫn luôn tới được bằng
 * đúng một lần chạm vào tab Trang chủ.
 */
export function AccountCard({ user }: { user: AppSessionUser | null }) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
        {user ? (
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Avatar src={user.image ?? undefined} radius="xl" size="md">
              {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text fw={500} lineClamp={1}>
                {user.name ?? user.email}
              </Text>
              <form action={signOutAction}>
                <Button type="submit" size="compact-xs" variant="subtle" color="gray" px={0}>
                  Đăng xuất
                </Button>
              </form>
            </div>
          </Group>
        ) : (
          <Stack gap="xs" style={{ minWidth: 0 }}>
            <div>
              <Text fw={600}>Đăng nhập để lưu tiến độ</Text>
              <Text size="sm" c="dimmed">
                Không đăng nhập vẫn đọc và tập bình thường, chỉ là những bài đã
                tick sẽ không được nhớ lại ở lần mở sau.
              </Text>
            </div>
            <form action={signInWithGoogle}>
              <Button type="submit" variant="light" size="md">
                Đăng nhập với Google
              </Button>
            </form>
          </Stack>
        )}

        <div style={{ flexShrink: 0 }}>
          <ThemeToggle />
        </div>
      </Group>
    </Card>
  );
}
