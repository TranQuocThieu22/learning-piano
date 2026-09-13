import { Alert, Container, Group, Stack, Text } from '@mantine/core';
import { IconArrowLeft, IconDice5, IconInfoCircle, IconRepeat } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { LessonLocked } from '@/components/LessonLocked';
import { NavButton } from '@/components/NavButton';
import { PageHeader } from '@/components/PageHeader';
import { SheetViewer } from '@/components/SheetViewer';
import { auth } from '@/auth';
import { canReviewChapter } from '@/lib/access';
import { viewerHasFullAccess } from '@/lib/access-server';
import { generateExercise } from '@/lib/exercise-gen';
import { env } from '@/lib/env';
import { dangBan } from '@/lib/env-schema';
import { nextSeed, parseReviewRequest, reviewHref, reviewKinds } from '@/lib/review';

/**
 * Kho ôn luyện: bài tập sinh bằng luật, mỗi lần bấm là một bài mới.
 *
 * **Vì sao tính năng này tồn tại.** Giáo trình có số bài hữu hạn, mà người học
 * xong Chương 2 thì cần đánh đi đánh lại hàng chục câu cùng tầm nốt mới quen tay.
 * Kho nhạc công cộng không có bài ở tầm này (đã khảo và kết luận — mục 6 của
 * `docs/_internal/ban-quyen-bai-hat.md`), còn nhạc còn bản quyền thì phải xin
 * phép. Bộ sinh ở `exercise-gen.ts` giải đúng chỗ đó: bài đúng tầm nốt của
 * chương, vô hạn, và **không phải xin phép ai** vì không chép của ai cả.
 *
 * **Đây không phải bài học.** Không tick, không đếm vào tiến độ, không có bước
 * trước bước sau — cùng lý do với Góc bài hát (xem `src/lib/songs.ts`): biến chỗ
 * ôn thành một danh sách phải hoàn thành là đúng thứ `AGENTS.md` cấm. Người học
 * bấm *Bài khác* bao nhiêu lần cũng được, và bỏ đi lúc nào cũng không mất gì.
 *
 * Trang **động theo đường dẫn** chứ không dựng sẵn từng bài: số bài là vô hạn nên
 * không có danh sách nào để dựng trước, còn cùng một đường dẫn thì `seed` cố định
 * nên vẫn ra đúng một bài, tải lại không đổi.
 */
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapter: string }>;
  searchParams: Promise<{ kind?: string | string[]; seed?: string | string[] }>;
}) {
  const { chapter: rawChapter } = await params;
  const query = await searchParams;

  const request = parseReviewRequest({ chapter: rawChapter, kind: query.kind, seed: query.seed });
  if (!request) notFound();

  const session = await auth();
  const hasFullAccess = await viewerHasFullAccess(session);

  if (!canReviewChapter({ chapter: request.chapter, hasFullAccess })) {
    return (
      <AppLayout>
        <LessonLocked
          title={`Ôn luyện Chương ${request.chapter}`}
          signedIn={Boolean(session?.user)}
          sellingEnabled={dangBan(env.SELLING_ENABLED)}
        />
      </AppLayout>
    );
  }

  const kinds = reviewKinds(request.chapter);
  const exercise = generateExercise({
    chapter: request.chapter,
    kindId: request.kindId,
    seed: request.seed,
  });

  return (
    <AppLayout>
      <Container size="sm" px={0}>
        <PageHeader
          section="exercises"
          icon={<IconRepeat size={26} />}
          title={`Ôn luyện Chương ${request.chapter}`}
          description="Bài tập mới mỗi lần bấm, đúng tầm nốt của chương. Không tick, không chấm."
        />

        {/*
          Hàng chọn kiểu bài là những thẻ <a> thường do máy chủ dựng: đổi kiểu là
          đổi đường dẫn, nên bấm xong tải lại trang vẫn đúng bài đó. Giữ nguyên
          `seed` khi đổi kiểu — người học đang muốn đổi VIỆC, không phải đổi bài.
        */}
        {kinds.length > 1 && (
          <Group gap="xs" mb="md">
            {kinds.map((kind) => (
              <NavButton
                key={kind.id}
                href={reviewHref({ ...request, kindId: kind.id })}
                size="xs"
                radius="xl"
                variant={kind.id === request.kindId ? 'filled' : 'default'}
                color="orange"
              >
                {kind.label}
              </NavButton>
            ))}
          </Group>
        )}

        <SheetViewer abcNotation={exercise.abc} />

        <Text size="sm" c="dimmed" mt="sm">
          {exercise.hint}
        </Text>

        {/*
          *Bài khác* to và đứng riêng một hàng: lúc tập thì máy nằm trên giá nhạc
          cách mắt nửa sải tay và hai tay vừa rời phím đàn, nên nút phải với tới
          được mà không cần nhìn kỹ.
        */}
        <Stack gap="sm" mt="lg">
          <NavButton
            href={reviewHref({ ...request, seed: nextSeed(request.seed) })}
            size="lg"
            radius="md"
            color="orange"
            leftSection={<IconDice5 size={20} />}
            fullWidth
          >
            Bài khác
          </NavButton>
          <NavButton
            href={`/path/${request.chapter}`}
            variant="default"
            leftSection={<IconArrowLeft size={18} />}
            fullWidth
          >
            Về Chương {request.chapter}
          </NavButton>
        </Stack>

        <Alert
          icon={<IconInfoCircle size={18} />}
          color="gray"
          variant="light"
          mt="xl"
          title="Bài này ở đâu ra?"
        >
          <Text size="sm">
            Máy tự đặt ra theo đúng luật của Chương {request.chapter}: chỉ dùng những nốt và
            hình nốt chương đó đã dạy. Vì vậy bạn tập bao nhiêu bài cũng được mà không bao giờ
            gặp nốt lạ. Bài nào ưng thì cứ lưu đường dẫn lại — mở lại vẫn đúng bài đó.
          </Text>
        </Alert>
      </Container>
    </AppLayout>
  );
}
