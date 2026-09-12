import { getMarkdownContent, getAllMarkdownFiles } from '@/lib/markdown';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { LessonTickButton } from '@/components/LessonTickButton';
import { LessonFeedback } from '@/components/LessonFeedback';
import { getLessonFeedback } from '@/lib/feedback-actions';
import { auth } from '@/auth';
import { getCompletedLessonSlugs } from '@/lib/progress';
import { LessonLocked } from '@/components/LessonLocked';
import { LessonNav } from '@/components/LessonNav';
import { stepNeighbors } from '@/lib/learning-path';
import { canReadLesson } from '@/lib/access';
import { env } from '@/lib/env';
import { dangBan } from '@/lib/env-schema';
import { viewerHasFullAccess } from '@/lib/access-server';

export async function generateStaticParams() {
  const files = getAllMarkdownFiles();
  return files.map(file => ({
    category: file.category,
    slug: file.slug,
  }));
}

export default async function Page({ params }: { params: Promise<{ category: string, slug: string }> }) {
  const { category, slug } = await params;
  const content = getMarkdownContent(`${category}/${slug}.md`);
  const allFiles = getAllMarkdownFiles();

  if (!content) {
    notFound();
  }

  const session = await auth();
  const completedSlugs = session?.user
    ? await getCompletedLessonSlugs(session.user.id)
    : new Set<string>();

  /*
   * Bước trên ĐƯỜNG ĐI thì tick được — cả lý thuyết lẫn bài tập (đổi 11/09/2026).
   * Trước đó chỉ bài tập mới tick được, nên đọc xong một chương lý thuyết không
   * có cách nào đánh dấu là đã đọc, và bước đó không đếm vào tiến độ.
   */
  const isPathStep = category === '02-chapters' || category === '03-exercises';

  /*
   * Phản hồi chỉ hỏi ở các bước trên đường đi, cùng chỗ với nút tick: đó là phần
   * giáo trình mà cổng Giai đoạn A đang đo (bao nhiêu người đi hết Chương 1). Bài
   * đọc thêm và bài hát không nằm trên đường đó, hỏi ở đấy chỉ loãng số liệu.
   */
  const feedback = isPathStep ? await getLessonFeedback(slug) : null;

  // Cổng chặn nội dung trả phí. Kiểm ở server và KHÔNG gửi nội dung xuống khi
  // chưa có quyền — làm mờ ở client là khoá giả, ai xem mã nguồn cũng đọc được.
  // Tính một lần rồi dùng cho cả cổng chặn lẫn tiêu đề bài phía dưới.
  const hasFullAccess = await viewerHasFullAccess(session);
  const allowed = canReadLesson({ category, slug, hasFullAccess });

  const fileTitle =
    allFiles.find((f) => f.category === category && f.slug === slug)?.title ?? slug;

  return (
    <AppLayout>
      {allowed ? (
        <>
          <MarkdownViewer content={content} />
          {/* Tick và chuyển bài đều nằm CUỐI bài: đó là lúc người học vừa học
              xong, không phải lúc vừa mở ra. Hai nút liền nhau để "tick rồi sang
              bài kế" là hai lần chạm. Bài lẻ (Lộ trình, Đọc thêm) không có chuỗi
              thứ tự nên `stepNeighbors` trả về hai null và không hiện gì. */}
          {isPathStep && (
            <LessonTickButton
              lessonSlug={slug}
              initialCompleted={completedSlugs.has(slug)}
              signedIn={Boolean(session?.user)}
              variant="card"
              label={category === '02-chapters' ? 'Đã đọc xong chương này' : 'Đã học xong bài này'}
            />
          )}
          {isPathStep && (
            <LessonFeedback
              lessonSlug={slug}
              initialVerdict={feedback}
              signedIn={Boolean(session?.user)}
            />
          )}
          <LessonNav {...stepNeighbors(slug)} />
        </>
      ) : (
        <LessonLocked
          title={fileTitle}
          signedIn={Boolean(session?.user)}
          sellingEnabled={dangBan(env.SELLING_ENABLED)}
        />
      )}
    </AppLayout>
  );
}
