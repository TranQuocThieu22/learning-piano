import type { StoreHost } from '../local-store';

/**
 * Trình duyệt giả: một `Map` thay cho `localStorage`, một `Map` thay cho phần
 * nghe sự kiện. Có `blocked` để dựng lại chế độ riêng tư — nơi mọi lần chạm vào
 * `localStorage` đều ném lỗi.
 */
export function fakeHost() {
  const data = new Map<string, string>();
  const listeners = new Map<string, Set<() => void>>();
  let blocked = false;

  const host: StoreHost = {
    getItem(key) {
      if (blocked) throw new Error('chế độ riêng tư');
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      if (blocked) throw new Error('chế độ riêng tư');
      data.set(key, value);
    },
    addEventListener(type, onEvent) {
      const set = listeners.get(type) ?? new Set();
      set.add(onEvent);
      listeners.set(type, set);
    },
    removeEventListener(type, onEvent) {
      listeners.get(type)?.delete(onEvent);
    },
  };

  return {
    host: () => host,
    data,
    block(next: boolean) { blocked = next; },
    /** Dựng lại cảnh tab khác vừa sửa `localStorage`. */
    fireStorage() {
      for (const onEvent of listeners.get('storage') ?? []) onEvent();
    },
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
  };
}
