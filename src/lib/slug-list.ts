import { createLocalStore, type LocalStore, type StoreHost } from './local-store';

/**
 * Kho nhớ một **danh sách slug bài học** trên máy người học.
 *
 * Hai chỗ dùng, cùng một hình dạng dữ liệu nên dùng chung một cửa:
 *
 * - `playedThroughStore` — bài nào người học đã đánh trọn một lượt với đàn.
 * - Kho trong `SkipAheadNotice.tsx` — bài nào người học đã bấm *Học tiếp* dù chưa
 *   tick bài phía trước, để không nhắc lại ở bài đó nữa.
 *
 * Lưu trên máy chứ không vào database: cả hai chỉ để **khen** hoặc để **thôi
 * nhắc**, mất đi (đổi máy, xoá dữ liệu trình duyệt) thì người học không mất gì —
 * tiến độ thật vẫn là nút tick, nằm trong database. Đổi lại được đỡ một migration
 * và một Server Action cho thứ không ai cần tra lại.
 */

/** Đọc danh sách đã lưu. Ném lỗi khi sai dạng — kho bắt và lùi về rỗng. */
export function parseSlugList(raw: string): string[] {
  const saved: unknown = JSON.parse(raw);
  if (!Array.isArray(saved)) throw new Error('không phải danh sách');
  // Bỏ phần tử lạ chứ không vứt cả danh sách: một phần tử hỏng không đáng làm mất hết.
  return [...new Set(saved.filter((s): s is string => typeof s === 'string' && s.length > 0))];
}

/**
 * Thêm một slug. Đã có thì trả về **đúng danh sách cũ**, để chỗ gọi so `===` là
 * biết khỏi ghi — không ghi thì kho không báo, không có lần vẽ lại thừa.
 */
export function withSlug(list: readonly string[], slug: string): readonly string[] {
  return list.includes(slug) ? list : [...list, slug];
}

const EMPTY: readonly string[] = [];

export function createSlugListStore(
  key: string,
  host?: () => StoreHost | null,
): LocalStore<readonly string[]> {
  return createLocalStore<readonly string[]>({ key, fallback: EMPTY, parse: parseSlugList, host });
}

/** Ghi thêm một slug vào kho, bỏ qua nếu đã có. */
export function addSlug(store: LocalStore<readonly string[]>, slug: string): void {
  const current = store.getSnapshot();
  const next = withSlug(current, slug);
  if (next !== current) store.save(next);
}

/**
 * Bài đã được đánh trọn một lượt với đàn, trên máy này.
 *
 * Khoá lưu đừng đổi — đổi là người học mất hết dòng khen đã có.
 */
export const playedThroughStore = createSlugListStore('pj-played-through');
