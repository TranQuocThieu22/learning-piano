'use client';

import type { ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

/**
 * Một dòng danh sách bấm được TRỌN DÒNG.
 *
 * Bản cũ ở `/library` là thẻ có một liên kết chữ bên trong, nên chỉ bấm trúng chữ
 * mới đi — chạm vào khoảng trống của thẻ thì không có gì xảy ra, trên điện thoại
 * đó là phần lớn diện tích. Ở đây cả dòng là một liên kết, cao ít nhất 60px.
 *
 * Là client component vì phải truyền `Link` của Next làm thẻ gốc, mà Server
 * Component không truyền component qua ranh giới được (cùng lý do với `NavAnchor`).
 */
export function LinkRow({
  href,
  title,
  meta,
  leading,
  trailing,
}: {
  href: string;
  title: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  /** Mặc định là mũi tên sang phải. */
  trailing?: ReactNode;
}) {
  return (
    <Link href={href} className="link-row">
      {leading}
      <span className="link-row__text">
        <span className="link-row__title">{title}</span>
        {meta && <span className="link-row__meta">{meta}</span>}
      </span>
      {trailing ?? <IconChevronRight className="link-row__chevron" size={18} aria-hidden />}
    </Link>
  );
}
