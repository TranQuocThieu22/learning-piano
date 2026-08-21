'use client';

import { useState, useTransition } from 'react';
import { Checkbox, Group, Text, Tooltip } from '@mantine/core';
import { toggleLessonCompletion } from '@/lib/progress-actions';

export function LessonTickButton({
  lessonSlug,
  initialCompleted,
  signedIn,
  label = 'Đã học xong bài này',
}: {
  lessonSlug: string;
  initialCompleted: boolean;
  signedIn: boolean;
  label?: string;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const checkbox = (
    <Checkbox
      checked={completed}
      disabled={!signedIn || isPending}
      label={label ? <Text size="sm">{label}</Text> : undefined}
      onChange={(event) => {
        const next = event.currentTarget.checked;
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
      }}
    />
  );

  if (!signedIn) {
    return (
      <Tooltip label="Đăng nhập với Google để lưu tiến độ" withArrow>
        <Group gap="xs">{checkbox}</Group>
      </Tooltip>
    );
  }

  return <Group gap="xs">{checkbox}</Group>;
}
