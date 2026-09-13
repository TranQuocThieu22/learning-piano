'use client';

import { createLocalStore } from '@/lib/local-store';
import {
  AMBIENT_DEFAULT,
  AMBIENT_STORAGE_KEY,
  parseAmbient,
  type AmbientSettings,
} from '@/lib/ambient';
import { useLocalStore } from './useLocalStore';

/**
 * Cài đặt nhạc nền, đọc từ `localStorage` và vẽ lại khi nó đổi.
 *
 * Đây đúng là một kho dữ liệu NGOÀI React: hai component ở hai nhánh khác nhau
 * của cây (bộ phát ở layout gốc, công tắc ở màn hình chủ) cùng đọc một chỗ, và
 * chỗ đó còn đổi được từ tab khác. Phần máy móc nằm ở `createLocalStore`.
 *
 * `parseAmbient` nhận thẳng `string | null` vì `lib/ambient.ts` còn dùng nó ở
 * chỗ khác, nên ở đây chỉ việc chuyển tiếp.
 */
const store = createLocalStore<AmbientSettings>({
  key: AMBIENT_STORAGE_KEY,
  fallback: AMBIENT_DEFAULT,
  parse: parseAmbient,
});

export function useAmbientSettings(): AmbientSettings {
  return useLocalStore(store);
}

/**
 * Đọc cài đặt đang lưu NGAY LÚC GỌI, ngoài vòng vẽ của React.
 *
 * Dành cho chỗ chạy trễ hơn lần vẽ sinh ra nó — listener chờ cú chạm đầu tiên
 * trong `AmbientMusic.tsx`. Chỗ đó cầm một bản chụp cài đặt từ lúc gắn listener,
 * mà giữa hai thời điểm ấy người học kịp gạt tắt; hỏi lại kho là hỏi đúng thứ
 * đang có thật. Vẫn chỉ một cửa: kho nằm nguyên trong file này.
 */
export function readAmbientSettings(): AmbientSettings {
  return store.getSnapshot();
}

/** Ghi cài đặt mới rồi báo cho mọi nơi đang đọc. */
export function saveAmbientSettings(next: AmbientSettings): void {
  store.save(next);
}
