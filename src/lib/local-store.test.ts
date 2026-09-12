import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStore, type StoreHost } from './local-store';

/**
 * Trình duyệt giả: một `Map` thay cho `localStorage`, một `Map` thay cho phần
 * nghe sự kiện. Có `blocked` để dựng lại chế độ riêng tư — nơi mọi lần chạm vào
 * `localStorage` đều ném lỗi.
 */
function fakeHost() {
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

interface Options { level: number; hard: boolean }
const FALLBACK: Options = { level: 1, hard: false };

function optionsStore(browser: ReturnType<typeof fakeHost>) {
  return createLocalStore<Options>({
    key: 'test-options',
    fallback: FALLBACK,
    parse: (raw) => {
      const saved = JSON.parse(raw) as Partial<Options>;
      if (typeof saved.level !== 'number') throw new Error('thiếu level');
      return { level: saved.level, hard: saved.hard === true };
    },
    host: browser.host,
  });
}

describe('createLocalStore', () => {
  let browser: ReturnType<typeof fakeHost>;

  beforeEach(() => {
    browser = fakeHost();
  });

  it('chưa lưu gì thì trả về mặc định', () => {
    expect(optionsStore(browser).getSnapshot()).toEqual(FALLBACK);
  });

  it('đọc lại đúng thứ đã ghi', () => {
    const store = optionsStore(browser);
    store.save({ level: 3, hard: true });
    expect(store.getSnapshot()).toEqual({ level: 3, hard: true });
    expect(JSON.parse(browser.data.get('test-options') ?? '')).toEqual({ level: 3, hard: true });
  });

  it('bản lưu hỏng hoặc sai dạng thì lùi về mặc định, không ném lỗi', () => {
    browser.data.set('test-options', '{khong-phai-json');
    expect(optionsStore(browser).getSnapshot()).toEqual(FALLBACK);

    browser.data.set('test-options', '{"level":"ba"}');
    expect(optionsStore(browser).getSnapshot()).toEqual(FALLBACK);
  });

  it('trả về CÙNG MỘT đối tượng khi chưa có gì đổi', () => {
    const store = optionsStore(browser);
    store.save({ level: 2, hard: false });
    // Đây là điều kiện sống còn của `useSyncExternalStore`: tham chiếu mới mỗi
    // lần gọi là React vẽ lại vô tận.
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('máy chủ luôn thấy mặc định, dù máy người học đã lưu gì', () => {
    const store = optionsStore(browser);
    store.save({ level: 4, hard: true });
    expect(store.getServerSnapshot()).toEqual(FALLBACK);
  });

  it('ghi xong thì báo cho mọi nơi đang đọc', () => {
    const store = optionsStore(browser);
    const first = vi.fn();
    const second = vi.fn();
    store.subscribe(first);
    const unsubscribe = store.subscribe(second);

    store.save({ level: 5, hard: false });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.save({ level: 6, hard: false });
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('bỏ nghe thì gỡ luôn khỏi sự kiện của trình duyệt', () => {
    const store = optionsStore(browser);
    const unsubscribe = store.subscribe(() => {});
    expect(browser.listenerCount('storage')).toBe(1);
    unsubscribe();
    expect(browser.listenerCount('storage')).toBe(0);
  });

  it('tab khác sửa thì tab này thấy giá trị mới', () => {
    const store = optionsStore(browser);
    const onChange = vi.fn();
    store.subscribe(onChange);
    expect(store.getSnapshot()).toEqual(FALLBACK);

    browser.data.set('test-options', '{"level":9,"hard":true}');
    browser.fireStorage();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ level: 9, hard: true });
  });

  it('trình duyệt chặn lưu trữ thì vẫn chạy, và giữ lựa chọn trong phiên này', () => {
    const store = optionsStore(browser);
    browser.block(true);

    expect(store.getSnapshot()).toEqual(FALLBACK);
    expect(() => store.save({ level: 7, hard: true })).not.toThrow();
    // Ghi hỏng nhưng màn hình phải theo thứ vừa chọn, không được lùi về mặc định.
    expect(store.getSnapshot()).toEqual({ level: 7, hard: true });
  });

  it('ở máy chủ (không có trình duyệt) thì luôn là mặc định và không nổ', () => {
    const store = createLocalStore<Options>({
      key: 'test-options',
      fallback: FALLBACK,
      parse: (raw) => JSON.parse(raw) as Options,
      host: () => null,
    });
    expect(store.getSnapshot()).toEqual(FALLBACK);
    expect(() => store.subscribe(() => {})()).not.toThrow();
    expect(() => store.save({ level: 1, hard: true })).not.toThrow();
  });

  it('nhận được kiểu không phải JSON, ví dụ một chữ đơn', () => {
    const rail = createLocalStore<boolean>({
      key: 'tab-bar-rail',
      fallback: false,
      parse: (raw) => raw === 'expanded',
      serialize: (open) => (open ? 'expanded' : 'collapsed'),
      host: browser.host,
    });
    rail.save(true);
    expect(browser.data.get('tab-bar-rail')).toBe('expanded');
    expect(rail.getSnapshot()).toBe(true);
    rail.save(false);
    expect(browser.data.get('tab-bar-rail')).toBe('collapsed');
    expect(rail.getSnapshot()).toBe(false);
  });
});
