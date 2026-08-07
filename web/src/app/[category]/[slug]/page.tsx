import { getMarkdownContent, getAllMarkdownFiles } from '@/lib/markdown';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';

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

  return (
    <AppLayout files={allFiles}>
      <MarkdownViewer content={content} />
    </AppLayout>
  );
}
