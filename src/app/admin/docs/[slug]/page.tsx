import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { NavAnchor } from '@/components/NavAnchor';
import { listInternalDocs, readInternalDoc } from '@/lib/internal-docs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = listInternalDocs().find((entry) => entry.slug === slug);
  return { title: doc ? `Quản trị — ${doc.title}` : 'Quản trị — Tài liệu nội bộ' };
}

/**
 * Một tài liệu nội bộ.
 *
 * `readInternalDoc` tự chặn slug lạ nên tham số URL không trèo ra khỏi `docs/`
 * được; slug không hợp lệ và file không tồn tại đều rơi vào cùng một nhánh
 * `notFound()`, không phân biệt cho người dò đường dẫn biết cái nào là cái nào.
 */
export default async function AdminDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = readInternalDoc(slug);
  if (content === null) notFound();

  return (
    <>
      <NavAnchor href="/admin/docs" size="sm" c="dimmed">
        ← Mục lục tài liệu
      </NavAnchor>
      {/* Không bọc Container như trang bài học: tài liệu nội bộ đầy bảng nhiều
          cột và khối mã, giới hạn bề ngang là bắt chúng cuộn ngang liên tục. */}
      <Box mt="md">
        <MarkdownViewer content={content} />
      </Box>
    </>
  );
}
