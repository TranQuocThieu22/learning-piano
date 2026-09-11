import { getAllMarkdownFiles, type MarkdownFile } from './markdown';
import { CHAPTERS_CATEGORY, EXERCISES_CATEGORY, neighborsOf } from './lessons';

/**
 * **Đường đi**: một chuỗi bước DUY NHẤT nối lý thuyết với bài tập.
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
 * Ở đây trộn hai thư mục thành một chuỗi theo đúng thứ tự học:
 *
 * ```
 * chuong-00 → chuong-01 → chuong-01-bai-01 → chuong-01-bai-02 → chuong-02 → …
 * ```
 *
 * Tức trong mỗi chương, **lý thuyết đứng trước bài tập của chính chương đó**.
 * Chương 0 chỉ có lý thuyết và đó là bình thường, không phải thiếu file.
 *
 * Phần dựng chuỗi (`buildPath`) nhận danh sách file qua tham số nên không chạm ổ
 * đĩa và kiểm thử được hết — cùng lối tách như `access.ts` / `access-server.ts`.
 */

/** Bước lý thuyết là bài đọc, bước bài tập là bài ngồi vào đàn. */
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
  /** `null` khi chương chưa soạn phần chữ — vẫn dựng chương, không bỏ qua. */
  theory: PathStep | null;
  exercises: PathStep[];
  /** Mọi bước của chương theo thứ tự học, lý thuyết trước. */
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

  const chapterNumbers = [...new Set([...theoryOf.keys(), ...exercisesOf.keys()])].sort(
    (a, b) => a - b
  );

  return chapterNumbers.map((chapterNumber) => {
    const theory = theoryOf.get(chapterNumber) ?? null;
    const exercises = (exercisesOf.get(chapterNumber) ?? []).sort(
      (a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0)
    );
    return {
      chapterNumber,
      theory,
      exercises,
      steps: theory ? [theory, ...exercises] : exercises,
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
 * Bước trước và bước sau của một bài đang mở, tính trên ĐƯỜNG ĐI chứ không trong
 * riêng thư mục của nó.
 *
 * Đây là chỗ nút *Bài tiếp theo* đổi nghĩa: cuối lý thuyết Chương 3 nay dẫn sang
 * bài tập Chương 3 - Bài 1, và cuối bài tập cuối của chương dẫn sang lý thuyết
 * chương sau. Trước đó nó chỉ đi trong một thư mục nên nhảy cóc qua cả chương.
 *
 * Bài không nằm trên đường đi (Lộ trình, Đọc thêm) thì trả về hai `null` và giao
 * diện không hiện gì — đúng như cũ, vì chúng là bài rời chứ không có thứ tự.
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
