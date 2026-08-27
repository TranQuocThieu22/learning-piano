import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { viewerHasFullAccess } from '@/lib/access-server';
import { NavAnchor } from '@/components/NavAnchor';
import { LessonTickButton } from '@/components/LessonTickButton';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getLessonsByChapter, getAllLessons } from '@/lib/lessons';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { signInWithGoogle } from '@/lib/auth-actions';

export default async function LearningLogPage() {
  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const chapters = getLessonsByChapter();
  const allLessons = getAllLessons();

  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  // Để thanh bên biết bài nào cần gắn ổ khoá.
  const hasFullAccess = await viewerHasFullAccess(session);

  const completedCount = allLessons.filter((l) =>
    completedSlugs.has(l.slug)
  ).length;
  const totalCount = allLessons.length;
  const currentLesson = allLessons.find((l) => !completedSlugs.has(l.slug));

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs} hasFullAccess={hasFullAccess}>
      <Container size="sm" px={0}>
        <Title order={2} mb="xs">
          Nhật ký học tập
        </Title>
        <Text c="dimmed" mb="lg">
          Tick vào bài nào là coi như đã học xong bài đó. Tiến độ được lưu
          theo tài khoản Google của bạn.
        </Text>

        {!session?.user && (
          <Alert
            icon={<IconInfoCircle size={18} />}
            color="blue"
            variant="light"
            mb="lg"
            title="Chưa đăng nhập"
          >
            <Stack gap="sm">
              <Text size="sm">
                Đăng nhập với Google để lưu lại nhật ký tick bài — nếu không,
                tiến độ sẽ không được ghi nhớ.
              </Text>
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--mantine-color-blue-6)',
                    color: 'white',
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  Đăng nhập với Google
                </button>
              </form>
            </Stack>
          </Alert>
        )}

        {totalCount > 0 && (
          <Card withBorder mb="lg" padding="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Tiến độ tổng</Text>
              <Text size="sm" c="dimmed">
                {completedCount}/{totalCount} bài
              </Text>
            </Group>
            <Progress value={(completedCount / totalCount) * 100} />
            {currentLesson && (
              <Text size="sm" mt="sm">
                Bài hiện tại:{' '}
                <NavAnchor href={currentLesson.href}>
                  {currentLesson.title}
                </NavAnchor>
              </Text>
            )}
            {!currentLesson && totalCount > 0 && (
              <Text size="sm" mt="sm" c="green">
                Bạn đã tick hết tất cả các bài hiện có 🎉
              </Text>
            )}
          </Card>
        )}

        <Stack gap="xl">
          {chapters.map((chapter) => (
            <div key={chapter.chapterNumber}>
              <Title order={4} mb="sm">
                Chương {chapter.chapterNumber}
              </Title>
              <Stack gap="xs">
                {chapter.lessons.map((lesson) => (
                  <Card key={lesson.slug} withBorder padding="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <div>
                        <NavAnchor href={lesson.href} fw={500}>
                          {lesson.title}
                        </NavAnchor>
                        {completedSlugs.has(lesson.slug) && (
                          <Badge ml="sm" color="green" size="sm">
                            Đã học xong
                          </Badge>
                        )}
                      </div>
                      <LessonTickButton
                        lessonSlug={lesson.slug}
                        initialCompleted={completedSlugs.has(lesson.slug)}
                        signedIn={Boolean(session?.user)}
                        label=""
                      />
                    </Group>
                  </Card>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      </Container>
    </AppLayout>
  );
}
