import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { lessonCompletions } from '@/db/schema';

/** Slugs (e.g. "chuong-01-bai-01") this user has ticked as done. */
export async function getCompletedLessonSlugs(
  userId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ lessonSlug: lessonCompletions.lessonSlug })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, userId));

  return new Set(rows.map((r) => r.lessonSlug));
}

export async function isLessonCompleted(
  userId: string,
  lessonSlug: string
): Promise<boolean> {
  const rows = await db
    .select({ id: lessonCompletions.id })
    .from(lessonCompletions)
    .where(
      and(
        eq(lessonCompletions.userId, userId),
        eq(lessonCompletions.lessonSlug, lessonSlug)
      )
    )
    .limit(1);

  return rows.length > 0;
}
