import { Text } from '@mantine/core';
import { AdminFeedbackTable } from '@/components/admin/AdminFeedbackTable';
import { listLessonFeedback } from '@/lib/admin-data';
import { getAllSteps } from '@/lib/learning-path';

export const metadata = { title: 'Quản trị — Phản hồi bài học' };

/** Luôn đọc dữ liệu mới: trang quản trị mà hiện số liệu cũ thì vô dụng. */
export const dynamic = 'force-dynamic';

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default async function AdminFeedbackPage() {
  const rows = await listLessonFeedback();

  /*
   * Đổi slug thành tên bài ở SERVER rồi mới truyền xuống.
   *
   * `getAllSteps()` đọc thư mục `docs/`, mà bảng kia là client component — nó
   * không đọc được đĩa. Slug trần vẫn in kèm bên dưới tên: bài nào mới soạn mà
   * chưa có phản hồi nào thì không tra ra tên, lúc đó slug là thứ duy nhất còn
   * dùng được để đi tìm file.
   */
  const tenTheoSlug = new Map(getAllSteps().map((s) => [s.slug, s.title]));

  const tongStuck = rows.reduce((n, r) => n + r.stuck, 0);

  return (
    <>
      <Text c="dimmed" size="sm" mb="md">
        {rows.length} bài đã có phản hồi, trong đó <b>{tongStuck}</b> lượt báo chưa hiểu.
        Bài xếp trên là bài nhiều người thấy khó nhất — viết lại bài đó trước.
      </Text>
      <AdminFeedbackTable
        rows={rows.map((r) => ({
          lessonSlug: r.lessonSlug,
          tenBai: tenTheoSlug.get(r.lessonSlug) ?? r.lessonSlug,
          stuck: r.stuck,
          ok: r.ok,
          lanCuoi: formatTime(r.lastAt),
        }))}
      />
    </>
  );
}
