import { Badge, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { AppLayout } from '@/components/AppLayout';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { PageHeader } from '@/components/PageHeader';
import { listUpdates } from '@/lib/updates';

/**
 * **Có gì mới** — mọi bài cập nhật, mới nhất trên cùng.
 *
 * Cả nội dung hiện trọn trên MỘT trang, không có trang riêng cho từng bài: mỗi
 * bài chỉ dài vài đoạn, tách ra là bắt người học chạm thêm một lần rồi bấm quay
 * lại. Mỗi bài có `id` bằng slug nên vẫn dẫn link tới đúng chỗ được.
 *
 * Cố ý MIỄN PHÍ cho mọi người, không cổng chặn: đây là trang trả lời câu "trang
 * này còn ai làm không", mà người chưa mua mới là người cần câu trả lời đó nhất.
 */
export default function UpdatesPage() {
  const posts = listUpdates();

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="updates"
          icon={<IconSparkles size={26} />}
          title="Có gì mới"
          description="Web đổi gì thì ghi lại ở đây, mới nhất trên cùng."
        />

        {posts.length === 0 ? (
          <Text size="sm" c="dimmed">
            Chưa có bài cập nhật nào.
          </Text>
        ) : (
          <Stack gap="md">
            {posts.map((post) => (
              <article key={post.slug} id={post.slug} className="update-card">
                <Group gap="xs" mb={6} wrap="nowrap">
                  <Text size="xs" fw={700} c="dimmed">
                    {post.dateLabel}
                  </Text>
                  {post.nhan && (
                    <Badge variant="light" color="grape" size="sm" style={{ flexShrink: 0 }}>
                      {post.nhan}
                    </Badge>
                  )}
                </Group>

                {/* Tiêu đề in ở đây chứ không để trong thân bài, vì phải đứng
                    cạnh ngày và nhãn. Thân bài đã được cắt dòng `# ` tương ứng. */}
                <Title order={2} size="h4" lh={1.3} mb="xs">
                  {post.title}
                </Title>

                <MarkdownViewer content={post.body} />
              </article>
            ))}
          </Stack>
        )}
      </Container>
    </AppLayout>
  );
}
