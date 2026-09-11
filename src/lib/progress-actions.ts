'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/db';
import { lessonCompletions } from '@/db/schema';
import { getAllSteps } from './learning-path';
import { slugSchema } from './validation';
import { canReadLesson } from './access';
import { viewerHasFullAccess } from './access-server';

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

  /*
   * Đối chiếu với ĐƯỜNG ĐI, tức cả lý thuyết lẫn bài tập (mở rộng 11/09/2026 —
   * trước đó chỉ `getAllLessons()`, tức riêng bài tập).
   *
   * Lấy luôn cả bước chứ không chỉ hỏi có/không: cần `category` thật của nó cho
   * bước kiểm quyền ngay dưới. Đóng đinh `EXERCISES_CATEGORY` như bản cũ thì nay
   * sẽ xét một slug lý thuyết bằng luật của thư mục bài tập — hai thư mục này
   * tình cờ cùng luật giá nên chưa sai ngay, nhưng đó là trùng hợp chứ không
   * phải bảo đảm, và `PAID_CATEGORIES` trong `access.ts` đổi một lần là thành lỗ
   * hổng im lặng.
   */
  const step = getAllSteps().find((s) => s.slug === slug);
  if (!step) {
    return { ok: false, completed: false, error: 'unknown-lesson' };
  }

  // Không cho tick bài chưa mở khoá. Ẩn nút ở giao diện là chưa đủ: Server
  // Action là endpoint HTTP thật, ai biết id của nó đều gọi được mà không cần
  // nhìn thấy nút. Tick một bài chưa đọc được cũng làm hỏng chính con số tiến
  // độ mà người học dựa vào.
  const hasFullAccess = await viewerHasFullAccess(session);
  if (!canReadLesson({ category: step.category, slug, hasFullAccess })) {
    return { ok: false, completed: false, error: 'locked' };
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

  /*
   * Mọi nơi đang vẽ tiến độ đều phải dựng lại, nếu không người học tick xong quay
   * ra vẫn thấy con số cũ rồi tưởng tick hỏng và tick lại — mà tick lại là BỎ
   * tick, đúng ngược ý họ.
   */
  revalidatePath('/'); // màn hình chủ: nút Học tiếp và bản đồ chương
  revalidatePath('/path'); // danh sách chương và tiến độ từng chương
  revalidatePath('/path/[chapter]', 'page'); // các bước trong chương
  revalidatePath('/[category]/[slug]', 'page');

  return { ok: true, completed };
}
