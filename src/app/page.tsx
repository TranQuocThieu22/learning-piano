import { Container } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { HomeScreen } from '@/components/HomeScreen';
import type { MapChapter } from '@/components/ExerciseMap';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { EXERCISES_CATEGORY, getAllLessons, getLessonsByChapter } from '@/lib/lessons';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';

const EXTRA_CATEGORY = '07-doc-them';

/** Trang đầu tiên của một thư mục nội dung, theo thứ tự slug. */
function firstOf(files: ReturnType<typeof getAllMarkdownFiles>, category: string) {
  const file = files
    .filter((f) => f.category === category)
    .sort((a, b) => a.slug.localeCompare(b.slug))[0];
  return file ? `/${file.category}/${file.slug}` : null;
}

export default async function Home() {
  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const allLessons = getAllLessons();

  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  const completedCount = allLessons.filter((l) => completedSlugs.has(l.slug)).length;
  const continueLesson = allLessons.find((l) => !completedSlugs.has(l.slug)) ?? null;
  const firstLesson = allLessons[0] ?? null;

  /*
   * Chương đang học: chương của bài đang tới, hoặc chương cuối nếu đã tick hết —
   * lúc đó bản đồ toàn ô xanh là lời khen đúng chỗ. Dựng giống hệt `/exercises`
   * để hai nơi không bao giờ vẽ khác nhau.
   */
  const chapterNumber = (continueLesson ?? allLessons.at(-1))?.chapterNumber;
  const chapter = getLessonsByChapter().find((c) => c.chapterNumber === chapterNumber);
  const currentChapter: MapChapter | null = chapter
    ? {
        chapterNumber: chapter.chapterNumber,
        lessons: chapter.lessons.map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          href: lesson.href,
          lessonNumber: lesson.lessonNumber,
          done: completedSlugs.has(lesson.slug),
          locked: !canReadLesson({ category: EXERCISES_CATEGORY, slug: lesson.slug, hasFullAccess }),
          current: lesson.slug === continueLesson?.slug,
        })),
      }
    : null;

  return (
    <AppLayout>
      {/* Cố ý không có tiêu đề trang: người học vừa mở app ra, họ biết mình
          đang ở đâu rồi. Một dòng "Piano Journey" nữa chỉ đẩy nút "Học tiếp"
          xuống thấp, mà đó mới là thứ họ mở app lên để bấm. */}
      <Container size="sm" px={0}>
        <HomeScreen
          user={session?.user ?? null}
          completedCount={completedCount}
          totalCount={allLessons.length}
          continueLesson={
            continueLesson ? { title: continueLesson.title, href: continueLesson.href } : null
          }
          firstLesson={firstLesson ? { title: firstLesson.title, href: firstLesson.href } : null}
          currentChapter={currentChapter}
          roadmapHref={
            // Trỏ đích danh `roadmap` chứ không lấy file đầu thư mục: xếp theo
            // slug thì `phuong-phap-luyen-tap` đứng trước, mà đó là bài phụ.
            allFiles.some((f) => f.category === '01-roadmap' && f.slug === 'roadmap')
              ? '/01-roadmap/roadmap'
              : null
          }
          extraHref={firstOf(allFiles, EXTRA_CATEGORY)}
        />
      </Container>
    </AppLayout>
  );
}
