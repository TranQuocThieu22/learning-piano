'use client';

import { Text, UnstyledButton } from '@mantine/core';
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
 * z-index 200 đứng dưới thanh mời cài đặt (300) và lớp phủ tập trung (350), nên
 * lúc đang tập với đàn thì nó khuất hẳn, đúng ý chế độ tập trung.
 */

const TABS = [
  { href: '/', label: 'Trang chủ', Icon: IconHome },
  { href: '/library', label: 'Mục lục', Icon: IconBook2 },
  { href: '/exercises', label: 'Bài tập', Icon: IconMap2 },
  { href: '/metronome', label: 'Nhịp', Icon: IconMetronome },
  { href: '/journal', label: 'Nhật ký', Icon: IconChecklist },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" aria-label="Điều hướng nhanh">
      {TABS.map(({ href, label, Icon }) => {
        // So khớp chính xác: `/` là tiền tố của mọi đường dẫn nên so kiểu
        // startsWith sẽ làm tab Trang chủ luôn sáng.
        const active = pathname === href;
        return (
          <UnstyledButton
            key={href}
            component={Link}
            href={href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 0',
              color: active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-dimmed)',
            }}
          >
            <Icon size={22} stroke={active ? 2.2 : 1.7} />
            <Text size="10px" fw={active ? 600 : 400}>
              {label}
            </Text>
          </UnstyledButton>
        );
      })}
    </nav>
  );
}
