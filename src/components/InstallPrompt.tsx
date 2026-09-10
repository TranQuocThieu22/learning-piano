'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CloseButton, Group, Paper, Text } from '@mantine/core';

/**
 * Mời người học trên điện thoại thêm web vào màn hình chính.
 *
 * **Đây không phải app tải từ cửa hàng.** Dự án đã chốt không làm app mobile
 * (xem `nhat-ky-quyet-dinh.md`); thứ này chỉ đặt một biểu tượng ngoài màn hình
 * chính, mở ra thì chạy toàn màn hình không có thanh địa chỉ — `manifest.ts` đã
 * lo phần đó từ trước, chỉ thiếu lời mời.
 *
 * Vì sao đáng làm: con số quyết định của đợt beta là *bao nhiêu người đi hết
 * Chương 1*, mà muốn đi hết thì phải quay lại nhiều buổi. Một biểu tượng trên
 * màn hình chính là lối quay lại ngắn nhất — ngắn hơn nhớ tên miền, ngắn hơn tìm
 * lại link trong Messenger.
 *
 * Ba nguyên tắc, sửa gì thì đừng phá:
 *
 * 1. **Không chen ngang.** Chờ 25 giây rồi mới hiện, và hiện thành thanh dưới
 *    đáy chứ không phải hộp thoại che bài đọc. Người vừa bấm từ Facebook sang
 *    cần được đọc trước đã.
 * 2. **Tắt là thôi.** Đóng một lần thì im 30 ngày.
 * 3. **Không mời thứ không làm được.** Chỉ hiện khi thật sự cài được: hoặc trình
 *    duyệt đã báo cài được, hoặc đang là Safari trên iOS. Chrome trên iOS không
 *    thêm được vào màn hình chính, nên với nó không hiện gì cả.
 */

const STORAGE_KEY = 'pj-install-dismissed-at';
const SNOOZE_DAYS = 30;
const DELAY_MS = 25_000;

/** Sự kiện riêng của Chromium, chưa có trong lib DOM chuẩn. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Đang chạy từ biểu tượng ngoài màn hình chính rồi thì không mời nữa.
 *
 * Phải hỏi cả BA kiểu hiển thị, không riêng `standalone`: `display-mode` chỉ khớp
 * đúng kiểu đang chạy, mà manifest khai `fullscreen` (xem `src/app/manifest.ts`).
 * Chỉ hỏi `standalone` thì app đã cài vẫn bị coi là chưa cài, và 25 giây sau khi
 * mở là hiện thanh mời "thêm vào màn hình chính" ngay bên trong chính nó.
 * `minimal-ui` để phòng trình duyệt lùi về kiểu đó theo chuỗi dự phòng của manifest.
 */
function alreadyInstalled(): boolean {
  const modes = '(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)';
  if (window.matchMedia(modes).matches) return true;
  // iOS không hỗ trợ display-mode, nó dùng thuộc tính riêng trên navigator.
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Safari trên iOS — trình duyệt DUY NHẤT trên iOS thêm được vào màn hình chính,
 * và nó không có API nào để mời, chỉ còn cách chỉ đường bằng lời.
 *
 * iPadOS từ 13 khai user agent giống hệt máy Mac, nên phải nhận thêm bằng số
 * điểm chạm. Chrome (CriOS), Firefox (FxiOS) và Edge (EdgiOS) trên iOS đều dùng
 * WebKit nhưng không cài được, nên phải loại ra.
 */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const iPhone = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (!iPhone && !iPadOS) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function snoozed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const days = (Date.now() - Number(raw)) / 86_400_000;
    return Number.isFinite(days) && days < SNOOZE_DAYS;
  } catch {
    // Chế độ riêng tư hoặc trình duyệt chặn lưu trữ: coi như chưa từng tắt.
    return false;
  }
}

export function InstallPrompt() {
  const [mode, setMode] = useState<'none' | 'button' | 'ios'>('none');
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  const dismiss = useCallback(() => {
    setMode('none');
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Không lưu được thì thôi, lần sau hiện lại. Không đáng để vỡ giao diện.
    }
  }, []);

  useEffect(() => {
    // Đăng ký service worker. Nó không cache gì, chỉ tồn tại để Chrome chịu phát
    // sự kiện beforeinstallprompt — xem chú thích trong public/sw.js.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Đăng ký hỏng thì chỉ mất lời mời trên Android, phần còn lại vẫn chạy.
      });
    }

    if (alreadyInstalled() || snoozed()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (event: Event) => {
      // Chặn lời mời mặc định để tự chọn thời điểm hiện, thay vì để trình duyệt
      // bật lên ngay giây đầu tiên.
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      timer = setTimeout(() => setMode('button'), DELAY_MS);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (isIosSafari()) {
      timer = setTimeout(() => setMode('ios'), DELAY_MS);
    }

    // Cài xong thì thanh mời phải biến mất ngay, không đợi tải lại trang.
    const onInstalled = () => dismiss();
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [dismiss]);

  const install = useCallback(async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    setMode('none');
    await deferred.prompt();
    // Dù họ đồng ý hay từ chối cũng không mời lại: sự kiện này chỉ dùng được một
    // lần, và hỏi lại người vừa từ chối là làm phiền.
    deferredRef.current = null;
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Bỏ qua, xem chú thích ở dismiss().
    }
  }, []);

  if (mode === 'none') return null;

  return (
    <Paper
      shadow="md"
      withBorder
      p="sm"
      hiddenFrom="sm"
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        // Chừa chỗ cho thanh điều hướng của điện thoại, giống các lớp .safe-*
        // trong globals.css — thiếu nó thì nút bị thanh dưới đáy che mất.
        bottom: 'calc(8px + env(safe-area-inset-bottom))',
        zIndex: 300,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start" gap="xs">
        <div style={{ minWidth: 0 }}>
          <Text size="sm" fw={600}>
            Thêm Piano Journey vào màn hình chính
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {mode === 'ios'
              ? 'Bấm nút Chia sẻ ở thanh dưới, rồi chọn “Thêm vào MH chính”.'
              : 'Mở nhanh như một ứng dụng, không còn thanh địa chỉ chiếm chỗ.'}
          </Text>
        </div>
        <Group gap="xs" wrap="nowrap">
          {mode === 'button' && (
            <Button size="xs" onClick={install}>
              Thêm
            </Button>
          )}
          <CloseButton aria-label="Đóng lời mời cài đặt" onClick={dismiss} />
        </Group>
      </Group>
    </Paper>
  );
}
