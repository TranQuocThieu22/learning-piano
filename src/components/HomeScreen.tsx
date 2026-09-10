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
  IconChecklist,
  IconMap2,
  IconMetronome,
  IconRoute,
  IconMusicSearch,
  IconPlayerPlayFilled,
  type IconProps,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { signInWithGoogle } from '@/lib/auth-actions';

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
  signedIn: boolean;
  completedCount: number;
  totalCount: number;
  /** Bài đầu tiên chưa tick. `null` nghĩa là đã tick hết. */
  continueLesson: { title: string; href: string } | null;
  /** Bài đầu tiên của giáo trình, để người chưa học lần nào có chỗ bắt đầu. */
  firstLesson: { title: string; href: string } | null;
  /** Chương lý thuyết đầu tiên, trang lộ trình và bài đọc thêm đầu tiên — tính ở server. */
  theoryHref: string | null;
  roadmapHref: string | null;
  extraHref: string | null;
}

export function HomeScreen({
  signedIn,
  completedCount,
  totalCount,
  continueLesson,
  firstLesson,
  theoryHref,
  roadmapHref,
  extraHref,
}: HomeScreenProps) {
  const daHocXongHet = totalCount > 0 && completedCount === totalCount;
  const chuaHocBai = completedCount === 0;
  const dichTiepTheo = continueLesson ?? firstLesson;

  const tiles: Tile[] = [
    {
      href: '/exercises',
      label: 'Bài tập',
      hint: `${completedCount}/${totalCount} bài`,
      Icon: IconMap2,
      color: 'blue',
    },
    ...(theoryHref
      ? [{ href: theoryHref, label: 'Lý thuyết', hint: 'Đọc hiểu vì sao', Icon: IconBook2, color: 'grape' } as Tile]
      : []),
    ...(roadmapHref
      ? [{ href: roadmapHref, label: 'Lộ trình', hint: 'Đường đi từ số 0', Icon: IconRoute, color: 'indigo' } as Tile]
      : []),
    {
      href: '/metronome',
      label: 'Máy đánh nhịp',
      hint: 'Tự bật, tự chỉnh',
      Icon: IconMetronome,
      color: 'teal',
    },
    {
      href: '/note-trainer',
      label: 'Luyện nhận nốt',
      hint: 'Vài phút mỗi ngày',
      Icon: IconMusicSearch,
      color: 'orange',
    },
    {
      href: '/journal',
      label: 'Nhật ký',
      hint: 'Tick bài đã xong',
      Icon: IconChecklist,
      color: 'green',
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

      {/*
        Chưa đăng nhập thì vẫn học được — Chương 0 và Chương 1 vốn miễn phí. Chỉ
        nói đúng một điều: không đăng nhập thì tiến độ tick không được lưu. Không
        chặn đường, không hứa hẹn gì thêm.
      */}
      {!signedIn && (
        <Card withBorder padding="md" radius="md">
          <Stack gap="sm">
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
        </Card>
      )}

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
    </Stack>
  );
}
