'use client';

import { Button, Group, Paper, Text } from '@mantine/core';
import { IconLockOpen } from '@tabler/icons-react';
import { MESSENGER_TRANG } from '@/lib/contact-links';
import { createLocalStore } from '@/lib/local-store';
import { useLocalStore } from '@/hooks/useLocalStore';

/**
 * Báo cho người học biết tài khoản của họ vừa được mở khoá toàn bộ giáo trình.
 *
 * **Vì sao cần một tấm thẻ chứ không chỉ là mở khoá cho xong:** người tham gia
 * đợt thử nghiệm điền form rồi *đợi* — `LessonLocked` hứa với họ "trong vòng 24
 * giờ mình mở toàn bộ giáo trình cho tài khoản của bạn". Trước tấm thẻ này, việc
 * cấp quyền không để lại dấu vết nào phía người học: ổ khoá lặng lẽ biến mất, và
 * cách duy nhất để biết là tự mở app ra đoán.
 *
 * Từ 16/09/2026 việc cấp gói còn gửi một lá thư (`buildAccessGrantedEmail`),
 * nên tấm thẻ này **không còn là đường báo tin duy nhất** — nó lo phần người mở
 * app trước khi đọc thư, và phần người không bao giờ đọc thư.
 *
 * Hai điều giữ cho nó không thành quảng cáo:
 *
 * 1. **Tắt là thôi.** Đã tắt thì không hiện lại, trừ khi có lần cấp quyền mới —
 *    khoá ghi nhớ chính là mốc `granted_at`, nên cấp lại là báo lại.
 * 2. **Hết hạn tự tắt.** Máy chủ chỉ truyền `grantedAt` xuống khi lần cấp đó còn
 *    mới (`isFreshGrant`), nên người học ba tháng không đọc được câu "vừa mở".
 */

const STORAGE_KEY = 'pj-access-notice-dismissed-at';

/**
 * Mốc `granted_at` của lần cấp quyền mà người học đã tắt lời báo.
 *
 * Nhớ **mốc cấp** chứ không nhớ một chữ "đã tắt": nhớ kiểu sau thì người được
 * thu hồi rồi cấp lại sẽ không bao giờ được báo nữa.
 */
const dismissedStore = createLocalStore<number | null>({
  key: STORAGE_KEY,
  fallback: null,
  parse: (raw) => {
    const at = Number(raw);
    return Number.isFinite(at) ? at : null;
  },
  // Chỉ ghi lúc người học bấm tắt, nên `null` không bao giờ xuống tới đây.
  serialize: (at) => String(at ?? 0),
});

export function AccessGrantedNotice({ grantedAt }: { grantedAt: number }) {
  const dismissed = useLocalStore(dismissedStore);
  if (dismissed === grantedAt) return null;

  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {/* Màu của khu Nhật ký (xanh lá) chứ không phải màu tím của *Có gì mới*
            ngay bên dưới: hai thẻ cạnh nhau mà cùng màu thì đọc thành một khối,
            trong khi đây là tin riêng của tài khoản này còn kia là tin chung. */}
        <span className="section-icon section-icon--sm" data-section="journal" aria-hidden>
          <IconLockOpen size={24} />
        </span>
        <div style={{ minWidth: 0 }}>
          <Text fw={700} lh={1.3}>
            Đã mở khoá toàn bộ giáo trình 🎉
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            Giờ bạn đọc được mọi chương và dùng được mọi mức của bài luyện nhận
            nốt — không phải làm gì thêm. Quyền này gắn với tài khoản và không hết hạn.
          </Text>
          {/* Xin người học nhắn câu đầu tiên, bằng MỘT câu hỏi trả lời được ngay.
              Không phải phép lịch sự: Trang Facebook không nhắn trước cho ai
              được (Meta chỉ cho Trang trả lời trong 24 giờ sau khi người dùng
              nhắn), nên câu trả lời của họ là thứ duy nhất mở ra đường hỏi tiếp
              trong suốt đợt thử nghiệm. Xem `MESSENGER_TRANG`. */}
          <Text size="sm" c="dimmed" mt="sm">
            Bạn nhắn cho mình một câu trên Facebook nhé — chỉ cần trả lời:{' '}
            <Text span fw={600} c="inherit">
              bạn đang tập trên cây đàn nào?
            </Text>{' '}
            Biết bạn có đàn gì thì mình mới chỉ được cách cho app nghe đàn.
          </Text>
          <Group gap="xs" mt="sm">
            <Button
              size="compact-sm"
              component="a"
              href={MESSENGER_TRANG}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nhắn cho mình
            </Button>
            <Button
              size="compact-sm"
              variant="light"
              onClick={() => dismissedStore.save(grantedAt)}
            >
              Đã hiểu
            </Button>
          </Group>
        </div>
      </Group>
    </Paper>
  );
}
