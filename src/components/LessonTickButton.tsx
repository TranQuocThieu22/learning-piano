'use client';

import { useState, useTransition } from 'react';
import { Button, Checkbox, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconCircleCheck, IconCircleCheckFilled } from '@tabler/icons-react';
import { toggleLessonCompletion } from '@/lib/progress-actions';

/**
 * Nút tick "đã học xong", hai hình dạng:
 *
 * - `inline` (mặc định): ô tick gọn cho từng dòng trong danh sách.
 * - `card`: nút to cả bề ngang ở CUỐI bài học. Bản cũ là một ô tick nhỏ ở ĐẦU
 *   bài, tức là chỗ người học chưa học gì — và phải cuộn ngược cả bài lên mới
 *   tick được. Cuối bài mới là lúc vừa học xong, ngay trên nút *Bài tiếp theo*,
 *   nên tick rồi sang bài là hai lần chạm liền nhau.
 * - `step`: ô tròn 44px đứng đầu mỗi bước ở trang chương (`ChapterSteps.tsx`).
 *   Tick mà không phải mở bài lên — bài tập ở đây dài mấy màn hình, bắt cuộn
 *   xuống đáy chỉ để tick là đúng cái phiền mà trang chương sinh ra để bỏ.
 *
 * 44px là cỡ tối thiểu cho một vùng chạm: lúc tick thì máy đang nằm trên giá
 * nhạc cách mắt nửa sải tay, tay vừa rời phím đàn.
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
  variant?: 'inline' | 'card' | 'step';
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

  if (variant === 'step') {
    const nhan = label ?? 'Đã học xong bài này';
    return (
      <UnstyledButton
        className="step-tick"
        data-done={completed || undefined}
        disabled={!signedIn || isPending}
        onClick={() => toggle(!completed)}
        aria-pressed={completed}
        // Chưa đăng nhập thì vẫn bấm được nhưng không lưu, nên nói thẳng ở nhãn
        // cho trình đọc màn hình thay vì để người dùng bấm rồi tự đoán.
        aria-label={signedIn ? nhan : `${nhan} — cần đăng nhập để lưu`}
        title={signedIn ? nhan : 'Đăng nhập ở Trang chủ để lưu tiến độ'}
      >
        {completed ? <IconCircleCheckFilled size={28} /> : <IconCircleCheck size={28} />}
      </UnstyledButton>
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
