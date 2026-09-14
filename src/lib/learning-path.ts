import { getAllMarkdownFiles, type MarkdownFile } from './markdown';
import { CHAPTERS_CATEGORY, EXERCISES_CATEGORY, neighborsOf } from './lessons';

/**
 * **Đường đi**: một chuỗi bước DUY NHẤT gồm các bài ngồi vào đàn, theo thứ tự học.
 *
 * Vì sao có file này (11/09/2026). Trước đó lý thuyết (`02-chapters`) và bài tập
 * (`03-exercises`) là hai dãy rời nhau, nên đọc xong lý thuyết Chương 3 mà bấm
 * *Bài tiếp theo* thì app nhảy sang **lý thuyết Chương 4**, bỏ qua cả sáu bài tập
 * của chương 3. Thứ duy nhất nối hai bên là một dòng chữ viết tay trong nội dung
 * ("Chuyển sang Chương 3 - Bài 1"), mà không phải chương nào cũng có.
 *
 * Hậu quả với người học đúng như lời chủ sản phẩm: *"phải qua lý thuyết rồi chọn
 * đúng bài tập rồi qua nhật ký nhớ bài nào vừa học rồi check"*. App không chở họ
 * đi, chỉ có bài văn chở.
 *
 * **Đổi 14/09/2026: lý thuyết ra khỏi đường đi.** Bản 11/09 trộn hai thư mục
 * thành `chuong-01 → chuong-01-bai-01 → …`, lý thuyết đứng đầu mỗi chương và
 * phải tick. Chủ sản phẩm thấy người học phải đọc cả trang chữ trước khi được
 * chạm phím, và chốt lại theo lối *tập trước, ai muốn thì đọc thêm*. Nay:
 *
 * ```
 * chuong-01-bai-01 → chuong-01-bai-02 → chuong-02-bai-01 → …
 * ```
 *
 * Bài lý thuyết vẫn còn nguyên và vẫn đọc được, chỉ đứng ngoài chuỗi: `theory`
 * của mỗi chương là một liên kết *Đọc thêm* — không tick, không đếm vào tiến độ,
 * không bị dòng nhắc vượt bài nhắc tới. Thứ bắt buộc phải biết để tập được thì
 * nằm ngay trong bài tập, đúng lúc cần. Chương chỉ có lý thuyết (Chương 0) không
 * còn là một chương trên đường đi. Lý do ghi ở `nhat-ky-quyet-dinh.md`.
 *
 * Phần dựng chuỗi (`buildPath`) nhận danh sách file qua tham số nên không chạm ổ
 * đĩa và kiểm thử được hết — cùng lối tách như `access.ts` / `access-server.ts`.
 */

/** Lý thuyết là bài đọc thêm của chương, bài tập là bài ngồi vào đàn — chỉ bài tập là bước. */
export type StepKind = 'theory' | 'exercise';

export interface PathStep {
  kind: StepKind;
  /** `chuong-03` với lý thuyết, `chuong-03-bai-01` với bài tập. */
  slug: string;
  category: string;
  title: string;
  href: string;
  chapterNumber: number;
  /** Chỉ bước bài tập mới có. Lý thuyết không đánh số bài. */
  lessonNumber?: number;
}

export interface PathChapter {
  chapterNumber: number;
  /**
   * Bài lý thuyết của chương, để dẫn tới như *Đọc thêm* — KHÔNG phải một bước.
   * `null` khi chương chưa soạn phần chữ.
   */
  theory: PathStep | null;
  exercises: PathStep[];
  /** Các bước phải làm của chương, theo thứ tự học. Chỉ gồm bài tập. */
  steps: PathStep[];
}

const THEORY_SLUG = /^chuong-(\d+)$/;
const EXERCISE_SLUG = /^chuong-(\d+)-bai-(\d+)$/;

/**
 * Dựng đường đi từ danh sách file. Thuần, không chạm ổ đĩa.
 *
 * File nào không theo mẫu đặt tên thì **bỏ qua chứ không đoán**: đoán sai vị trí
 * là người học bị đẩy sang một bài không liên quan giữa chừng, mà chẳng có gì
 * báo. Mẫu tên bị ràng bởi `scripts/check-lessons.mjs` nên lệch là biết ngay.
 */
export function buildPath(files: Pick<MarkdownFile, 'category' | 'slug' | 'title'>[]): PathChapter[] {
  const theoryOf = new Map<number, PathStep>();
  const exercisesOf = new Map<number, PathStep[]>();

  for (const file of files) {
    if (file.category === CHAPTERS_CATEGORY) {
      const m = THEORY_SLUG.exec(file.slug);
      if (!m) continue;
      const chapterNumber = Number(m[1]);
      theoryOf.set(chapterNumber, {
        kind: 'theory',
        slug: file.slug,
        category: file.category,
        title: file.title,
        href: `/${file.category}/${file.slug}`,
        chapterNumber,
      });
      continue;
    }

    if (file.category === EXERCISES_CATEGORY) {
      const m = EXERCISE_SLUG.exec(file.slug);
      if (!m) continue;
      const chapterNumber = Number(m[1]);
      const list = exercisesOf.get(chapterNumber) ?? [];
      list.push({
        kind: 'exercise',
        slug: file.slug,
        category: file.category,
        title: file.title,
        href: `/${file.category}/${file.slug}`,
        chapterNumber,
        lessonNumber: Number(m[2]),
      });
      exercisesOf.set(chapterNumber, list);
    }
  }

  // Chỉ chương có bài tập mới là chương trên đường đi — không có gì để ngồi vào
  // đàn thì không có bước nào để làm.
  const chapterNumbers = [...exercisesOf.keys()].sort((a, b) => a - b);

  return chapterNumbers.map((chapterNumber) => {
    const exercises = (exercisesOf.get(chapterNumber) ?? []).sort(
      (a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0)
    );
    return {
      chapterNumber,
      theory: theoryOf.get(chapterNumber) ?? null,
      exercises,
      steps: exercises,
    };
  });
}

