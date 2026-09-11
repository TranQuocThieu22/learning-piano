'use client';

import { Group, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChevronRight, IconLock } from '@tabler/icons-react';
import Link from 'next/link';
import { chapterColorVars } from '@/lib/chapter-colors';

/**
 * Thẻ một chương ở `/path`. Cả thẻ là một link.
 *
 * Là client component chứ không phải một đoạn JSX trong trang, vì cả thẻ cần là
 * `next/link` mà vẫn dùng được cách bày của Mantine bên trong — truyền
 * `component={Link}` từ Server Component thì trang 500 (xem `NavButton.tsx`).
 * Dựng bằng `<Link>` thật với CSS riêng, không qua `Card` của Mantine.
 */
export function PathChapterCard({
  chapterNumber,
  title,
  done,
  total,
  locked,
  current,
}: {
  chapterNumber: number;
  title: string;
  done: number;
  total: number;
  locked: boolean;
  current: boolean;
}) {
  return (
    <Link
      href={`/path/${chapterNumber}`}
      className="chapter-card"
      data-current={current || undefined}
      style={chapterColorVars(chapterNumber)}
      aria-label={`Chương ${chapterNumber}: ${title} — đã xong ${done} trên ${total} bước`}
    >
      <Group gap="md" wrap="nowrap">
        <ThemeIcon size={44} radius="md" className="chapter-card__badge">
          {locked ? <IconLock size={20} /> : <Text fw={700}>{chapterNumber}</Text>}
        </ThemeIcon>

        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={current ? 700 : 600}>Chương {chapterNumber}</Text>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              {done}/{total} bước
            </Text>
          </Group>
          <Text size="sm" c="dimmed" lineClamp={1}>
            {title}
          </Text>
          <Progress
            value={total === 0 ? 0 : (done / total) * 100}
            size="sm"
            radius="xl"
            color="orange"
          />
        </Stack>

        <IconChevronRight size={18} aria-hidden />
      </Group>
    </Link>
  );
}
