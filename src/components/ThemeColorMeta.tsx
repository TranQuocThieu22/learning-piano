'use client';

import { useEffect } from 'react';
import { useComputedColorScheme } from '@mantine/core';

/**
 * Màu nền trang ở hai chế độ — phải khớp `--app-bg` trong globals.css. Không phải
 * `--mantine-color-body`: biến đó giờ là màu của thẻ, nền trang ngả màu hơn nó.
 */
const BODY_COLOR = { light: '#f5f3fc', dark: '#171524' } as const;

/**
 * Nhuộm thanh trạng thái điện thoại theo đúng chế độ sáng/tối đang bật.
 *
 * Không thể khai báo sẵn trong `viewport` ở layout gốc: ở đó chỉ chọn được theo
 * `prefers-color-scheme` của máy, mà app này mặc định giao diện sáng và cho
 * người học tự bật tối — nên máy đặt chế độ tối sẽ ra thanh trạng thái tối đè
 * lên trang nền trắng. Sửa thẳng thẻ meta mà layout gốc đã dựng sẵn, thay vì
 * thêm thẻ mới, vì trình duyệt lấy thẻ `theme-color` khớp đầu tiên.
 */
export function ThemeColorMeta() {
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = BODY_COLOR[colorScheme];
  }, [colorScheme]);

  return null;
}
