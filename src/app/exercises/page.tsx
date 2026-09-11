import { redirect } from 'next/navigation';

/**
 * `/exercises` đã nhập vào `/path` (11/09/2026).
 *
 * Bản cũ là bản đồ ô tròn của riêng phần bài tập, còn `/journal` là cùng danh
 * sách đó dưới dạng hàng có ô tick. Hai trang vẽ một thứ theo hai kiểu, nên người
 * học phải nhớ trang nào dùng để làm gì — và cả hai đều bỏ sót phần lý thuyết.
 *
 * Giữ lại đường dẫn chứ không xoá: nó đã nằm trong `OVERVIEW.md`, trong lịch sử
 * trình duyệt của người đang học, và có thể trong link ai đó đã gửi đi.
 */
export default function ExercisesRedirect() {
  redirect('/path');
}
