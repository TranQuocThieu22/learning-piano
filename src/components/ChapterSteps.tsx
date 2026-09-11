'use client';

import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight, IconBook, IconLock, IconMusic } from '@tabler/icons-react';
import Link from 'next/link';
import { LessonTickButton } from './LessonTickButton';

/**
 * Các bước của MỘT chương, xếp dọc theo đúng thứ tự học: lý thuyết trước, rồi
 * từng bài tập.
 *
 * Đây là chỗ gom lại cái mà trước ngày 11/09/2026 phải đi ba trang mới xong:
 * *Mục lục* để đọc lý thuyết, *Bài tập* để tìm đúng bài, *Nhật ký* để tick. Nay
 * mở một chương ra là thấy cả chương, và **tick được ngay tại chỗ** mà không phải
 * mở bài lên rồi cuộn xuống đáy.
 *
 * Mỗi bước là một thẻ cao tối thiểu 64px với hai vùng chạm tách bạch:
 *
 * - **Bấm vào thân thẻ** → mở bài.
 * - **Bấm vào ô tròn bên trái** → tick xong/chưa xong, không rời trang.
 *
 * Hai vùng phải tách hẳn chứ không lồng nhau: `Link` bọc ngoài mà bên trong có
 * nút thì chạm vào nút cũng kích hoạt luôn cả link — người học định tick lại bị
 * đẩy sang trang khác. Nên link và ô tick là hai phần tử anh em, không cái nào
 * chứa cái nào.
 *
 * Cố ý KHÔNG khoá bước sau theo bước trước. Giáo trình này để người học tự quyết
 * thứ tự và tốc độ (ràng buộc ở `AGENTS.md`); đường đi là gợi ý, không phải cửa
 * ải. Ổ khoá duy nhất ở đây là ổ khoá trả phí.
 */

export interface ChapterStepView {
  slug: string;
  title: string;
  href: string;
  kind: 'theory' | 'exercise';
  lessonNumber?: number;
  done: boolean;
  locked: boolean;
  /** Bước đầu tiên chưa xong trong cả giáo trình — chỗ người học nên quay lại. */
  current: boolean;
}

/** Nhãn ngắn bên trên tiêu đề, để liếc là biết bước này phải làm gì. */
function stepLabel(step: ChapterStepView): string {
  if (step.kind === 'theory') return 'Lý thuyết — đọc trước khi tập';
  return `Bài ${step.lessonNumber} — ngồi vào đàn`;
}

export function ChapterSteps({
  steps,
  signedIn,
}: {
  steps: ChapterStepView[];
  signedIn: boolean;
}) {
  return (
    <Stack gap="sm">
      {steps.map((step) => (
        <Card
          key={step.slug}
          withBorder
          padding="sm"
          radius="md"
          className="step-card"
          data-state={step.done ? 'done' : step.locked ? 'locked' : step.current ? 'current' : 'open'}
        >
          <Group gap="sm" wrap="nowrap" align="center">
            {/* Vùng chạm 1: tick. Bài chưa mở khoá thì thay bằng ổ khoá tĩnh. */}
            {step.locked ? (
              <ThemeIcon variant="light" color="gray" size={44} radius="xl">
                <IconLock size={20} />
              </ThemeIcon>
            ) : (
              <LessonTickButton
                lessonSlug={step.slug}
                initialCompleted={step.done}
                signedIn={signedIn}
                variant="step"
                label={step.kind === 'theory' ? 'Đã đọc xong chương này' : `Đã học xong bài ${step.lessonNumber}`}
              />
            )}

            {/* Vùng chạm 2: mở bài. Trải hết chỗ còn lại cho dễ trúng. */}
            <Link href={step.href} className="step-card__open">
              <Text size="xs" c="dimmed">
                {stepLabel(step)}
              </Text>
              <Text size="sm" fw={step.current ? 700 : 500} lineClamp={2}>
                {step.title}
              </Text>
            </Link>

            <ThemeIcon
              variant="transparent"
              color={step.kind === 'theory' ? 'violet' : 'orange'}
              size={28}
              aria-hidden
            >
              {step.kind === 'theory' ? <IconBook size={20} /> : <IconMusic size={20} />}
            </ThemeIcon>
          </Group>

          {step.current && (
            <Group gap={6} mt={6} c="dimmed">
              <IconArrowRight size={14} />
              <Text size="xs" fw={600}>
                Bạn đang ở đây
              </Text>
            </Group>
          )}
        </Card>
      ))}
    </Stack>
  );
}
