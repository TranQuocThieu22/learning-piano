'use client';

import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme';

/**
 * MantineProvider kèm theme của app.
 *
 * Phải là client component vì `theme.ts` gọi `Button.extend` và các hàm tương
 * tự — Server Component không với tới được thuộc tính tĩnh của component Mantine
 * (bẫy 1 trong `docs/_internal/bay-ky-thuat.md`). Layout gốc chỉ việc bọc cái này.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