/** Duỗi đường đi thành một dãy phẳng — thứ dùng cho *Bài tiếp theo* và đếm tiến độ. */
export function flattenPath(chapters: PathChapter[]): PathStep[] {
  return chapters.flatMap((c) => c.steps);
}

/** Đường đi thật, đọc từ thư mục nội dung. */
export function getLearningPath(): PathChapter[] {
  return buildPath(getAllMarkdownFiles());
}

/** Mọi bước theo thứ tự học. */
export function getAllSteps(): PathStep[] {
  return flattenPath(getLearningPath());
}

/** Một chương, hoặc `null` nếu số chương không có thật. */
export function getPathChapter(chapterNumber: number): PathChapter | null {
  return getLearningPath().find((c) => c.chapterNumber === chapterNumber) ?? null;
}

/**
 * Bước đầu tiên chưa tick — chỗ người học nên quay lại.
 *
 * Tick hết thì trả `null`, phía gọi tự quyết hiển thị gì. Cố ý KHÔNG trả về bước
 * cuối trong trường hợp đó: "học tiếp" mà trỏ vào bài đã xong là nói dối.
 */
export function nextStep(steps: PathStep[], completed: ReadonlySet<string>): PathStep | null {
  return steps.find((s) => !completed.has(s.slug)) ?? null;
}

/**
 * Bước chưa tick mà người học đang vượt qua khi mở bài `slug` — hoặc `null`.
 *
 * Trả về bước đó khi bài đang mở đứng **sau** chỗ người học nên quay lại
 * (`nextStep`). Đây là dữ liệu cho một dòng nhắc, **không phải ổ khoá**: đường đi
 * là gợi ý (`ChapterSteps.tsx`), người học vẫn đọc được bài đang mở. Chủ sản phẩm
 * hỏi có nên khoá bài sau theo bài trước (14/09/2026) và câu trả lời là không —
 * lý do ghi ở `nhat-ky-quyet-dinh.md`.
 *
 * Bài không nằm trên đường đi (Lộ trình, Đọc thêm) thì không có gì để vượt.
 */
export function skippedStep(
  steps: PathStep[],
  completed: ReadonlySet<string>,
  slug: string,
): PathStep | null {
  const here = steps.findIndex((s) => s.slug === slug);
  if (here === -1) return null;
  const pending = nextStep(steps, completed);
  if (!pending) return null;
  return steps.indexOf(pending) < here ? pending : null;
}

/**
 * Bước trước và bước sau của một bài đang mở, tính trên ĐƯỜNG ĐI chứ không trong
 * riêng thư mục của nó.
 *
 * Cuối bài tập cuối của một chương, *Bài tiếp theo* dẫn thẳng sang bài tập đầu
 * của chương sau — không dừng ở trang lý thuyết nữa (đổi 14/09/2026).
 *
 * Bài không nằm trên đường đi (lý thuyết, Lộ trình, Đọc thêm) thì trả về hai
 * `null` và giao diện không hiện gì, vì chúng là bài rời chứ không có thứ tự.
 */
export function stepNeighbors(slug: string): { prev: PathStep | null; next: PathStep | null } {
  return neighborsOf(getAllSteps(), slug);
}

/**
 * Cắt tiền tố "Chương 3:" / "Chương 3 - Bài 1:" khỏi tiêu đề để hiển thị.
 *
 * Vì sao cần: tiêu đề trong file markdown viết đủ ("Chương 3 - Bài 1: Đọc nốt
 * trên dòng kẻ phụ") và điều đó ĐÚNG cho file — mở ra là biết mình đang ở đâu.
 * Nhưng trên trang chương thì số chương đã nằm ở tiêu đề trang, số bài đã nằm ở
 * nhãn ngay trên tiêu đề, nên in lại lần nữa là ba lần cùng một chữ trong một màn
 * hình — mà chỗ bị đẩy đi lại chính là phần tên thật của bài. Đo trên khung
 * 390px: dòng mô tả ở `/path` bị cắt giữa chừng thành "Chương 3: Đọc bản nhạc
 * (Sight-…" trong khi bỏ tiền tố thì hiện đủ.
 *
 * Cắt chứ không sửa file: tiêu đề trong file còn dùng cho `<title>` của trang,
 * cho mục lục, và cho chính bài khi mở ra — ở những chỗ đó thì tiền tố có ích.
 *
 * Không khớp mẫu thì trả nguyên văn. Thà để thừa chữ còn hơn cắt nhầm mất tên bài.
 */
const TITLE_PREFIX = /^Chương\s+\d+\s*(?:[-–—]\s*Bài\s+\d+\s*)?[:.]\s*/u;

export function shortTitle(title: string): string {
  const cat = title.replace(TITLE_PREFIX, '').trim();
  // Tiêu đề chỉ gồm mỗi tiền tố thì cắt xong còn chuỗi rỗng — lúc đó giữ bản gốc,
  // vì một dòng trống trên giao diện tệ hơn một dòng thừa chữ.
  return cat.length > 0 ? cat : title;
}
