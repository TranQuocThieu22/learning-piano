import { getAllMarkdownFiles } from './markdown';

export interface LessonInfo {
  slug: string; // e.g. "chuong-01-bai-01"
  title: string; // full H1 from the markdown file
  chapterNumber: number;
  lessonNumber: number;
  href: string; // link to the exercise page
}

export interface ChapterGroup {
  chapterNumber: number;
  lessons: LessonInfo[];
}

export const EXERCISES_CATEGORY = '03-exercises';
const SLUG_PATTERN = /^chuong-(\d+)-bai-(\d+)$/;

/**
 * Every "bài" (lesson) that can be ticked off as done, in chương/bài order.
 * Backed by the exercise files in docs/03-exercises — this is the same unit
 * of granularity the old docs/01-roadmap/progress.md checklist used.
 */
export function getAllLessons(): LessonInfo[] {
  const files = getAllMarkdownFiles().filter(
    (f) => f.category === EXERCISES_CATEGORY
  );

  const lessons: LessonInfo[] = [];
  for (const file of files) {
    const match = file.slug.match(SLUG_PATTERN);
    if (!match) continue; // skip anything that doesn't follow the naming convention
    lessons.push({
      slug: file.slug,
      title: file.title,
      chapterNumber: Number(match[1]),
      lessonNumber: Number(match[2]),
      href: `/${file.category}/${file.slug}`,
    });
  }

  lessons.sort((a, b) =>
    a.chapterNumber !== b.chapterNumber
      ? a.chapterNumber - b.chapterNumber
      : a.lessonNumber - b.lessonNumber
  );

  return lessons;
}

export function getLessonsByChapter(): ChapterGroup[] {
  const lessons = getAllLessons();
  const groups = new Map<number, LessonInfo[]>();

  for (const lesson of lessons) {
    const group = groups.get(lesson.chapterNumber) ?? [];
    group.push(lesson);
    groups.set(lesson.chapterNumber, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chapterNumber, chapterLessons]) => ({
      chapterNumber,
      lessons: chapterLessons,
    }));
}

/** Một mắt xích trong chuỗi bài, đủ để dựng nút Bài trước / Bài tiếp theo. */
export interface LessonLink {
  slug: string;
  title: string;
  href: string;
}

export const CHAPTERS_CATEGORY = '02-chapters';

/**
 * Hai bài kề trước và kề sau trong một chuỗi đã sắp thứ tự.
 *
 * Tách riêng phần thuần này (không chạm ổ đĩa) để kiểm thử được mọi nhánh, giống
 * cách `access.ts` tách khỏi `access-server.ts`. Bài không có trong chuỗi thì trả
 * về hai `null` — an toàn hơn là đoán bừa vị trí.
 */
export function neighborsOf<T extends { slug: string }>(
  ordered: T[],
  slug: string
): { prev: T | null; next: T | null } {
  const index = ordered.findIndex((item) => item.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

/**
 * Chuỗi bài của một thư mục nội dung, theo đúng thứ tự học.
 *
 * Chỉ hai thư mục có thứ tự thật: bài tập (chương/bài) và lý thuyết (chương).
 * Lộ trình và Đọc thêm là các bài rời, xâu chúng thành chuỗi chỉ tạo ra một thứ
 * tự giả rồi người học tưởng phải đọc lần lượt.
 */
export function getOrderedLessons(category: string): LessonLink[] {
  if (category === EXERCISES_CATEGORY) {
    return getAllLessons().map(({ slug, title, href }) => ({ slug, title, href }));
  }

  if (category === CHAPTERS_CATEGORY) {
    return getAllMarkdownFiles()
      .filter((f) => f.category === CHAPTERS_CATEGORY)
      // Slug dạng `chuong-00`, số luôn hai chữ số nên so sánh chuỗi là đủ.
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((f) => ({ slug: f.slug, title: f.title, href: `/${f.category}/${f.slug}` }));
  }

  return [];
}

/** Bài trước và bài sau của một bài đang mở. */
export function getLessonNeighbors(category: string, slug: string) {
  return neighborsOf(getOrderedLessons(category), slug);
}
