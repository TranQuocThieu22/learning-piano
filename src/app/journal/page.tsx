import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  RingProgress,
  Stack,
  Text,
} from '@mantine/core';
import { IconChecklist, IconInfoCircle, IconLock } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { viewerHasFullAccess } from '@/lib/access-server';
import { canReadLesson } from '@/lib/access';
import { NavAnchor } from '@/components/NavAnchor';
import { LessonTickButton } from '@/components/LessonTickButton';
import { auth } from '@/auth';
import { EXERCISES_CATEGORY, getLessonsByChapter, getAllLessons } from '@/lib/lessons';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { signInWithGoogle } from '@/lib/auth-actions';
import { chapterColorVars } from '@/lib/chapter-colors';

export default async function LearningLogPage() {
  const session = await auth();
  const chapters = getLessonsByChapter();
  const allLessons = getAllLessons();

  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  // Bài nào cần gắn ổ khoá thì dựa vào đây.
  const hasFullAccess = await viewerHasFullAccess(session);

  const completedCount = allLessons.filter((l) =>
    completedSlugs.has(l.slug)
  ).length;
  const totalCount = allLessons.length;
  const currentLesson = allLessons.find((l) => !completedSlugs.has(l.slug));

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="journal"
          icon={<IconChecklist size={26} />}
          title="Nhật ký học tập"
          description="Tick vào bài nào là coi như đã học xong bài đó. Tiến độ được lưu theo tài khoản Google của bạn."
        />

        {!session?.user && (
          <Alert
            icon={<IconInfoCircle size={18} />}
            color="brand"
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
                <Button type="submit">Đăng nhập với Google</Button>
              </form>
            </Stack>
          </Alert>
        )}

        {totalCount > 0 && (
          <div className="gradient-card" data-section="journal">
            <RingProgress
              size={84}
              thickness={8}
              // Ở 0% đầu bo tròn vẫn vẽ ra một chấm, trông như đã học được chút ít.
              roundCaps={completedCount > 0}
              rootColor="rgba(255, 255, 255, 0.28)"
              sections={[{ value: (completedCount / totalCount) * 100, color: 'white' }]}
              aria-label={`Đã học ${completedCount} trên ${totalCount} bài`}
              label={
                <Text ta="center" fw={800} size="sm" c="white">
                  {completedCount}/{totalCount}
                </Text>
              }
              style={{ flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <Text fw={800} c="white" size="lg" lh={1.25}>
                {currentLesson ? 'Tiến độ tổng' : 'Bạn đã tick hết tất cả các bài hiện có 🎉'}
              </Text>
              {currentLesson && (
                <Text size="sm" c="white" mt={4} className="gradient-card__soft">
                  Bài hiện tại:{' '}
                  <NavAnchor href={currentLesson.href} c="white" fw={700} underline="always">
                    {currentLesson.title}
                  </NavAnchor>
                </Text>
              )}
            </div>
          </div>
        )}

        <Stack gap="lg" mt="lg">
          {chapters.map((chapter) => (
            <div key={chapter.chapterNumber} style={chapterColorVars(chapter.chapterNumber)}>
              <Text fw={800} mb="xs">
                Chương {chapter.chapterNumber}
              </Text>
              <Card withBorder padding={0}>
                {chapter.lessons.map((lesson) => {
                  const locked = !canReadLesson({
                    category: EXERCISES_CATEGORY,
                    slug: lesson.slug,
                    hasFullAccess,
                  });
                  const done = completedSlugs.has(lesson.slug);

                  return (
                    <div key={lesson.slug} className="journal-row" data-done={done || undefined}>
                      <span className="num-bubble" aria-hidden>
                        {lesson.lessonNumber}
                      </span>
                      <NavAnchor href={lesson.href} fw={600} c="var(--mantine-color-text)" className="journal-row__title">
                        {lesson.title}
                      </NavAnchor>
                      {/*
                        Bài chưa mở khoá thì không hiện ô tick — tick một bài
                        chưa đọc được vừa vô nghĩa vừa làm sai con số tiến độ.
                        Việc chặn thật nằm ở toggleLessonCompletion.
                      */}
                      {locked ? (
                        <Badge
                          color="gray"
                          variant="light"
                          size="sm"
                          leftSection={<IconLock size={12} />}
                          style={{ flexShrink: 0 }}
                        >
                          Trả phí
                        </Badge>
                      ) : (
                        <LessonTickButton
                          lessonSlug={lesson.slug}
                          initialCompleted={done}
                          signedIn={Boolean(session?.user)}
                          label=""
                        />
                      )}
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </Stack>
      </Container>
    </AppLayout>
  );
}
