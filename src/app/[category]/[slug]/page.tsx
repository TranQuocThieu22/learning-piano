import { getMarkdownContent, getAllMarkdownFiles } from '@/lib/markdown';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { LessonTickButton } from '@/components/LessonTickButton';
import { auth } from '@/auth';
import { getCompletedLessonSlugs } from '@/lib/progress';

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

  return (
    <AppLayout files={allFiles} user={session?.user ?? null} completedSlugs={completedSlugs}>
      {isExerciseLesson && (
        <LessonTickButton
          lessonSlug={slug}
          initialCompleted={completedSlugs.has(slug)}
          signedIn={Boolean(session?.user)}
        />
      )}
      <MarkdownViewer content={content} />
    </AppLayout>
  );
}
