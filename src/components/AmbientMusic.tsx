'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ambientAllowedOn } from '@/lib/ambient';
import { AMBIENT_HOLD_EVENT, ambientHeld } from '@/lib/ambient-hold';
import { AmbientEngine } from '@/lib/ambient-engine';
import { useAmbientSettings } from '@/hooks/useAmbientSettings';

/**
 * Bộ phát nhạc nền. Không vẽ gì lên màn hình — nút bật tắt nằm ở
 * `AmbientControl.tsx` trên màn hình chủ.
 *
 * Đặt trong `src/app/layout.tsx` chứ KHÔNG trong `AppLayout`: mỗi trang tự dựng
 * `AppLayout` của nó, nên chuyển trang là React gỡ cây cũ đi — nhạc sẽ đứt quãng
 * và bắt đầu lại từ đầu ở mỗi lần bấm. Layout gốc thì sống suốt phiên.
 *
 * Nhạc tắt trong hai trường hợp, rồi tự bật lại:
 *
 * - **Theo trang**: máy đánh nhịp và bài luyện nhận nốt (`ambientAllowedOn`) —
 *   hai trang tồn tại để phát tiếng.
 * - **Theo sự kiện**: có nguồn tiếng khác đang kêu (`ambient-hold.ts`) — người
 *   học bấm nghe bản nhạc mẫu, hoặc mở phần tập với đàn. Đọc phần chữ của bài
 *   thì nhạc vẫn chạy, vì lúc đó chẳng có tiếng gì khác.
 */

/** Đăng ký giữ chỗ là kho ngoài React, nên đọc bằng `useSyncExternalStore`. */
function subscribeHold(onChange: () => void): () => void {
  window.addEventListener(AMBIENT_HOLD_EVENT, onChange);
  return () => window.removeEventListener(AMBIENT_HOLD_EVENT, onChange);
}
export function AmbientMusic() {
  const pathname = usePathname();
  const engineRef = useRef<AmbientEngine | null>(null);
  const settings = useAmbientSettings();
  const coTiengKhac = useSyncExternalStore(subscribeHold, ambientHeld, () => false);

  useEffect(() => {
    return () => {
      // Điều hướng trong Next.js không tải lại trang: không dẹp thì tiếng vẫn kêu
      // sau khi component biến mất. Xem bẫy 15 trong `bay-ky-thuat.md`.
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const nenKeu = settings.on && ambientAllowedOn(pathname) && !coTiengKhac;

    if (!nenKeu) {
      engineRef.current?.stop();
      return;
    }

    const engine = (engineRef.current ??= new AmbientEngine(settings.volume));
    engine.setVolume(settings.volume);

    let huy = false;
    void engine.start().then((keu) => {
      if (keu || huy) return;
      /*
       * Trình duyệt còn treo bối cảnh âm thanh vì chưa có thao tác nào của người
       * dùng — xảy ra khi người học đã bật nhạc từ lần trước rồi tải lại trang.
       * Không có cách nào lách, chỉ còn cách đợi cú chạm đầu tiên.
       */
      const thu = () => void engine.start();
      window.addEventListener('pointerdown', thu, { once: true });
      window.addEventListener('keydown', thu, { once: true });
    });

    return () => {
      huy = true;
      engineRef.current?.stop();
    };
  }, [settings, pathname, coTiengKhac]);

  return null;
}
