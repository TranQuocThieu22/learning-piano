'use client';

import { useSyncExternalStore } from 'react';
import type { LocalStore } from '@/lib/local-store';

/**
 * Đọc một kho `localStorage` và vẽ lại khi nó đổi.
 *
 * Ba dòng, nhưng phải nằm một chỗ: `useSyncExternalStore` là thứ duy nhất nối
 * được React với một kho dữ liệu NGOÀI React mà không lệch hydration — xem phần
 * giải thích dài trong `src/lib/local-store.ts`. Component chỉ việc gọi hàm này
 * và không cần biết gì về `localStorage`.
 */
export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
