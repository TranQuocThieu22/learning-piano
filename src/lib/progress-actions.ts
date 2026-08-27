'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/db';
import { lessonCompletions } from '@/db/schema';
import { getAllLessons } from './lessons';
import { slugSchema } from './validation';

export interface ToggleResult {
  ok: boolean;
  completed: boolean;
  error?: string;
}

/**
 * Ticks or un-ticks a lesson as done for the signed-in user. This is the
 * server-side counterpart of LessonTickButton — it's what actually persists
 * "học xong bài này" instead of the old video-submission workflow.
 */
export async function toggleLessonCompletion(
  lessonSlug: string
): Promise<ToggleResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, completed: false, error: 'not-signed-in' };
  }

  // Đầu vào từ client: chưa chắc là chuỗi. Kiểm hình dạng trước, rồi mới đối
  // chiếu với danh sách bài có thật — hai bước khác nhau, cần cả hai.
  const parsed = slugSchema.safeParse(lessonSlug);
  if (!parsed.success) {
    return { ok: false, completed: false, error: 'unknown-lesson' };
  }
  const slug = parsed.data;

  const isKnownLesson = getAllLessons().some((l) => l.slug === slug);
  if (!isKnownLesson) {
    return { ok: false, completed: false, error: 'unknown-lesson' };
  }

  const existing = await db
    .select({ id: lessonCompletions.id })
    .from(lessonCompletions)
    .where(
      and(
        eq(lessonCompletions.userId, userId),
        eq(lessonCompletions.lessonSlug, slug)
      )
    )
    .limit(1);

  let completed: boolean;
  if (existing.length > 0) {
    await db
      .delete(lessonCompletions)
      .where(eq(lessonCompletions.id, existing[0].id));
    completed = false;
  } else {
    await db.insert(lessonCompletions).values({ userId, lessonSlug: slug });
    completed = true;
  }

  revalidatePath('/nhat-ky');
  revalidatePath('/[category]/[slug]', 'page');

  return { ok: true, completed };
}
