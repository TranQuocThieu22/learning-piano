import { Card, Container, Group, RingProgress, Stack, Text } from '@mantine/core';
import { IconMap2 } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PathChapterCard } from '@/components/PathChapterCard';
import { auth } from '@/auth';
import { canReadLesson } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';
import { flattenPath, getLearningPath, nextStep, shortTitle } from '@/lib/learning-path';
import { getCompletedLessonSlugs } from '@/lib/progress';

/**
 * Đường đi: danh sách chương, mỗi chương một thẻ có tiến độ riêng.
 *
 * Thay cho hai trang cũ `/exercises` (bản đồ ô tròn) và `/journal` (danh sách có
 * ô tick) — cả hai đều vẽ cùng một danh sách bài, chỉ khác cách bày, nên người
 * học phải nhớ trang nào dùng để làm gì. Cả hai đường dẫn cũ nay chuyển hướng về
 * đây.
 *
 * Trang này cố tình MỎNG: nó chỉ trả lời "tôi đang ở chương nào", còn việc học và
 * tick nằm trong trang chương. Bày hết bước của cả tám chương ra đây thì lại
 * thành đúng cái danh sách dài mà nó vừa thay.
 *
 * Cố ý KHÔNG có điểm số, chuỗi ngày hay huy hiệu — cùng tinh thần với ràng buộc ở
 * `AGENTS.md`: chỉ số ở đây để dễ tìm chỗ, không thúc người học đi nhanh hơn.
 */
export default async function PathPage() {
  const session = await auth();
  const path = getLearningPath();
  const allSteps = flattenPath(path);

  const completed = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();
  const hasFullAccess = await viewerHasFullAccess(session);

  const current = nextStep(allSteps, completed);
  const xongTong = allSteps.filter((s) => completed.has(s.slug)).length;

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="exercises"
          icon={<IconMap2 size={26} />}
          title="Đường đi"
          description="Mỗi chương gồm phần lý thuyết rồi tới các bài tập. Bấm vào chương để mở từng bước."
        />

        <Card withBorder radius="md" padding="md" mb="lg">
          <Group gap="md" wrap="nowrap">
            <RingProgress
              size={72}
              thickness={8}
              roundCaps
              sections={[
                {
                  value: allSteps.length === 0 ? 0 : (xongTong / allSteps.length) * 100,
                  color: 'orange',
                },
              ]}
              label={
                <Text ta="center" size="xs" fw={700}>
                  {xongTong}/{allSteps.length}
                </Text>
              }
            />
            <div style={{ minWidth: 0 }}>
              <Text fw={600}>
                {current ? `Đang tới: Chương ${current.chapterNumber}` : 'Đã xong cả giáo trình 🎉'}
              </Text>
              <Text size="sm" c="dimmed" lineClamp={2}>
                {current ? shortTitle(current.title) : 'Không còn bước nào chưa tick.'}
              </Text>
            </div>
          </Group>
        </Card>

        <Stack gap="sm">
          {path.map((chapter) => {
            const xong = chapter.steps.filter((s) => completed.has(s.slug)).length;
            const khoaCaChuong = chapter.steps.every(
              (s) => !canReadLesson({ category: s.category, slug: s.slug, hasFullAccess })
            );
            return (
              <PathChapterCard
                key={chapter.chapterNumber}
                chapterNumber={chapter.chapterNumber}
                title={
                  chapter.theory ? shortTitle(chapter.theory.title) : `${chapter.exercises.length} bài tập`
                }
                done={xong}
                total={chapter.steps.length}
                locked={khoaCaChuong}
                current={current?.chapterNumber === chapter.chapterNumber}
              />
            );
          })}
        </Stack>
      </Container>
    </AppLayout>
  );
}
