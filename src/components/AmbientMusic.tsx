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
 * Chuyển trang KHÔNG làm nhạc đứt: bộ phát sống ở layout gốc, và effect bên dưới
 * chỉ động vào nó khi trạng thái mong muốn đổi chứ không phải mỗi lần đổi đường
 * dẫn.
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
    const engine = (engineRef.current ??= new AmbientEngine(settings.volume));
    engine.setVolume(settings.volume);

    if (!nenKeu) {
      engine.stop();
      return;
    }

    /*
     * Đang kêu rồi thì ĐỂ YÊN — đây là chỗ giữ cho nhạc chạy liền mạch khi
     * chuyển trang.
     *
     * Effect này chạy lại mỗi lần `pathname` đổi, mà trước đây nó dừng nhạc
     * trong hàm dọn dẹp rồi bật lại: mỗi lần bấm sang trang khác là một quãng
     * lặng chừng một giây rồi bài nhạc quay về đầu vòng hợp âm. Nay chỉ động vào
     * bộ phát khi trạng thái MONG MUỐN đổi (bật/tắt, hoặc có tiếng khác chen
     * vào), còn chuyển trang không đổi gì thì không làm gì cả.
     *
     * Cũng vì vậy mà hàm dọn dẹp ở đây KHÔNG được gọi `stop()`. Việc dẹp hẳn lúc
     * component bị gỡ do effect phía trên lo.
     */
    if (engine.running) return;

    /*
     * Chờ cú chạm đầu tiên rồi thử lại, vì trình duyệt chỉ cho phát tiếng trong
     * một cử chỉ thật của người dùng.
     *
     * Hai cái chốt ở đây đều đã từng thiếu và đều gây ra cùng một hậu quả — hai
     * bộ phát cùng kêu, bấm tắt chỉ tắt được một:
     *
     * - `huy`: effect đã bị thay thế thì đừng gắn gì thêm nữa.
     * - `engineRef.current === engine`: lúc cú chạm tới, bộ phát trong closure có
     *   thể đã bị thay bằng bộ khác (React ở chế độ Strict gỡ rồi gắn lại
     *   component ngay trong một nhịp). Gọi `start()` lên bộ cũ là dựng lại một
     *   bối cảnh âm thanh thứ hai, chạy song song và không đường nào tắt.
     */
    let goBoNgheCham: (() => void) | null = null;
    let huy = false;

    void engine.start().then((keu) => {
      if (keu || huy) return;
      const thu = () => {
        if (engineRef.current === engine) void engine.start();
      };
      window.addEventListener('pointerdown', thu, { once: true });
      window.addEventListener('keydown', thu, { once: true });
      goBoNgheCham = () => {
        window.removeEventListener('pointerdown', thu);
        window.removeEventListener('keydown', thu);
      };
    });

    // Cố ý KHÔNG gọi `stop()` ở đây — xem chú thích phía trên.
    return () => {
      huy = true;
      goBoNgheCham?.();
    };
  }, [settings, pathname, coTiengKhac]);

  return null;
}
