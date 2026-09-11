'use client';

import { IconBook2, IconHome, IconMap2, IconMetronome } from '@tabler/icons-react';
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

/*
 * Bốn mục, giảm từ năm ngày 11/09/2026.
 *
 * *Bài tập* và *Nhật ký* đã nhập thành **Đường đi**: hai trang đó vẽ cùng một
 * danh sách bài theo hai kiểu (ô tròn để nhảy tới, hàng có ô tick để đánh dấu),
 * nên người học phải nhớ trang nào làm việc gì — và cả hai đều bỏ sót lý thuyết.
 * Nay một chỗ lo cả ba việc: xem tới đâu, mở bài, và tick.
 *
 * *Mục lục* ở lại vì nó còn Lộ trình và Đọc thêm — những bài KHÔNG nằm trên đường
 * đi, không có thứ tự, và không tick được.
 */
const TABS = [
  { href: '/', label: 'Trang chủ', Icon: IconHome, section: 'home' },
  { href: '/library', label: 'Mục lục', Icon: IconBook2, section: 'library' },
  { href: '/path', label: 'Đường đi', Icon: IconMap2, section: 'exercises' },
  { href: '/metronome', label: 'Nhịp', Icon: IconMetronome, section: 'metronome' },
];

/**
 * Tab nào đang sáng. Trang bài học không có tab riêng nên sáng tab đã dẫn tới nó:
 * bài tập thuộc *Bài tập*, còn lý thuyết, lộ trình và đọc thêm thuộc *Mục lục*.
 * Không có dòng này thì đang đọc bài là cả năm tab đều tắt, mất mốc định hướng.
 *
 * Tên thư mục nội dung giữ tiếng Việt có chủ ý — xem mục đường dẫn ở `AGENTS.md`.
 */
function activeTabHref(pathname: string): string {
  // Mọi bước trên đường đi — lý thuyết lẫn bài tập — đều sáng tab *Đường đi*, vì
  // đó là nơi vừa dẫn họ tới đây. Trang chương cũng vậy.
  if (pathname.startsWith('/03-exercises/')) return '/path';
  if (pathname.startsWith('/02-chapters/')) return '/path';
  if (pathname.startsWith('/path')) return '/path';
  if (/^\/(01-roadmap|07-doc-them|08-bai-hat)\//.test(pathname)) return '/library';
  if (pathname.startsWith('/songs')) return '/library';
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
