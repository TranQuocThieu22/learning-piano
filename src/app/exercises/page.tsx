import { Container, Text, Title } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { ExerciseMap, type MapChapter } from '@/components/ExerciseMap';
import { auth } from '@/auth';
import { EXERCISES_CATEGORY, getAllLessons, getLessonsByChapter } from '@/lib/lessons';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';

/**
 * Bản đồ chặng của phần bài tập.
 *
 * Khác `/journal` ở chỗ dùng: nhật ký là nơi TICK bài đã xong (danh sách chữ, có
 * ô tick), còn trang này là nơi NHÌN cả chặng đường và nhảy tới bài cần tập (ô
 * tròn to, bấm bằng ngón cái). Hai việc khác nhau nên để hai trang, gộp lại thì
 * trang nào cũng làm nửa vời.
 */
export default async function ExercisesPage() {
  const session = await auth();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  const currentSlug = getAllLessons().find((l) => !completedSlugs.has(l.slug))?.slug ?? null;

  const chapters: MapChapter[] = getLessonsByChapter().map((chapter) => ({
    chapterNumber: chapter.chapterNumber,
    lessons: chapter.lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      href: lesson.href,
      lessonNumber: lesson.lessonNumber,
      done: completedSlugs.has(lesson.slug),
      locked: !canReadLesson({
        category: EXERCISES_CATEGORY,
        slug: lesson.slug,
        hasFullAccess,
      }),
      current: lesson.slug === currentSlug,
    })),
  }));

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <Title order={2} mb="xs">
          Bài tập
        </Title>
        <Text c="dimmed" mb="lg">
          Bấm vào một bài để mở. Ô viền đậm là bài bạn đang tới.
        </Text>
        <ExerciseMap chapters={chapters} />
      </Container>
    </AppLayout>
  );
}
