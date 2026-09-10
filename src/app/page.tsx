import { Container } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { HomeScreen } from '@/components/HomeScreen';
import { auth } from '@/auth';
import { getAllMarkdownFiles } from '@/lib/markdown';
import { getAllLessons } from '@/lib/lessons';
import { getCompletedLessonSlugs } from '@/lib/progress';

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

  const completedCount = allLessons.filter((l) => completedSlugs.has(l.slug)).length;
  const continueLesson = allLessons.find((l) => !completedSlugs.has(l.slug)) ?? null;
  const firstLesson = allLessons[0] ?? null;

  return (
    <AppLayout>
      {/* Không lặp lại tiêu đề "Piano Journey" ở đây: thanh tiêu đề ngay phía
          trên đã ghi rồi, viết lần nữa chỉ đẩy nút "Học tiếp" xuống thấp. */}
      <Container size="sm" px={0}>
        <HomeScreen
          user={session?.user ?? null}
          completedCount={completedCount}
          totalCount={allLessons.length}
          continueLesson={
            continueLesson ? { title: continueLesson.title, href: continueLesson.href } : null
          }
          firstLesson={firstLesson ? { title: firstLesson.title, href: firstLesson.href } : null}
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
