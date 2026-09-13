import { CHAPTER_RULES, kindsForChapter, type ExerciseKind } from './exercise-gen';

/**
 * Kho ôn luyện: một chương + một kiểu bài + một hạt giống = một bài tập.
 *
 * File này KHÔNG sinh nhạc — việc đó là của `exercise-gen.ts`. Ở đây chỉ có luật
 * đọc và dựng đường dẫn `/review/<chương>?kind=...&seed=...`, tách ra khỏi trang
 * vì đó là thứ duy nhất trong cả tính năng có thể sai lặng lẽ: một tham số hỏng
 * mà vẫn dựng ra bài thì người học tập một bài khác bài họ tưởng.
 *
 * **Vì sao hạt giống nằm trong ĐƯỜNG DẪN chứ không bốc ngẫu nhiên lúc vẽ:**
 * `generateExercise` cố ý sinh ra cùng một bài với cùng một `seed`, nên để hạt
 * giống trong đường dẫn thì trang dựng sẵn được ở máy chủ, tải lại không đổi bài,
 * và người học gửi được đường dẫn một bài cụ thể cho người khác. Bốc số lúc vẽ
 * thì mỗi lần tải lại là một bài khác — đang tập dở mà lỡ chạm nút tải lại là mất
 * bài, đúng kiểu hỏng mà người học không hiểu vì sao.
 */

/**
 * Hạt giống chạy trong khoảng `[1, SEED_MAX)`.
 *
 * Chặn trên để đường dẫn còn đọc được bằng mắt (sáu chữ số) và để `X:` trong
 * chuỗi ABC — `seed % 1000` — không nhảy lung tung. Không nhận 0 vì bộ bốc số
 * nhận hạt giống 0 thì mọi bài đều là một bài.
 */
export const SEED_MAX = 1_000_000;

export interface ReviewRequest {
  chapter: number;
  kindId: string;
  seed: number;
}

/** Các chương đã có luật sinh bài, thấp tới cao. */
export function reviewChapters(): number[] {
  return CHAPTER_RULES
    .map((r) => r.chapter)
    .filter((c) => kindsForChapter(c).length > 0)
    .sort((a, b) => a - b);
}

/** Các kiểu bài của một chương, để bày thành hàng chip cho người học chọn. */
export function reviewKinds(chapter: number): ExerciseKind[] {
  return reviewChapters().includes(chapter) ? kindsForChapter(chapter) : [];
}

/** Lấy một giá trị từ `searchParams`, nơi một khoá có thể lặp lại nhiều lần. */
function firstValue(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

/**
 * Đọc một yêu cầu ôn luyện từ đường dẫn, hoặc `null` nếu chương không có thật.
 *
 * Tham số hỏng thì **quay về mặc định**, không báo lỗi: kiểu bài lạ lấy kiểu đầu
 * tiên của chương, hạt giống hỏng lấy 1. Người học gõ tay hay sửa đường dẫn cho
 * vui vẫn ra một bài tập dùng được, thay vì một trang lỗi. Riêng CHƯƠNG thì trả
 * `null` để trang gọi `notFound()` — đoán hộ một chương khác là dạy sai tầm nốt.
 */
export function parseReviewRequest(raw: {
  chapter: string;
  kind?: string | string[];
  seed?: string | string[];
}): ReviewRequest | null {
  if (!/^\d+$/.test(raw.chapter)) return null;
  const chapter = Number(raw.chapter);

  const kinds = reviewKinds(chapter);
  if (kinds.length === 0) return null;

  const wantedKind = firstValue(raw.kind);
  const kind = kinds.find((k) => k.id === wantedKind) ?? kinds[0];

  return { chapter, kindId: kind.id, seed: parseSeed(firstValue(raw.seed)) };
}

/** Hạt giống hợp lệ từ chuỗi đường dẫn; mọi thứ khác về 1. */
export function parseSeed(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) return 1;
  const n = Number(raw);
  return n >= 1 && n < SEED_MAX ? n : 1;
}

/**
 * Hạt giống của *Bài khác*, tính từ hạt giống đang xem.
 *
 * Cố ý **tính được chứ không bốc ngẫu nhiên**: nút *Bài khác* nhờ vậy là một thẻ
 * `<a>` thường do máy chủ dựng sẵn, không cần một mẩu JavaScript nào và không làm
 * trang thành động. Đây là hàm nhân-cộng-lấy-dư quen thuộc; chất lượng ngẫu nhiên
 * không quan trọng, thứ quan trọng là **lần nào cũng ra một số khác số đang xem**
 * — bằng nhau thì nút bấm vào không có gì xảy ra và trông như app hỏng.
 */
export function nextSeed(seed: number): number {
  const next = (seed * 1103515245 + 12345) % SEED_MAX;
  if (next === seed || next < 1) return (seed % (SEED_MAX - 1)) + 1;
  return next;
}

/** Đường dẫn tới đúng một bài ôn luyện. */
export function reviewHref({ chapter, kindId, seed }: ReviewRequest): string {
  return `/review/${chapter}?kind=${encodeURIComponent(kindId)}&seed=${seed}`;
}
