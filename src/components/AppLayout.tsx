'use client';

import { Box } from '@mantine/core';
import { InstallPrompt } from './InstallPrompt';
import { TabBar } from './TabBar';
import { FullscreenOnFirstTap } from './FullscreenOnFirstTap';

/**
 * Khung của app: nội dung, và một thanh tab dính đáy màn hình. Hết.
 *
 * Đã bỏ hai lớp khung theo hai bước, cùng một lý do — chiều cao là thứ khan hiếm
 * nhất trên điện thoại, mà mỗi thanh cố định lại ăn một dải suốt cả buổi tập:
 *
 * 1. `AppShell` của Mantine với thanh bên: nằm sau nút hamburger ở góc xa ngón
 *    cái nhất, mà lại là đường duy nhất đi bất cứ đâu. Mục lục dời sang
 *    `/library` và `/exercises`, cả hai đều có mặt trên thanh tab.
 * 2. Thanh tiêu đề riêng của app: chỉ còn ba nút và cả ba đều thỉnh thoảng mới
 *    dùng. Đăng nhập/đăng xuất và đổi nền dời vào thẻ tài khoản ở màn hình chủ
 *    (`AccountCard.tsx`); còn quay lại thì đã có cử chỉ vuốt của điện thoại và
 *    nút back của trình duyệt — cộng thêm nút *Bài trước* ở cuối mỗi bài.
 *
 * Còn đúng một thanh cố định, và nó nằm dưới đáy nơi ngón cái với tới được.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Box component="main" className="app-content">
        {children}
      </Box>

      {/* Cả ba đều dính vào khung nhìn hoặc không vẽ gì, nên nằm ngoài nội dung. */}
      <InstallPrompt />
      <TabBar />
      <FullscreenOnFirstTap />
    </>
  );
}

/** Người đang đăng nhập, đúng những trường mà giao diện cần. */
export interface AppSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
