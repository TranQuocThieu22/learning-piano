'use client';

import { Alert, Button, Group, Text } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import Link from 'next/link';
import { findPackage } from '@/lib/packages';
import { FREE_THROUGH_CHAPTER, REQUIRED_PACKAGE_ID } from '@/lib/access';

/** Form đăng ký đợt thử nghiệm — cùng đường dẫn với `LessonLocked`. */
const FORM_DANG_KY = 'https://forms.gle/aSPhbC82fRXPdciK6';

/**
 * Lời mời mở khoá khi người học chạm vào một mức luyện tập chưa mua.
 *
 * **Vì sao không dùng lại `LessonLocked`:** cái đó thay thế cả nội dung một bài
 * học và chiếm trọn màn hình. Ở đây mức Dễ vẫn đang chạy ngay bên dưới, nên thứ
 * cần là một dòng giải thích gọn rồi để người học tập tiếp — chặn cả trang vì họ
 * chạm thử một mức khó là lấy đi thứ họ đang dùng được.
 *
 * **Không nhắc giá khi chưa mở bán.** Mục 6 của `docs/_internal/dinh-huong-kinh-doanh.md`
 * và Nghị định 81/2018 nói về chuyện này; và trong beta thì đường mua chưa tồn
 * tại — `/checkout` trả 404 — nên hiện nút mua là dẫn người học vào trang lỗi.
 *
 * **Đóng được.** Trên khung 390px khối này chiếm gần trọn màn hình, đẩy khuông
 * nhạc và hình đàn xuống dưới — người học chạm thử một mức khoá rồi muốn tập
 * tiếp phải có đường quay lại ngay, không phải cuộn qua lời mời mua.
 */
export function DrillLevelLocked({
  sellingEnabled,
  onClose,
}: {
  sellingEnabled: boolean;
  onClose: () => void;
}) {
  const pkg = findPackage(REQUIRED_PACKAGE_ID);

  return (
    <Alert
      variant="light"
      color="gray"
      icon={<IconLock size={18} />}
      title="Mức này mở cùng với giáo trình"
      mt="sm"
      data-testid="drill-level-locked"
      withCloseButton
      closeButtonLabel="Đóng"
      onClose={onClose}
    >
      <Text size="sm">
        Mức <strong>Dễ</strong> mở cho tất cả mọi người — đó đúng là tầm Chương{' '}
        {FREE_THROUGH_CHAPTER}, năm nốt Đô–Sol quanh Đô giữa. Ba mức còn lại đi
        theo các chương sau: hai khuông nhạc, hoá biểu đổi mỗi câu, rồi chồng nốt
        như hợp âm.
      </Text>

      {sellingEnabled ? (
        <>
          <Text size="sm" mt="xs">
            Mở khoá bằng gói <strong>{pkg?.name ?? 'Nền tảng'}</strong> — cùng gói
            mở từ Chương {FREE_THROUGH_CHAPTER + 1} trở đi, không phải mua riêng.
          </Text>
          <Group mt="sm" gap="xs">
            <Button component={Link} href="/checkout" size="xs">
              Xem gói và mở khoá
            </Button>
          </Group>
        </>
      ) : (
        <>
          <Text size="sm" mt="xs">
            Giáo trình đang trong <strong>đợt thử nghiệm miễn phí</strong>, chưa mở
            bán — hiện còn nhận đăng ký. Điền form khoảng một phút, trong vòng 24
            giờ mình mở toàn bộ cho tài khoản của bạn, kể cả các mức luyện tập này.
          </Text>
          <Group mt="sm" gap="xs">
            <Button
              component="a"
              href={FORM_DANG_KY}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
            >
              Đăng ký học thử miễn phí
            </Button>
          </Group>
        </>
      )}
    </Alert>
  );
}
