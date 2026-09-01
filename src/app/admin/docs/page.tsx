import { Card, Group, Stack, Text } from '@mantine/core';
import { NavAnchor } from '@/components/NavAnchor';
import { listInternalDocs } from '@/lib/internal-docs';

export const metadata = { title: 'Quản trị — Tài liệu nội bộ' };

/**
 * Mục lục tài liệu nội bộ, đọc thẳng từ `docs/` lúc dựng trang.
 *
 * Cửa chặn nằm ở `src/app/admin/layout.tsx`: người không nằm trong
 * `ADMIN_EMAILS` nhận `notFound()` chứ không phải trang báo thiếu quyền.
 */
export default function AdminDocsPage() {
  const docs = listInternalDocs();

  return (
    <Stack gap="sm">
      <Text c="dimmed" size="sm">
        {docs.length} tài liệu, đọc thẳng từ repo nên luôn khớp với bản đang deploy.
        Không có liên kết nào từ giao diện người học trỏ tới đây.
      </Text>

      {docs.map((doc) => (
        <Card key={doc.slug} withBorder padding="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <NavAnchor href={`/admin/docs/${doc.slug}`} fw={600}>
              {doc.title}
            </NavAnchor>
            {doc.updatedAt && (
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {doc.updatedAt}
              </Text>
            )}
          </Group>
          {doc.summary && (
            <Text size="sm" c="dimmed" mt={6}>
              {doc.summary}
            </Text>
          )}
        </Card>
      ))}
    </Stack>
  );
}
