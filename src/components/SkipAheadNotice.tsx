'use client';

import { Button, Group, Paper, Text } from '@mantine/core';
import { IconArrowBackUp } from '@tabler/icons-react';
import Link from 'next/link';
import { useLocalStore } from '@/hooks/useLocalStore';
import { addSlug, createSlugListStore } from '@/lib/slug-list';

/**
 * Dòng nhắc ở đầu bài khi người học mở một bài đứng **sau** chỗ họ chưa tick.
 *
 * Vì sao có (14/09/2026). Chủ sản phẩm lo người học nhảy cóc qua các chương rồi
 * không tập gì, và hỏi có nên khoá bài sau cho tới khi tập đạt bài trước. Không
 * khoá — lý do ghi ở `nhat-ky-quyet-dinh.md`. Thứ thay vào là dòng này: nói cho
 * người học biết họ đang vượt, rồi để **họ tự quyết**.
 *
 * Bốn điều giữ cho nó là lời nhắc chứ không thành rào chắn, sửa gì thì đừng phá:
 *
 * 1. **Không chặn.** Bài vẫn hiện đủ ngay bên dưới, không mờ, không phải bấm gì
 *    mới đọc được.
 * 2. **Bấm *Học tiếp* là thôi nhắc ở bài đó** — nhớ trên máy, không hỏi lại mỗi
 *    lần mở. Nhắc đi nhắc lại một điều người học đã trả lời là cằn nhằn.
 * 3. **Không đếm, không ghi lại** số lần vượt ở đâu cả.
 * 4. **Nói thẳng trường hợp hay gặp nhất:** học xong rồi mà quên tick. Không có
 *    câu đó thì người học chăm chỉ đọc thành bị trách.
 *
 * Chỉ trang bài học dựng component này, và chỉ khi đã đăng nhập — chưa đăng nhập
 * thì app không biết bài nào đã tick, nhắc là nhắc sai.
 */

const dismissedStore = createSlugListStore('pj-skip-ahead-dismissed');

export function SkipAheadNotice({
  lessonSlug,
  skippedTitle,
  skippedHref,
}: {
  lessonSlug: string;
  skippedTitle: string;
  skippedHref: string;
}) {
  const dismissed = useLocalStore(dismissedStore).includes(lessonSlug);
  if (dismissed) return null;

  return (
    <Paper withBorder radius="md" p="md" mb="lg" data-testid="skip-ahead-notice">
      <Text size="sm">
        Trên đường đi, bài này đứng sau <b>{skippedTitle}</b> — bài đó bạn chưa tick. Học rồi mà
        quên tick thì cứ học tiếp.
      </Text>
      {/* Hai nút cao 42px, trải đều bề ngang trên điện thoại: máy có thể đang nằm trên giá nhạc. */}
      <Group gap="sm" mt="sm" grow>
        <Button
          component={Link}
          href={skippedHref}
          variant="light"
          size="md"
          leftSection={<IconArrowBackUp size={18} />}
        >
          Quay lại bài đó
        </Button>
        <Button
          variant="default"
          size="md"
          onClick={() => addSlug(dismissedStore, lessonSlug)}
          data-testid="skip-ahead-continue"
        >
          Học tiếp
        </Button>
      </Group>
    </Paper>
  );
}
