'use server';

import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { lessonFeedback } from '@/db/schema';
import { getAllSteps } from './learning-path';
import { feedbackVerdictSchema, slugSchema, type FeedbackVerdict } from './validation';
import { canReadLesson } from './access';
import { viewerHasFullAccess } from './access-server';

export interface FeedbackResult {
  ok: boolean;
  /** Lựa chọn đang được lưu sau lời gọi này, `null` nếu chưa lưu được gì. */
  verdict: FeedbackVerdict | null;
  error?: string;
}

/**
 * Ghi lại một chạm phản hồi cho một bài học.
 *
 * **Cố ý KHÔNG `revalidatePath`.** Khác `toggleLessonCompletion`, chỗ này không
 * có con số nào ngoài màn hình phải dựng lại — phản hồi chỉ chảy về khu quản
 * trị, mà khu đó vốn `force-dynamic`. Gọi revalidate ở đây là bắt người học chờ
 * dựng lại bốn trang chỉ để đổi màu một cái nút.
 *
 * Bấm lại là ĐỔI Ý, không phải bỏ thêm phiếu — xem chú thích của bảng
 * `lessonFeedback` để biết vì sao.
 */
export async function sendLessonFeedback(
  lessonSlug: string,
  verdict: string
): Promise<FeedbackResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, verdict: null, error: 'not-signed-in' };
  }

  /*
   * Server Action là endpoint HTTP thật: hai tham số này chưa chắc là chuỗi.
   * Kiểm hình dạng trước, rồi mới đối chiếu với danh sách bài có thật.
   */
  const slug = slugSchema.safeParse(lessonSlug);
  const kind = feedbackVerdictSchema.safeParse(verdict);
  if (!slug.success || !kind.success) {
    return { ok: false, verdict: null, error: 'bad-input' };
  }

  const step = getAllSteps().find((s) => s.slug === slug.data);
  if (!step) {
    return { ok: false, verdict: null, error: 'unknown-lesson' };
  }

  /*
   * Cùng cổng chặn với nút tick: bài chưa mở khoá thì không nói được là nó khó.
   * Ẩn nút ở giao diện là chưa đủ, ai biết id của action đều gọi được — và một
   * dòng phản hồi cho bài người ta chưa đọc làm bẩn đúng con số dùng để quyết
   * định sửa chương nào.
   */
  const hasFullAccess = await viewerHasFullAccess(session);
  if (!canReadLesson({ category: step.category, slug: slug.data, hasFullAccess })) {
    return { ok: false, verdict: null, error: 'locked' };
  }

  await db
    .insert(lessonFeedback)
    .values({ userId, lessonSlug: slug.data, verdict: kind.data })
    .onConflictDoUpdate({
      target: [lessonFeedback.userId, lessonFeedback.lessonSlug],
      set: { verdict: kind.data, updatedAt: new Date() },
    });

  return { ok: true, verdict: kind.data };
}

/** Lựa chọn đã lưu của người đang đăng nhập, để nút hiện đúng trạng thái. */
export async function getLessonFeedback(
  lessonSlug: string
): Promise<FeedbackVerdict | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const slug = slugSchema.safeParse(lessonSlug);
  if (!slug.success) return null;

  const rows = await db
    .select({ verdict: lessonFeedback.verdict })
    .from(lessonFeedback)
    .where(
      and(
        eq(lessonFeedback.userId, userId),
        eq(lessonFeedback.lessonSlug, slug.data)
      )
    )
    .limit(1);

  const saved = feedbackVerdictSchema.safeParse(rows[0]?.verdict);
  return saved.success ? saved.data : null;
}
