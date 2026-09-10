import type { MetadataRoute } from 'next';

/**
 * Manifest để người học "Thêm vào màn hình chính" trên Android/iOS.
 *
 * Lý do quan trọng với dự án này: mở bằng tab Chrome thường thì thanh địa chỉ
 * chiếm khoảng 56px chiều cao vĩnh viễn, cộng thêm thanh điều hướng dưới đáy —
 * trên điện thoại thì phần đọc bài chỉ còn lại rất ít.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Piano Journey — Học piano từ số 0',
    short_name: 'Piano Journey',
    description: 'Giáo trình piano tự học theo từng chương, kèm máy đánh nhịp và bài luyện nhận nốt.',
    start_url: '/',
    /*
     * `fullscreen` chứ không phải `standalone`: bỏ luôn cả thanh trạng thái
     * (đồng hồ, pin, sóng) chứ không chỉ thanh địa chỉ.
     *
     * Chiều cao là thứ khan hiếm nhất khi tập: điện thoại xoay ngang chỉ còn
     * khoảng 360px, mà một dòng khuông nhạc đã ăn gần hết. Thanh trạng thái lấy
     * thêm khoảng 24-30px nữa — đủ để thẻ điều khiển bị đẩy khỏi màn hình.
     *
     * Đổi lại: mở từ biểu tượng ngoài màn hình chính thì KHÔNG còn thấy đồng hồ
     * ở bất cứ trang nào, kể cả lúc chỉ đọc bài. Đây là lựa chọn đã cân nhắc,
     * xem `docs/_internal/nhat-ky-quyet-dinh.md`. Vuốt từ mép trên là thanh
     * trạng thái hiện lại tạm thời.
     *
     * Chỉ có tác dụng khi mở từ biểu tượng đã cài. Mở bằng tab trình duyệt thì
     * không đổi gì, và iOS bỏ qua trường này (vẫn như `standalone`) — cả hai
     * đều lùi về đúng hành vi cũ, không có gì hỏng.
     *
     * Máy đã cài app từ trước phải GỠ RỒI CÀI LẠI mới nhận kiểu hiển thị mới:
     * Chrome đọc lại manifest theo lịch riêng của nó, không đổi ngay sau deploy.
     */
    display: 'fullscreen',
    // KHÔNG khai `orientation` ở đây. Đặt 'portrait-primary' là khoá cứng màn
    // hình dọc: xoay ngang máy thì app không xoay theo. Khuông nhạc và bảng
    // trong bài học cần bề ngang, nên phải để người học tự quyết.
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'vi',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
