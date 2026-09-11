'use client';

import { IconBook2, IconChecklist, IconHome, IconMap2, IconMetronome } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Thanh tab dưới đáy — đường điều hướng chính của app.
 *
 * Vì sao ở dưới đáy: đó là vùng ngón cái với tới được khi cầm máy một tay. Thanh
 * bên cũ nằm sau nút hamburger ở góc trên bên trái, góc xa ngón cái nhất trên
 * một màn hình 6 inch, mà lại là đường duy nhất để đi bất cứ đâu — nay đã bỏ hẳn
 * (xem `AppLayout.tsx`).
 *
 * Năm mục là năm việc làm hằng ngày. Hai trong số đó — Mục lục và Bài tập — liệt
 * kê đầy đủ toàn bộ nội dung, nên bỏ thanh bên không làm mất đường đi tới trang
 * nào.
 *
 * Mỗi tab một màu (`data-section`, khai trong globals.css), trùng màu với biểu
 * tượng ở đầu trang tương ứng — nhìn màu là biết mình đang ở khu nào mà không cần
 * đọc chữ.
 *
 * z-index 200 đứng dưới thanh mời cài đặt (300) và lớp phủ tập trung (350), nên
 * lúc đang tập với đàn thì nó khuất hẳn, đúng ý chế độ tập trung.
 */

const TABS = [
  { href: '/', label: 'Trang chủ', Icon: IconHome, section: 'home' },
  { href: '/library', label: 'Mục lục', Icon: IconBook2, section: 'library' },
  { href: '/exercises', label: 'Bài tập', Icon: IconMap2, section: 'exercises' },
  { href: '/metronome', label: 'Nhịp', Icon: IconMetronome, section: 'metronome' },
  { href: '/journal', label: 'Nhật ký', Icon: IconChecklist, section: 'journal' },
];

/**
 * Tab nào đang sáng. Trang bài học không có tab riêng nên sáng tab đã dẫn tới nó:
 * bài tập thuộc *Bài tập*, còn lý thuyết, lộ trình và đọc thêm thuộc *Mục lục*.
 * Không có dòng này thì đang đọc bài là cả năm tab đều tắt, mất mốc định hướng.
 *
 * Tên thư mục nội dung giữ tiếng Việt có chủ ý — xem mục đường dẫn ở `AGENTS.md`.
 */
function activeTabHref(pathname: string): string {
  if (pathname.startsWith('/03-exercises/')) return '/exercises';
  if (/^\/(01-roadmap|02-chapters|07-doc-them)\//.test(pathname)) return '/library';
  // So khớp chính xác cho phần còn lại: `/` là tiền tố của mọi đường dẫn nên so
  // kiểu startsWith sẽ làm tab Trang chủ luôn sáng.
  return pathname;
}

export function TabBar() {
  const activeHref = activeTabHref(usePathname());

  return (
    <nav className="tab-bar" aria-label="Điều hướng nhanh">
      {TABS.map(({ href, label, Icon, section }) => {
        const active = activeHref === href;
        return (
          <Link
            key={href}
            href={href}
            className="tab-bar__item"
            data-section={section}
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-bar__icon">
              <Icon size={22} stroke={active ? 2.2 : 1.8} />
            </span>
            <span className="tab-bar__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
