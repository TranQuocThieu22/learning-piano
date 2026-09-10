'use client';

import {
  Badge,
  Button,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBook2,
  IconRoute,
  IconMusicSearch,
  IconPlayerPlayFilled,
  type IconProps,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { AccountCard } from './AccountCard';
import { AmbientControl } from './AmbientControl';
import type { AppSessionUser } from './AppLayout';

/**
 * Màn hình chủ của app.
 *
 * Trước đây `/` chỉ `redirect()` sang trang lộ trình, nên mở app ra là rơi thẳng
 * vào một trang tài liệu dài và mọi đường đi khác đều phải qua nút hamburger —
 * hai lần chạm và một danh sách hơn bốn mươi mục. Ở đây gom lại thành những ô to
 * bấm được bằng ngón cái, đúng thứ người học cần ngay khi mở máy.
 *
 * Thứ tự cố ý: *Học tiếp* đứng trên cùng và to nhất, vì chín trên mười lần mở app
 * là để học tiếp chỗ đang dở. Mấy ô còn lại chỉ là đường tắt, không phải mục lục
 * — mục lục đầy đủ vẫn nằm ở thanh bên, chỗ nó vốn ở.
 */

interface Tile {
  href: string;
  label: string;
  hint: string;
  Icon: ComponentType<IconProps>;
  color: string;
}

export interface HomeScreenProps {
  /** Người đang đăng nhập, `null` nếu chưa. Dùng cho thẻ tài khoản cuối trang. */
  user: AppSessionUser | null;
  completedCount: number;
  totalCount: number;
  /** Bài đầu tiên chưa tick. `null` nghĩa là đã tick hết. */
  continueLesson: { title: string; href: string } | null;
  /** Bài đầu tiên của giáo trình, để người chưa học lần nào có chỗ bắt đầu. */
  firstLesson: { title: string; href: string } | null;
  /** Trang lộ trình và bài đọc thêm đầu tiên, tính ở server. */
  roadmapHref: string | null;
  extraHref: string | null;
}

export function HomeScreen({
  user,
  completedCount,
  totalCount,
  continueLesson,
  firstLesson,
  roadmapHref,
  extraHref,
}: HomeScreenProps) {
  const daHocXongHet = totalCount > 0 && completedCount === totalCount;
  const chuaHocBai = completedCount === 0;
  const dichTiepTheo = continueLesson ?? firstLesson;

  /*
   * Chỉ những đích KHÔNG có trên thanh tab. Trang chủ, Mục lục, Bài tập, Nhịp và
   * Nhật ký đã nằm sẵn dưới đáy màn hình — bày lại thành ô ở đây chỉ làm dài
   * trang mà không rút ngắn được đường đi nào.
   */
  const tiles: Tile[] = [
    ...(roadmapHref
      ? [{ href: roadmapHref, label: 'Lộ trình', hint: 'Đường đi từ số 0', Icon: IconRoute, color: 'indigo' } as Tile]
      : []),
    {
      href: '/note-trainer',
      label: 'Luyện nhận nốt',
      hint: 'Vài phút mỗi ngày',
      Icon: IconMusicSearch,
      color: 'orange',
    },
    ...(extraHref
      ? [{ href: extraHref, label: 'Đọc thêm', hint: 'Chuyện bên lề', Icon: IconBook2, color: 'gray' } as Tile]
      : []),
  ];

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg" radius="md">
        {daHocXongHet ? (
          <Stack gap="xs">
            <Title order={3}>Đã tick hết bài hiện có 🎉</Title>
            <Text size="sm" c="dimmed">
              Quay lại bài cũ tập cho nhuyễn cũng là học — tiến độ không mất đi đâu.
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div style={{ minWidth: 0 }}>
                <Text size="sm" c="dimmed">
                  {chuaHocBai ? 'Bắt đầu từ đây' : 'Học tiếp'}
                </Text>
                <Title order={3} lineClamp={2}>
                  {dichTiepTheo?.title ?? 'Giáo trình đang được soạn'}
                </Title>
              </div>
              {totalCount > 0 && (
                <Badge variant="light" size="lg" style={{ flexShrink: 0 }}>
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </Group>

            {totalCount > 0 && (
              <Progress
                value={(completedCount / totalCount) * 100}
                size="md"
                radius="xl"
                aria-label={`Đã học ${completedCount} trên ${totalCount} bài`}
              />
            )}

            {dichTiepTheo && (
              <Button
                component={Link}
                href={dichTiepTheo.href}
                size="lg"
                fullWidth
                leftSection={<IconPlayerPlayFilled size={20} />}
              >
                {chuaHocBai ? 'Bắt đầu học' : 'Học tiếp'}
              </Button>
            )}
          </Stack>
        )}
      </Card>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {tiles.map(({ href, label, hint, Icon, color }) => (
          <UnstyledButton key={href + label} component={Link} href={href}>
            <Card withBorder padding="md" radius="md" h="100%">
              <Stack gap={6}>
                <Icon size={28} color={`var(--mantine-color-${color}-6)`} />
                <Text fw={600}>{label}</Text>
                <Text size="xs" c="dimmed">
                  {hint}
                </Text>
              </Stack>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>

      {/*
        Thẻ tài khoản đứng CUỐI: đăng nhập một lần rồi thôi, đổi nền vài tháng
        một lần — không thứ nào đáng đứng trên nút Học tiếp. Chưa đăng nhập thì
        thẻ này nói rõ mất gì (không lưu được tick), nhưng vẫn không chặn đường:
        Chương 0 và Chương 1 vốn miễn phí, không đăng nhập vẫn đọc và tập được.
      */}
      <AmbientControl />

      <AccountCard user={user} />
    </Stack>
  );
}
