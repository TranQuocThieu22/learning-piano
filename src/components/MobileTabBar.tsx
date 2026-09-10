'use client';

import { Text, UnstyledButton } from '@mantine/core';
import { IconChecklist, IconHome, IconMap2, IconMetronome } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Thanh tab dưới đáy, chỉ trên điện thoại.
 *
 * Vì sao ở dưới đáy chứ không ở trên: đó là vùng ngón cái với tới được khi cầm
 * máy một tay. Nút hamburger nằm ở góc trên bên trái — góc xa ngón cái nhất trên
 * một màn hình 6 inch, mà lại là đường duy nhất để đi bất cứ đâu.
 *
 * Bốn mục là bốn việc làm hằng ngày, không phải bốn mục lục: mở app, chọn bài
 * tập, bật máy đánh nhịp, tick bài đã xong. Mục lục đầy đủ vẫn ở thanh bên —
 * thanh này KHÔNG thay thế nó, chỉ rút ngắn đường đi cho những việc lặp lại.
 *
 * z-index 200 đứng dưới thanh mời cài đặt (300) và lớp phủ tập trung (350), nên
 * lúc đang tập với đàn thì nó khuất hẳn, đúng ý chế độ tập trung.
 */

const TABS = [
  { href: '/', label: 'Trang chủ', Icon: IconHome },
  { href: '/exercises', label: 'Bài tập', Icon: IconMap2 },
  { href: '/metronome', label: 'Nhịp', Icon: IconMetronome },
  { href: '/journal', label: 'Nhật ký', Icon: IconChecklist },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="mobile-tab-bar" aria-label="Điều hướng nhanh">
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
