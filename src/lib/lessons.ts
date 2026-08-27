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
