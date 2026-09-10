'use client';

import { useEffect } from 'react';

/**
 * Vào toàn màn hình ở lần chạm đầu tiên, để thanh trạng thái của điện thoại
 * (đồng hồ, pin, sóng) biến mất.
 *
 * Vì sao phải chạm mới được: trình duyệt CHỈ cho gọi `requestFullscreen()` trong
 * một cử chỉ thật của người dùng. Gọi lúc trang vừa nạp thì lời hứa bị từ chối
 * ngay, không có cách nào lách. Nên móc vào `pointerdown` đầu tiên — người học
 * mở app ra là chạm gì đó trong một hai giây đầu, gần như không thấy độ trễ.
 *
 * Bỏ qua khi KHÔNG cần thiết, để không cướp quyền của người dùng:
 *
 * - Đã ở `display-mode: fullscreen` (app cài từ manifest `display: 'fullscreen'`,
 *   xem `src/app/manifest.ts`) — hệ điều hành đã ẩn thanh trạng thái rồi.
 * - Màn hình rộng (từ 48em trở lên): trên máy tính, tự bung toàn màn hình khi
 *   người ta vừa bấm một cái là hành vi phiền, không phải tiện.
 * - Trình duyệt không có API (Safari trên iPhone chỉ cho video vào toàn màn
 *   hình) — ở đó app vẫn chạy bình thường, chỉ là còn thanh trạng thái.
 *
 * Đây là lớp thứ hai, không thay lớp thứ nhất: manifest `display: 'fullscreen'`
 * vẫn là cách sạch nhất, nhưng nó chỉ ăn với app đã cài LẠI sau lần đổi manifest.
 * Lớp này phủ nốt hai trường hợp còn lại — mở bằng tab trình duyệt, và app cài từ
 * trước vẫn đang chạy ở `standalone`.
 */
export function FullscreenOnFirstTap() {
  useEffect(() => {
    const el = document.documentElement;
    if (!el.requestFullscreen) return;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return;
    if (window.matchMedia('(min-width: 48em)').matches) return;

    const vaoToanManHinh = () => {
      // Người dùng có thể đã tự thoát toàn màn hình bằng cử chỉ của hệ điều hành.
      // Đòi lại ngay là giành quyền với họ, nên chỉ thử đúng một lần rồi thôi.
      window.removeEventListener('pointerdown', vaoToanManHinh);
      if (document.fullscreenElement) return;
      // Bị từ chối cũng không sao (trình duyệt chặn, người dùng từ chối): app
      // chạy y nguyên, chỉ là còn thanh trạng thái.
      el.requestFullscreen().catch(() => {});
    };

    window.addEventListener('pointerdown', vaoToanManHinh, { once: true });
    return () => window.removeEventListener('pointerdown', vaoToanManHinh);
  }, []);

  return null;
}
