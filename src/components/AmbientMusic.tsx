'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ambientAllowedOn, pieceById } from '@/lib/ambient';
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
    const piece = pieceById(settings.piece);
    const engine = (engineRef.current ??= new AmbientEngine(settings.volume, piece));
    engine.setVolume(settings.volume);
    /*
     * Đặt bài TRƯỚC chỗ ngó `engine.running` bên dưới, vì hai dòng đó ăn khớp với
     * nhau: bài đổi thật thì `setPiece` DỪNG bộ phát, `running` thành `false`, và
     * nhánh bật nhạc phía dưới tự bật lại bằng bài mới. Cùng một bài thì `setPiece`
     * không làm gì, `running` vẫn `true`, chuyển trang vẫn liền mạch.
     *
     * Đây cũng là lý do `setPiece` cố ý không tự gọi `start()` — xem chú thích của
     * nó trong `ambient-engine.ts`, gọi cả hai nơi là sinh ra bộ phát mồ côi.
     */
    engine.setPiece(piece);

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
     * Bốn cái chốt ở đây, cái nào thiếu cũng ra cùng một hậu quả: nhạc nền kêu
     * lúc lẽ ra phải im.
     *
     * - `huy`: effect đã bị thay thế thì đừng gắn gì thêm nữa.
     * - `engineRef.current === engine`: lúc cú chạm tới, bộ phát trong closure có
     *   thể đã bị thay bằng bộ khác (React ở chế độ Strict gỡ rồi gắn lại
     *   component ngay trong một nhịp). Gọi `start()` lên bộ cũ là dựng lại một
     *   bối cảnh âm thanh thứ hai, chạy song song và không đường nào tắt.
     * - `ambientHeld()`: **hỏi lại ngay tại lúc chạm**. Cú chạm có thể là chạm vào
     *   đúng nút *Nghe thử*, và trong khoảng giữa `pointerdown` với `click` thì
     *   chưa ai kịp giữ chỗ — nhưng nếu một nguồn tiếng khác đã giữ từ trước
     *   (người học đang mở phần tập với đàn rồi chạm ra ngoài) thì tuyệt đối không
     *   được bật.
     * - `goBoNgheCham()` gọi NGAY ĐẦU `thu`: `{ once: true }` chỉ tự gỡ đúng cái
     *   vừa bắn, cái kia còn nguyên. Chạm màn hình thì listener `keydown` vẫn nằm
     *   đó, và vì lần này `start()` thành công nên effect không chạy lại, hàm dọn
     *   dẹp không bao giờ được gọi — listener ấy sống tới hết phiên. Về sau người
     *   học bấm *Nghe thử* rồi lỡ gõ một phím là nhạc nền bật lên đè lên bản nhạc.
     */
    let goBoNgheCham: (() => void) | null = null;
    let huy = false;

    void engine.start().then((keu) => {
      if (keu || huy) return;
      const thu = () => {
        goBoNgheCham?.();
        if (huy) return;
        if (engineRef.current !== engine) return;
        if (ambientHeld()) return;
        void engine.start();
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
