import { Container, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { auth } from '@/auth';
import { getAllMarkdownFiles, getMarkdownContent } from '@/lib/markdown';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { viewerHasFullAccess } from '@/lib/access-server';

export const metadata = { title: 'Điều khoản sử dụng' };

/**
 * Nội dung nằm ở docs/legal/terms.md — CỐ Ý để ngoài `contentDirs` của
 * markdown.ts, nên `getAllMarkdownFiles()` không quét tới và trang này không lọt
 * vào thanh bên cùng các bài học. Vẫn viết bằng markdown để sửa câu chữ không
 * phải đụng vào code.
 */
export default async function TermsPage() {
  const content = getMarkdownContent('legal/terms.md');
  if (!content) notFound();

  const session = await auth();
  const allFiles = getAllMarkdownFiles();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  return (
    <AppLayout
      files={allFiles}
      user={session?.user ?? null}
      completedSlugs={completedSlugs}
      hasFullAccess={hasFullAccess}
    >
      <Container size="sm" px={0}>
        <MarkdownViewer content={content} />
        <Text size="xs" c="dimmed" mt="xl">
          Trang này áp dụng cho giai đoạn thử nghiệm miễn phí.
        </Text>
      </Container>
    </AppLayout>
  );
}
