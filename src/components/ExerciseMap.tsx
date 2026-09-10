'use client';

import { Badge, Card, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconCheck, IconLock } from '@tabler/icons-react';
import Link from 'next/link';

/**
 * Bản đồ chặng của phần bài tập.
 *
 * Mỗi bài là một ô tròn to bằng đầu ngón tay, xếp theo chương — nhìn một cái là
 * biết mình đang ở đâu trong cả chặng đường, thứ mà danh sách chữ không cho thấy.
 *
 * Cố ý KHÔNG có điểm số, chuỗi ngày liên tiếp hay huy hiệu. Đây là bản đồ, không
 * phải bảng xếp hạng: nó trả lời "tiếp theo là bài nào", không thúc người học
 * phải học nhanh hơn. Cùng tinh thần với ràng buộc ở `AGENTS.md` về chuyện không
 * tạo áp lực lúc tập.
 */

export interface MapLesson {
  slug: string;
  title: string;
  href: string;
  lessonNumber: number;
  done: boolean;
  locked: boolean;
  /** Bài đầu tiên chưa tick — chỗ người học nên quay lại. */
  current: boolean;
}

export interface MapChapter {
  chapterNumber: number;
  lessons: MapLesson[];
}

function TileColors(lesson: MapLesson) {
  if (lesson.done) return { bg: 'var(--mantine-color-green-6)', fg: 'white', border: 'transparent' };
  if (lesson.locked)
    return {
      bg: 'var(--mantine-color-default)',
      fg: 'var(--mantine-color-dimmed)',
      border: 'var(--mantine-color-default-border)',
    };
  return {
    bg: 'var(--mantine-color-body)',
    fg: 'var(--mantine-color-text)',
    border: 'var(--mantine-color-blue-6)',
  };
}

export function ExerciseMap({ chapters }: { chapters: MapChapter[] }) {
  return (
    <Stack gap="lg">
      {chapters.map((chapter) => {
        const xong = chapter.lessons.filter((l) => l.done).length;
        return (
          <Card key={chapter.chapterNumber} withBorder padding="md" radius="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Chương {chapter.chapterNumber}</Text>
              <Badge variant="light" color={xong === chapter.lessons.length ? 'green' : 'gray'}>
                {xong}/{chapter.lessons.length}
              </Badge>
            </Group>

            <Group gap="sm">
              {chapter.lessons.map((lesson) => {
                const mau = TileColors(lesson);
                return (
                  <UnstyledButton
                    key={lesson.slug}
                    component={Link}
                    href={lesson.href}
                    title={lesson.title}
                    aria-label={`${lesson.title}${lesson.done ? ' — đã học xong' : ''}${
                      lesson.locked ? ' — bài trả phí' : ''
                    }`}
                  >
                    <Stack gap={4} align="center" w={64}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: mau.bg,
                          color: mau.fg,
                          // Bài đang tới được viền đậm hơn để nổi lên giữa bản đồ.
                          border: `${lesson.current ? 3 : 1}px solid ${mau.border}`,
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {lesson.done ? (
                          <IconCheck size={24} />
                        ) : lesson.locked ? (
                          <IconLock size={20} />
                        ) : (
                          lesson.lessonNumber
                        )}
                      </div>
                      <Text size="xs" c={lesson.current ? undefined : 'dimmed'} fw={lesson.current ? 600 : 400}>
                        Bài {lesson.lessonNumber}
                      </Text>
                    </Stack>
                  </UnstyledButton>
                );
              })}
            </Group>
          </Card>
        );
      })}

      <Group gap="lg" justify="center">
        <Group gap={6}>
          <ThemeIcon size="sm" radius="xl" color="green">
            <IconCheck size={12} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">Đã học xong</Text>
        </Group>
        <Group gap={6}>
          <ThemeIcon size="sm" radius="xl" variant="default">
            <IconLock size={12} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">Bài trả phí</Text>
        </Group>
      </Group>
    </Stack>
  );
}
