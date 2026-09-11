'use client';

import { Button, type ButtonProps } from '@mantine/core';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Nút Mantine nối vào next/link, dùng được từ Server Component.
 *
 * Cùng lý do với `NavAnchor`: `component={Link}` là truyền một HÀM qua ranh giới
 * server/client, mà hàm thì không tuần tự hoá được. Giữ prop đó bên trong một
 * client component là xong.
 *
 * Chỗ này đã sập một lần thật (11/09/2026, lúc dựng `/path`): cả năm lệnh kiểm
 * đều xanh — `tsc`, lint, test, check:lessons, `next build` — mà mở trang ra là
 * 500 với thông báo *"Functions cannot be passed directly to Client Components"*.
 * Lỗi này chỉ xuất hiện lúc DỰNG TRANG, nên không có cổng kiểm nào ở máy bắt
 * được; xem bẫy 1 và bẫy 22 trong `docs/_internal/bay-ky-thuat.md`.
 */
export function NavButton({
  href,
  children,
  ...props
}: ButtonProps & { href: string; children: ReactNode }) {
  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}
