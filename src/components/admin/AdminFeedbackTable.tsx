'use client';

import { Badge, Table, Text } from '@mantine/core';

/**
 * Bảng phản hồi cuối bài ở khu quản trị.
 *
 * Phải là client component: Mantine là client component, nên đọc thuộc tính ghép
 * như `Table.Tbody` từ một Server Component trả về undefined và React ném
 * "Element type is invalid" — trang 500 mà không chỉ ra file nào (bẫy 1). Cùng
 * lý do với `AdminPaymentTables.tsx` và `AdminUserTable.tsx`.
 *
 * Dữ liệu định dạng sẵn ở server rồi truyền xuống, để component này không phải
 * đụng tới `admin-data.ts` (vốn là `'server-only'`).
 */

export interface FeedbackRowView {
  lessonSlug: string;
  tenBai: string;
  stuck: number;
  ok: number;
  lanCuoi: string;
}

export function AdminFeedbackTable({ rows }: { rows: FeedbackRowView[] }) {
  if (rows.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Chưa có phản hồi nào. Nút phản hồi nằm ở cuối mỗi bài lý thuyết và bài tập.
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={560}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Bài</Table.Th>
            <Table.Th>Chưa hiểu</Table.Th>
            <Table.Th>Ổn</Table.Th>
            <Table.Th>Phản hồi gần nhất</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.lessonSlug}>
              <Table.Td>
                <Text size="sm" fw={500}>{row.tenBai}</Text>
                <Text size="xs" c="dimmed">{row.lessonSlug}</Text>
              </Table.Td>
              <Table.Td>
                {/* Chỉ tô màu khi thật sự có người kêu khó: tô cả số 0 thì mắt
                    không còn lướt qua bảng mà nhặt ra được dòng đáng đọc. */}
                {row.stuck > 0 ? (
                  <Badge color="orange" variant="light" size="lg">{row.stuck}</Badge>
                ) : (
                  <Text size="sm" c="dimmed">0</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{row.ok}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{row.lanCuoi}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
