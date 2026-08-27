import type { MetadataRoute } from 'next';

/**
 * Manifest để người học "Thêm vào màn hình chính" trên Android/iOS.
 *
 * Lý do quan trọng với dự án này: mở bằng tab Chrome thường thì thanh địa chỉ
 * chiếm khoảng 56px chiều cao vĩnh viễn, cộng thêm thanh điều hướng dưới đáy —
 * trên điện thoại thì phần đọc bài chỉ còn lại rất ít. `display: 'standalone'`
 * bỏ hẳn thanh địa chỉ khi mở từ biểu tượng ngoài màn hình chính.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Piano Journey — Học piano từ số 0',
    short_name: 'Piano Journey',
    description: 'Giáo trình piano tự học theo từng chương, kèm máy đánh nhịp và bài luyện nhận nốt.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
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
