'use client';

import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Chuyển giao diện sáng/tối"
    >
      {/*
        Cả hai biểu tượng luôn được render, CSS quyết định cái nào hiện.
        Nếu rẽ nhánh bằng JS ở đây (chỉ render một icon theo theme hiện tại)
        thì HTML do server dựng sẽ khác HTML client dựng — vì Mantine đã gắn
        thuộc tính theme lên thẻ <html> trước lúc hydrate — và React sẽ báo
        lỗi hydration mismatch.
      */}
      <IconSun stroke={1.5} className="theme-icon theme-icon--sun" />
      <IconMoon stroke={1.5} className="theme-icon theme-icon--moon" />
    </ActionIcon>
  );
}
