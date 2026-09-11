'use client';

import type { ReactNode } from 'react';
import { Card, Group, Progress, Stack, Text } from '@mantine/core';
import { IconBook, IconCheck, IconLock } from '@tabler/icons-react';
import Link from 'next/link';
import { chapterColor, chapterColorVars } from '@/lib/chapter-colors';

/**
 * Bản đồ chặng của phần bài tập.
 *
 * Mỗi bài là một ô tròn to bằng đầu ngón tay, xếp theo chương — nhìn một cái là
 * biết mình đang ở đâu trong cả chặng đường, thứ mà danh sách chữ không cho thấy.
 *
 * Cố ý KHÔNG có điểm số, chuỗi ngày liên tiếp hay huy hiệu. Đây là bản đồ, không
 * phải bảng xếp hạng: nó trả lời "tiếp theo là bài nào", không thúc người học
 * phải học nhanh hơn. Cùng tinh thần với ràng buộc ở `AGENTS.md` về chuyện không
 * tạo áp lực lúc tập. Màu sắc và vòng sáng quanh bài đang tới là để dễ tìm chỗ,
 * không đếm gì cả.
 */

export interface MapLesson {
  slug: string;
  title: string;
  href: string;
  /**
   * `theory` thêm 11/09/2026, khi lý thuyết trở thành một bước tick được.
   *
   * Phải có mặt ở đây chứ không chỉ ở trang chương: thiếu nó thì màn hình chủ đếm
   * "4/6" trong khi `/path/3` đếm "5/7" cho cùng một chương, và hai con số đá
   * nhau là đúng cái bệnh mà đợt gom này sinh ra để chữa.
   */
  kind: 'theory' | 'exercise';
  /** Chỉ bước bài tập mới có — lý thuyết không đánh số bài. */
  lessonNumber?: number;
  done: boolean;
  locked: boolean;
  /** Bước đầu tiên chưa tick — chỗ người học nên quay lại. */
  current: boolean;
}

export interface MapChapter {
  chapterNumber: number;
  lessons: MapLesson[];
}

function LessonDot({ lesson }: { lesson: MapLesson }) {
  const state = lesson.done ? 'done' : lesson.locked ? 'locked' : lesson.current ? 'current' : 'open';
  return (
    <Link
      href={lesson.href}
      className="lesson-dot"
      data-state={state}
      title={lesson.title}
      aria-current={lesson.current ? 'step' : undefined}
      aria-label={`${lesson.kind === 'theory' ? 'Lý thuyết: ' : ''}${lesson.title}${
        lesson.done ? ' — đã xong' : ''
      }${lesson.locked ? ' — bài trả phí' : ''}${lesson.current ? ' — bước bạn đang tới' : ''}`}
    >
      <span className="lesson-dot__circle">
        {lesson.done ? (
          <IconCheck size={26} stroke={3} />
        ) : lesson.locked ? (
          <IconLock size={20} />
        ) : lesson.kind === 'theory' ? (
          <IconBook size={22} />
        ) : (
          lesson.lessonNumber
        )}
      </span>
      <span className="lesson-dot__label">
        {lesson.kind === 'theory' ? 'Lý thuyết' : `Bài ${lesson.lessonNumber}`}
      </span>
    </Link>
  );
}

/**
 * Thẻ một chương: số chương, thanh tiến độ và hàng ô bài. Dùng cả ở `/exercises`
 * lẫn màn hình chủ (chương đang học), nên `action` là chỗ để màn hình chủ gắn
 * thêm nút *Cả bản đồ*.
 */
export function ChapterCard({ chapter, action }: { chapter: MapChapter; action?: ReactNode }) {
  const xong = chapter.lessons.filter((l) => l.done).length;
  const tong = chapter.lessons.length;

  return (
    <Card withBorder padding="md" style={chapterColorVars(chapter.chapterNumber)}>
      <Group justify="space-between" wrap="nowrap" gap="sm" mb="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <span className="chapter-badge" aria-hidden>
            {chapter.chapterNumber}
          </span>
          <div style={{ minWidth: 0 }}>
            <Text fw={800} lh={1.2}>
              Chương {chapter.chapterNumber}
            </Text>
            <Text size="xs" c="dimmed">
              {tong > 0 && xong === tong ? 'Đã xong cả chương 🎉' : `${xong}/${tong} bước đã xong`}
            </Text>
          </div>
        </Group>
        {action}
      </Group>

      <Progress
        value={tong > 0 ? (xong / tong) * 100 : 0}
        color={chapterColor(chapter.chapterNumber)}
        size="sm"
        radius="xl"
        mb="md"
        aria-label={`Chương ${chapter.chapterNumber}: đã xong ${xong} trên ${tong} bước`}
      />

      <div className="lesson-dots">
        {chapter.lessons.map((lesson) => (
          <LessonDot key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </Card>
  );
}

export function ExerciseMap({ chapters }: { chapters: MapChapter[] }) {
  return (
    <Stack gap="md">
      {chapters.map((chapter) => (
        <ChapterCard key={chapter.chapterNumber} chapter={chapter} />
      ))}

      {/* Chú thích dựng bằng chính ô bài thu nhỏ, để nó luôn khớp với hình trên bản đồ. */}
      <Group gap="lg" justify="center" style={chapterColorVars(1)} mt="xs">
        {[
          { state: 'done', icon: <IconCheck size={12} stroke={3} />, label: 'Đã xong' },
          { state: 'current', icon: null, label: 'Bước đang tới' },
          { state: 'locked', icon: <IconLock size={11} />, label: 'Bài trả phí' },
        ].map(({ state, icon, label }) => (
          <Group key={state} gap={6} wrap="nowrap">
            <span className="lesson-dot lesson-dot--mini" data-state={state} aria-hidden>
              <span className="lesson-dot__circle">{icon}</span>
            </span>
            <Text size="xs" c="dimmed">
              {label}
            </Text>
          </Group>
        ))}
      </Group>
    </Stack>
  );
}
