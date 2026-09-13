'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, Group, Text } from '@mantine/core';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

/**
 * Đọc bản nhạc chụp ảnh trên máy đặt ở giá nhạc.
 *
 * Ba điều quyết định cách dựng, đều đến từ tư thế ngồi đàn chứ không từ thẩm mỹ:
 *
 * 1. **Lật trang bằng một chạm vào nửa trái hoặc nửa phải ảnh.** Lúc tập, hai tay
 *    vừa rời phím và mắt còn ở khuông nhạc — nhắm trúng một nút nhỏ là việc phải
 *    dừng lại nhìn. Nút mũi tên vẫn có cho ai quen bấm nút.
 * 2. **Chế độ toàn màn hình**, vì trang giấy dựng đứng mà màn hình điện thoại thì
 *    thấp: bỏ được thanh tab dưới đáy là thêm gần một phần năm chiều cao.
 * 3. **Không tự lật, không đếm giờ.** Cùng luật với `score-follow.ts`: người học
 *    tự quyết khi nào sang trang.
 */
export function PhotoSheetViewer({ pages, title }: { pages: { id: string }[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const at = Math.min(index, Math.max(0, pages.length - 1));
  const page = pages[at];

  /** Khoá cuộn nền và cho phím Esc thoát — cùng cách `SheetViewer` đang làm. */
  useEffect(() => {
    if (!focused) return;

    document.body.classList.add('sheet-focus-lock');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(pages.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('sheet-focus-lock');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [focused, pages.length]);

  if (!page) {
    return (
      <Text size="sm" c="dimmed">
        Bản nhạc này chưa có trang ảnh nào. Bấm <strong>Chụp thêm trang</strong> để thêm.
      </Text>
    );
  }

  return (
    <div className={`photo-sheet${focused ? ' is-focused' : ''}`}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Text size="sm" fw={600} lineClamp={1}>
          Trang {at + 1}/{pages.length}
        </Text>
        <ActionIcon
          variant="default"
          size="lg"
          onClick={() => setFocused((v) => !v)}
          aria-label={focused ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
        >
          {focused ? <IconArrowsMinimize size={20} /> : <IconArrowsMaximize size={20} />}
        </ActionIcon>
      </Group>

      <div className="photo-sheet-paper">
        {/*
          Thẻ <img> thường, KHÔNG dùng next/image: ảnh đi qua một route cần đăng
          nhập nên bộ tối ưu ảnh của Next không lấy được (nó gọi lại bằng một
          request không mang cookie), và mọi ảnh ở đây vốn đã được thu nhỏ ở máy
          người học trước khi gửi lên.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/sheet-pages/${page.id}`} alt={`${title} — trang ${at + 1}`} />

        {/* Hai nửa trong suốt phủ lên ảnh: chạm trái lùi, chạm phải tới. */}
        <button
          type="button"
          className="photo-sheet-half is-left"
          onClick={() => setIndex(Math.max(0, at - 1))}
          disabled={at === 0}
          aria-label="Trang trước"
        />
        <button
          type="button"
          className="photo-sheet-half is-right"
          onClick={() => setIndex(Math.min(pages.length - 1, at + 1))}
          disabled={at >= pages.length - 1}
          aria-label="Trang sau"
        />
      </div>

      <Group justify="space-between" mt="xs" wrap="nowrap">
        <ActionIcon
          variant="default"
          size="xl"
          onClick={() => setIndex(Math.max(0, at - 1))}
          disabled={at === 0}
          aria-label="Trang trước"
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <ActionIcon
          variant="default"
          size="xl"
          onClick={() => setIndex(Math.min(pages.length - 1, at + 1))}
          disabled={at >= pages.length - 1}
          aria-label="Trang sau"
        >
          <IconChevronRight size={24} />
        </ActionIcon>
      </Group>
    </div>
  );
}
