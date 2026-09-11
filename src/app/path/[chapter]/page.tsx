import { Container, Group, Progress, Stack, Text } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconMap2 } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ChapterSteps, type ChapterStepView } from '@/components/ChapterSteps';
import { NavButton } from '@/components/NavButton';
import { PageHeader } from '@/components/PageHeader';
import { auth } from '@/auth';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';
import { getAllSteps, getLearningPath, nextStep, shortTitle } from '@/lib/learning-path';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { chapterColorVars } from '@/lib/chapter-colors';

/**
 * Một chương, bày ra thành từng bước: lý thuyết trước, rồi các bài tập của chương.
 *
 * Đây là "một chỗ" mà chủ sản phẩm xin ngày 11/09/2026. Trước đó một buổi học
 * phải đi ba trang: *Mục lục* để đọc lý thuyết → *Bài tập* để mò đúng bài → *Nhật
 * ký* để nhớ xem vừa học bài nào rồi tick. Nay mở chương ra là đủ cả ba việc, và
 * tick ngay trên danh sách chứ không phải mở bài rồi cuộn xuống đáy.
 *
 * Vì sao theo CHƯƠNG chứ không phải một trang cuốn chiếu cả 33 bước: máy đặt trên
 * giá nhạc, mỗi lần nhìn chỉ nên thấy phần việc đang làm. Một màn dài 33 dòng thì
 * lần nào cũng phải cuộn đi tìm.
 */

export function generateStaticParams() {
  return getLearningPath().map((c) => ({ chapter: String(c.chapterNumber) }));
}

export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: raw } = await params;

  /*
   * Chỉ nhận số nguyên viết thường, không dấu cộng, không khoảng trắng. `Number`
   * một mình quá rộng — "3.0", " 3 ", "0x3" đều ra 3 và thành ra vài đường dẫn
   * khác nhau cùng trỏ một chương, chia nhỏ cache mà chẳng được gì.
   */
  if (!/^\d+$/.test(raw)) notFound();
  const chapterNumber = Number(raw);

  const path = getLearningPath();
  const chapter = path.find((c) => c.chapterNumber === chapterNumber);
  if (!chapter) notFound();

  const session = await auth();
  const completed = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  // "Bạn đang ở đây" tính trên CẢ giáo trình, không riêng chương này — nếu không
  // thì chương nào mở ra cũng có một bước tự nhận là chỗ đang tới.
  const currentSlug = nextStep(getAllSteps(), completed)?.slug ?? null;

  const steps: ChapterStepView[] = chapter.steps.map((step) => ({
    slug: step.slug,
    title: shortTitle(step.title),
    href: step.href,
    kind: step.kind,
    lessonNumber: step.lessonNumber,
    done: completed.has(step.slug),
    locked: !canReadLesson({ category: step.category, slug: step.slug, hasFullAccess }),
    current: step.slug === currentSlug,
  }));

  const xong = steps.filter((s) => s.done).length;
  const index = path.findIndex((c) => c.chapterNumber === chapterNumber);
  const truoc = index > 0 ? path[index - 1] : null;
  const sau = index < path.length - 1 ? path[index + 1] : null;

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <div style={chapterColorVars(chapterNumber)}>
          <PageHeader
            section="exercises"
            icon={<IconMap2 size={26} />}
            title={`Chương ${chapterNumber}`}
            description={
              chapter.theory
                ? shortTitle(chapter.theory.title)
                : 'Các bài tập của chương này, theo thứ tự nên học.'
            }
          />
        </div>

        {/* Chỉ một dòng số: "Chương N" đã nằm ở tiêu đề trang ngay phía trên. */}
        <Stack gap="xs" mb="lg">
          <Text size="sm" fw={600}>
            {xong}/{steps.length} bước đã xong
          </Text>
          <Progress
            value={steps.length === 0 ? 0 : (xong / steps.length) * 100}
            size="md"
            radius="xl"
            color="orange"
            aria-label={`Tiến độ chương ${chapterNumber}`}
          />
        </Stack>

        <ChapterSteps steps={steps} signedIn={Boolean(session?.user)} />

        {!session?.user && (
          <Text size="xs" c="dimmed" mt="md" ta="center">
            Đăng nhập ở Trang chủ để app nhớ những bước bạn đã xong.
          </Text>
        )}

        {/* Sang chương kế là bước cuối của một buổi học, nên nút nằm ở cuối trang. */}
        <Group justify="space-between" mt="xl" gap="sm" wrap="nowrap">
          {truoc ? (
            <NavButton
              href={`/path/${truoc.chapterNumber}`}
              variant="default"
              leftSection={<IconArrowLeft size={18} />}
            >
              Chương {truoc.chapterNumber}
            </NavButton>
          ) : (
            <span />
          )}
          {sau && (
            <NavButton
              href={`/path/${sau.chapterNumber}`}
              rightSection={<IconArrowRight size={18} />}
            >
              Chương {sau.chapterNumber}
            </NavButton>
          )}
        </Group>
      </Container>
    </AppLayout>
  );
}
