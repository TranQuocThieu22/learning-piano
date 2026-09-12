import { Container } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { HomeScreen } from '@/components/HomeScreen';
import type { MapChapter } from '@/components/ExerciseMap';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { flattenPath, getLearningPath, nextStep, shortTitle } from '@/lib/learning-path';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';
import { latestUpdate } from '@/lib/updates';

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

  /*
   * Tính trên ĐƯỜNG ĐI (lý thuyết + bài tập), không riêng bài tập — đổi
   * 11/09/2026. Nên "Học tiếp" nay có thể dẫn thẳng vào một chương lý thuyết, và
   * đó là đúng: nếu chưa đọc chương thì bài tập của nó chưa có nghĩa gì.
   */
  const path = getLearningPath();
  const allSteps = flattenPath(path);

  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  // Bài cập nhật mới nhất, để màn hình chủ nói được web vừa đổi gì.
  const baiMoiNhat = latestUpdate();

  const completedCount = allSteps.filter((s) => completedSlugs.has(s.slug)).length;
  const continueLesson = nextStep(allSteps, completedSlugs);
  const firstLesson = allSteps[0] ?? null;

  /*
   * Chương đang học: chương của bước đang tới, hoặc chương cuối nếu đã tick hết —
   * lúc đó bản đồ toàn ô xanh là lời khen đúng chỗ. Dựng từ cùng một nguồn với
   * `/path/[chapter]` để hai nơi không bao giờ đếm khác nhau.
   */
  const chapterNumber = (continueLesson ?? allSteps.at(-1))?.chapterNumber;
  const chapter = path.find((c) => c.chapterNumber === chapterNumber);
  const currentChapter: MapChapter | null = chapter
    ? {
        chapterNumber: chapter.chapterNumber,
        lessons: chapter.steps.map((step) => ({
          slug: step.slug,
          title: shortTitle(step.title),
          href: step.href,
          kind: step.kind,
          lessonNumber: step.lessonNumber,
          done: completedSlugs.has(step.slug),
          locked: !canReadLesson({ category: step.category, slug: step.slug, hasFullAccess }),
          current: step.slug === continueLesson?.slug,
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
          totalCount={allSteps.length}
          continueLesson={
            continueLesson
              ? { title: shortTitle(continueLesson.title), href: continueLesson.href }
              : null
          }
          firstLesson={
            firstLesson ? { title: shortTitle(firstLesson.title), href: firstLesson.href } : null
          }
          currentChapter={currentChapter}
          roadmapHref={
            // Trỏ đích danh `roadmap` chứ không lấy file đầu thư mục: xếp theo
            // slug thì `phuong-phap-luyen-tap` đứng trước, mà đó là bài phụ.
            allFiles.some((f) => f.category === '01-roadmap' && f.slug === 'roadmap')
              ? '/01-roadmap/roadmap'
              : null
          }
          extraHref={firstOf(allFiles, EXTRA_CATEGORY)}
          latestUpdate={
            baiMoiNhat
              ? {
                  title: baiMoiNhat.title,
                  dateLabel: baiMoiNhat.dateLabel,
                  nhan: baiMoiNhat.nhan,
                }
              : null
          }
        />
      </Container>
    </AppLayout>
  );
}
