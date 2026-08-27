import { getMarkdownContent, getAllMarkdownFiles } from '@/lib/markdown';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { LessonTickButton } from '@/components/LessonTickButton';
import { auth } from '@/auth';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { LessonLocked } from '@/components/LessonLocked';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';

export async function generateStaticParams() {
  const files = getAllMarkdownFiles();
  return files.map(file => ({
    category: file.category,
    slug: file.slug,
  }));
}

export default async function Page({ params }: { params: Promise<{ category: string, slug: string }> }) {
  const { category, slug } = await params;
  const content = getMarkdownContent(`${category}/${slug}.md`);
  const allFiles = getAllMarkdownFiles();

  if (!content) {
    notFound();
  }

  const session = await auth();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  const isExerciseLesson = category === '03-exercises';

  // Cổng chặn nội dung trả phí. Kiểm ở server và KHÔNG gửi nội dung xuống khi
  // chưa có quyền — làm mờ ở client là khoá giả, ai xem mã nguồn cũng đọc được.
  // Tính một lần rồi dùng cho cả nội dung lẫn ổ khoá ở thanh bên.
  const hasFullAccess = await viewerHasFullAccess(session);
  const allowed = canReadLesson({ category, slug, hasFullAccess });

  const fileTitle =
    allFiles.find((f) => f.category === category && f.slug === slug)?.title ?? slug;

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs} hasFullAccess={hasFullAccess}>
      {allowed ? (
        <>
          {isExerciseLesson && (
            <LessonTickButton
              lessonSlug={slug}
              initialCompleted={completedSlugs.has(slug)}
              signedIn={Boolean(session?.user)}
            />
          )}
          <MarkdownViewer content={content} />
        </>
      ) : (
        <LessonLocked title={fileTitle} signedIn={Boolean(session?.user)} />
      )}
    </AppLayout>
  );
}
