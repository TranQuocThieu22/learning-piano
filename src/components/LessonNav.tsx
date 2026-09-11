'use client';

import { Button, SimpleGrid, Text } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import type { LessonLink } from '@/lib/lessons';

/**
 * Hai nút chuyển bài ở cuối mỗi bài học.
 *
 * Vì sao cần: giáo trình đi theo một đường thẳng (Chương 1 → Bài 1 → Bài 2…),
 * nên gần như mọi lần chuyển trang đều là "sang bài kế". Không có hai nút này thì
 * phải quay ra mục lục, tìm đúng chương, rồi mới bấm được — ba thao tác cho việc
 * hay làm nhất.
 *
 * Bài kế bị khoá thì VẪN hiện nút. Bấm vào sẽ ra màn hình giới thiệu gói ở
 * `LessonLocked.tsx` — đó là chỗ nên tới, còn giấu nút đi thì người học tưởng
 * giáo trình hết ở đây. Việc chặn thật nằm ở server, không nằm ở cái nút này.
 */
export function LessonNav({
  prev,
  next,
}: {
  prev: LessonLink | null;
  next: LessonLink | null;
}) {
  if (!prev && !next) return null;

  return (
    <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm" mt="xl">
      {prev ? (
        <Button
          component={Link}
          href={prev.href}
          variant="default"
          size="md"
          justify="flex-start"
          leftSection={<IconArrowLeft size={18} />}
          h="auto"
          py="sm"
          styles={{ label: { whiteSpace: 'normal', textAlign: 'left' } }}
        >
          <span>
            <Text size="xs" c="dimmed">Bài trước</Text>
            <Text size="sm" fw={500} lineClamp={2}>{prev.title}</Text>
          </span>
        </Button>
      ) : (
        // Ô trống giữ chỗ để nút "Bài tiếp theo" luôn nằm bên phải, không nhảy
        // sang trái ở bài đầu tiên. Chỉ cần trên màn hình rộng, vì lúc hẹp thì
        // hai nút xếp chồng.
        <span />
      )}

      {next && (
        <Button
          component={Link}
          href={next.href}
          variant="light"
          size="md"
          justify="flex-end"
          rightSection={<IconArrowRight size={18} />}
          h="auto"
          py="sm"
          styles={{ label: { whiteSpace: 'normal', textAlign: 'right' } }}
        >
          <span>
            <Text size="xs" c="dimmed">Bài tiếp theo</Text>
            <Text size="sm" fw={500} lineClamp={2}>{next.title}</Text>
          </span>
        </Button>
      )}
    </SimpleGrid>
  );
}
