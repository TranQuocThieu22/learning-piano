'use client';

import { useState, useTransition } from 'react';
import { Button, Checkbox, Group, List, Paper, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconCircleCheck, IconCircleCheckFilled, IconPiano } from '@tabler/icons-react';
import { toggleLessonCompletion } from '@/lib/progress-actions';
import { playedThroughStore } from '@/lib/slug-list';
import { useLocalStore } from '@/hooks/useLocalStore';

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
 * Bản `card` mang thêm hai thứ ngay trên nút (14/09/2026):
 *
 * - **Xong bài khi** — tiêu chí người soạn viết cho bài này (`done-criteria.ts`).
 *   Đặt đúng chỗ người học đang tự hỏi "mình xong chưa", thay vì chìm giữa bài.
 * - **Dòng khen** khi người học đã đánh trọn một bản nhạc của bài với đàn trên máy
 *   này. Chỉ khen, không bao giờ nói "chưa đánh trọn": tập với đàn là tuỳ chọn,
 *   không bài học nào được bắt buộc phải cho app nghe đàn (`AGENTS.md`).
 *
 * Cả hai chỉ là lời nói với người học — nút tick vẫn bấm được bất cứ lúc nào.
 * Chủ sản phẩm hỏi có nên khoá bài theo điều kiện, và câu trả lời đã chốt là không.
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
  criteria = [],
}: {
  lessonSlug: string;
  initialCompleted: boolean;
  signedIn: boolean;
  label?: string;
  variant?: 'inline' | 'card' | 'step';
  /** Dòng tiêu chí *Xong bài khi*. Chỉ bản `card` vẽ ra. */
  criteria?: string[];
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const playedThrough = useLocalStore(playedThroughStore).includes(lessonSlug);
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
        {(criteria.length > 0 || playedThrough) && (
          <Paper withBorder radius="md" p="md" mb={6} data-testid="done-criteria">
            {criteria.length > 0 && (
              <>
                <Text fw={700} size="sm">Xong bài khi</Text>
                <List size="sm" spacing={4} mt={6}>
                  {criteria.map((item) => (
                    <List.Item key={item}>{item}</List.Item>
                  ))}
                </List>
              </>
            )}
            {playedThrough && (
              <Group gap={6} wrap="nowrap" mt={criteria.length > 0 ? 'sm' : 0} c="teal" data-testid="played-through">
                <IconPiano size={18} style={{ flexShrink: 0 }} aria-hidden />
                <Text size="sm" fw={600}>Bạn đã đánh trọn một bản nhạc trong bài này với đàn.</Text>
              </Group>
            )}
          </Paper>
        )}
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
              : criteria.length > 0
                ? 'Làm được những điều trên thì tick — chậm cũng được, thỉnh thoảng vấp cũng không sao.'
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
