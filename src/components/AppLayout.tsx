'use client';

import { ActionIcon, Avatar, Box, Button, Group, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { InstallPrompt } from './InstallPrompt';
import { TabBar } from './TabBar';
import { signInWithGoogle, signOutAction } from '@/lib/auth-actions';

/**
 * Khung của app: một thanh mỏng trên đỉnh, nội dung ở giữa, thanh tab dưới đáy.
 *
 * Trước đây chỗ này là `AppShell` của Mantine với thanh bên liệt kê cả bốn mươi
 * trang. Đã bỏ hẳn: trên điện thoại nó nằm sau nút hamburger ở góc trên bên
 * trái — góc xa ngón cái nhất — nên gần như không ai mở, mà nó lại kéo theo cả
 * một chùm việc phải bù (`offset: false`, hiệu ứng headroom, ba lớp CSS cộng
 * tay chiều cao thanh tiêu đề, xem bẫy 9 trong `bay-ky-thuat.md`).
 *
 * Mục lục KHÔNG mất theo: `/library` liệt kê lý thuyết, lộ trình và đọc thêm;
 * `/exercises` là bản đồ 25 bài tập. Cả hai đều nằm trên thanh tab. Bỏ thanh bên
 * mà không có hai trang đó thì mới là làm mất đường đi.
 */

function AuthButton({ user }: { user: AppSessionUser | null }) {
  if (!user) {
    return (
      <form action={signInWithGoogle}>
        <Button type="submit" size="xs" variant="light">
          Đăng nhập
        </Button>
      </form>
    );
  }

  return (
    <Group gap={6} wrap="nowrap">
      <Avatar src={user.image ?? undefined} radius="xl" size="sm">
        {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
      </Avatar>
      <form action={signOutAction}>
        <Button type="submit" size="xs" variant="subtle" color="gray">
          Đăng xuất
        </Button>
      </form>
    </Group>
  );
}

/**
 * Nút quay lại, chỉ hiện khi đang không ở màn hình chủ.
 *
 * Ưu tiên `router.back()` để giữ đúng cảm giác "lùi một bước", nhưng phải có
 * đường lui: mở app thẳng vào một bài (từ link chia sẻ, hoặc từ biểu tượng ngoài
 * màn hình chính) thì lịch sử rỗng, bấm back sẽ thoát hẳn khỏi app.
 */
function BackButton() {
  const router = useRouter();

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      aria-label="Quay lại"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push('/');
      }}
    >
      <IconArrowLeft size={20} />
    </ActionIcon>
  );
}

export interface AppSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AppLayout({
  children,
  user = null,
}: {
  children: React.ReactNode;
  user?: AppSessionUser | null;
}) {
  const pathname = usePathname();
  const oTrangChu = pathname === '/';

  return (
    <>
      <header className="app-topbar">
        <Group h="100%" px="sm" justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
            {!oTrangChu && <BackButton />}
            <Title
              order={3}
              style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Text component={Link} href="/" inherit c="inherit" td="none">
                🎹 Piano Journey
              </Text>
            </Title>
          </Group>
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <AuthButton user={user} />
            <ThemeToggle />
          </Group>
        </Group>
      </header>

      <Box component="main" className="app-content">
        {children}
      </Box>

      {/* Cả hai đều dính vào khung nhìn nên nằm ngoài phần nội dung. */}
      <InstallPrompt />
      <TabBar />
    </>
  );
}
