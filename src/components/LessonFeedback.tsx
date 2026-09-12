'use client';

import { useState, useTransition } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconMoodConfuzed, IconThumbUp } from '@tabler/icons-react';
import { sendLessonFeedback } from '@/lib/feedback-actions';
import type { FeedbackVerdict } from '@/lib/validation';

/**
 * Hai cái nút ở cuối bài: *Bài này ổn* và *Chỗ này tôi chưa hiểu*.
 *
 * **Vì sao đúng hai lựa chọn và đúng một cú chạm.** Thứ cần lấy ở đây là tiếng
 * nói của người **sắp bỏ cuộc**, mà người sắp bỏ cuộc không điền form, không
 * trả lời tin nhắn, không viết gì cả — họ đóng tab. Mọi thứ làm cú chạm đắt hơn
 * (ô nhập chữ, thang năm sao, "chọn lý do") đều đổi lấy im lặng. Một chạm là giá
 * duy nhất họ trả.
 *
 * **Vì sao không có ô nhập chữ.** Đã cân nhắc: chữ viết tay quý hơn nhiều. Nhưng
 * ai muốn viết vẫn viết được qua kênh liên hệ ghi trong điều khoản, còn người
 * không muốn viết thì cái ô trống làm họ bỏ luôn cả cú chạm. Chọn cú chạm.
 *
 * Đứng DƯỚI nút tick: người học vừa tick xong là vừa quyết định xong "mình có
 * qua được bài này không" — đúng lúc câu hỏi này có nghĩa nhất.
 */
export function LessonFeedback({
  lessonSlug,
  initialVerdict,
  signedIn,
}: {
  lessonSlug: string;
  initialVerdict: FeedbackVerdict | null;
  signedIn: boolean;
}) {
  const [verdict, setVerdict] = useState<FeedbackVerdict | null>(initialVerdict);
  const [isPending, startTransition] = useTransition();

  const send = (next: FeedbackVerdict) => {
    // Đổi màu ngay rồi mới gửi; hỏng thì trả về giá trị cũ. Cùng lối với nút tick.
    const truoc = verdict;
    setVerdict(next);
    startTransition(async () => {
      const result = await sendLessonFeedback(lessonSlug, next);
      if (!result.ok) setVerdict(truoc);
    });
  };

  return (
    <Stack gap={6} mt="lg" align="center">
      <Text size="sm" fw={500}>
        Bài này thế nào?
      </Text>

      {/*
        Hai nút bằng nhau về cỡ và đứng cạnh nhau: nút "chưa hiểu" mà nhỏ hơn hay
        mờ hơn là ngầm bảo người học rằng nói khó là chuyện đáng ngại. Chính cái
        nút đó mới là nút cần được bấm.
      */}
      <Group gap="sm" justify="center" w="100%">
        <Button
          size="md"
          variant={verdict === 'ok' ? 'filled' : 'default'}
          color="teal"
          leftSection={<IconThumbUp size={18} />}
          disabled={!signedIn || isPending}
          aria-pressed={verdict === 'ok'}
          onClick={() => send('ok')}
          data-testid="feedback-ok"
        >
          Bài này ổn
        </Button>
        <Button
          size="md"
          variant={verdict === 'stuck' ? 'filled' : 'default'}
          color="orange"
          leftSection={<IconMoodConfuzed size={18} />}
          disabled={!signedIn || isPending}
          aria-pressed={verdict === 'stuck'}
          onClick={() => send('stuck')}
          data-testid="feedback-stuck"
        >
          Chỗ này tôi chưa hiểu
        </Button>
      </Group>

      {/* Trên điện thoại không có rê chuột nên chú thích phải là chữ hiện sẵn. */}
      <Text size="xs" c="dimmed" ta="center" maw={420}>
        {!signedIn
          ? 'Đăng nhập ở Trang chủ để gửi được phản hồi.'
          : verdict === 'stuck'
            ? 'Đã ghi lại. Bài nào nhiều người thấy khó thì được viết lại trước — bạn không cần giải thích gì thêm.'
            : verdict === 'ok'
              ? 'Cảm ơn bạn. Bấm nút kia nếu sau này đọc lại thấy có chỗ khó.'
              : 'Một chạm thôi, không cần viết gì. Đây là cách nhanh nhất để báo một bài đang khó quá.'}
      </Text>
    </Stack>
  );
}
