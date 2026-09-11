import { redirect } from 'next/navigation';

/**
 * `/journal` đã nhập vào `/path` (11/09/2026).
 *
 * Nhật ký tồn tại để TICK bài đã xong. Nay tick được ngay trên trang chương
 * (`/path/[chapter]`) và ở cuối mỗi bài, nên đi một vòng riêng chỉ để tick là
 * thừa — mà đó đúng là chỗ chủ sản phẩm kêu "rắc rối nhức đầu": học xong phải
 * sang nhật ký, tự nhớ vừa học bài nào, rồi mới tick được.
 *
 * Giữ lại đường dẫn chứ không xoá: hai bài tập trong giáo trình có link trỏ tới
 * đây, và người đang học có thể đã lưu nó.
 */
export default function JournalRedirect() {
  redirect('/path');
}
