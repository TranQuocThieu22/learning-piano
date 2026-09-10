'use client';

import { useSyncExternalStore } from 'react';
import {
  AMBIENT_DEFAULT,
  AMBIENT_EVENT,
  AMBIENT_STORAGE_KEY,
  parseAmbient,
  type AmbientSettings,
} from '@/lib/ambient';

/**
 * Đọc cài đặt nhạc nền từ localStorage, và vẽ lại khi nó đổi.
 *
 * Dùng `useSyncExternalStore` chứ không phải `useState` + `useEffect`, vì đây
 * đúng là một kho dữ liệu NGOÀI React: hai component ở hai nhánh khác nhau của
 * cây (bộ phát ở layout gốc, công tắc ở màn hình chủ) cùng đọc một chỗ, và chỗ
 * đó còn đổi được từ tab khác.
 *
 * `getServerSnapshot` trả về mặc định, nên HTML dựng ở máy chủ luôn là "tắt" và
 * không có cảnh báo hydration; React tự vẽ lại bằng giá trị thật ngay sau đó.
 */

let daNho: AmbientSettings = AMBIENT_DEFAULT;
let chuoiDaNho: string | null = null;

function subscribe(onChange: () => void): () => void {
  window.addEventListener(AMBIENT_EVENT, onChange);
  // `storage` chỉ bắn sang TAB KHÁC, nên vẫn cần sự kiện riêng cho tab hiện tại.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(AMBIENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Phải trả về CÙNG MỘT đối tượng khi dữ liệu không đổi, nếu không React thấy
 * tham chiếu mới mỗi lần và vẽ lại vô tận. Nên so chuỗi thô rồi mới parse.
 */
function getSnapshot(): AmbientSettings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AMBIENT_STORAGE_KEY);
  } catch {
    // Trình duyệt chặn đọc (chế độ riêng tư): coi như chưa lưu gì.
    return AMBIENT_DEFAULT;
  }
  if (raw !== chuoiDaNho) {
    chuoiDaNho = raw;
    daNho = parseAmbient(raw);
  }
  return daNho;
}

function getServerSnapshot(): AmbientSettings {
  return AMBIENT_DEFAULT;
}

export function useAmbientSettings(): AmbientSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Ghi cài đặt mới rồi báo cho mọi nơi đang đọc. */
export function saveAmbientSettings(next: AmbientSettings): void {
  try {
    localStorage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Không lưu được thì nhạc vẫn chạy trong phiên này, chỉ là lần mở sau không
    // nhớ. Không đáng để báo lỗi cho người học.
  }
  window.dispatchEvent(new Event(AMBIENT_EVENT));
}
