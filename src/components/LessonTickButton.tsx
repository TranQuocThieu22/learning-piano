'use client';

import { useState, useTransition } from 'react';
import { Button, Checkbox, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCircleCheckFilled } from '@tabler/icons-react';
import { toggleLessonCompletion } from '@/lib/progress-actions';

/**
 * Nút tick "đã học xong", hai hình dạng:
 *
 * - `inline` (mặc định): ô tick gọn cho từng dòng ở `/journal`.
 * - `card`: nút to cả bề ngang ở CUỐI bài học. Bản cũ là một ô tick nhỏ ở ĐẦU
 *   bài, tức là chỗ người học chưa học gì — và phải cuộn ngược cả bài lên mới
 *   tick được. Cuối bài mới là lúc vừa học xong, ngay trên nút *Bài tiếp theo*,
 *   nên tick rồi sang bài là hai lần chạm liền nhau.
 */
export function LessonTickButton({
  lessonSlug,
  initialCompleted,
  signedIn,
  label = 'Đã học xong bài này',
  variant = 'inline',
}: {
  lessonSlug: string;
  initialCompleted: boolean;
  signedIn: boolean;
  label?: string;
  variant?: 'inline' | 'card';
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    // Optimistic update; rolled back if the server call fails.
    setCompleted(next);
    startTransition(async () => {
      const result = await toggleLessonCompletion(lessonSlug);
      if (!result.ok) {
        setCompleted(!next);
      } else {
        setCompleted(result.completed);
      }
    });
  };

  if (variant === 'card') {
    return (
      <Stack gap={6} mt="xl">
        <Button
          size="lg"
          fullWidth
          color="teal"
          variant={completed ? 'filled' : 'light'}
          leftSection={completed ? <IconCircleCheckFilled size={22} /> : <IconCircleCheck size={22} />}
          disabled={!signedIn || isPending}
          onClick={() => toggle(!completed)}
          aria-pressed={completed}
        >
          {completed ? 'Đã học xong bài này' : 'Đánh dấu đã học xong'}
        </Button>
        {/* Trên điện thoại không có rê chuột nên chú thích phải là chữ hiện sẵn, không phải tooltip. */}
        <Text size="xs" c="dimmed" ta="center">
          {!signedIn
            ? 'Đăng nhập ở Trang chủ để app nhớ những bài bạn đã học xong.'
            : completed
              ? 'Đã lưu vào nhật ký 🎉 Bấm lần nữa nếu muốn bỏ tick.'
              : 'Tập xong phần trong bài thì tick — không cần đánh hoàn hảo.'}
        </Text>
      </Stack>
    );
  }

  const checkbox = (
    <Checkbox
      size="lg"
      color="teal"
      checked={completed}
      disabled={!signedIn || isPending}
      label={label ? <Text size="sm">{label}</Text> : undefined}
      // Không có nhãn chữ thì trình đọc màn hình chỉ đọc được "ô đánh dấu".
      aria-label={label ? undefined : 'Đã học xong bài này'}
      onChange={(event) => toggle(event.currentTarget.checked)}
    />
  );

  if (!signedIn) {
    return (
      <Tooltip label="Đăng nhập với Google để lưu tiến độ" withArrow>
        <Group gap="xs" style={{ flexShrink: 0 }}>{checkbox}</Group>
      </Tooltip>
    );
  }

  return <Group gap="xs" style={{ flexShrink: 0 }}>{checkbox}</Group>;
}
