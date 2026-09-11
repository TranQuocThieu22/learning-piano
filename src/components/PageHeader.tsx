import type { ReactNode } from 'react';
import { Text, Title } from '@mantine/core';

/**
 * Tiêu đề đầu trang: biểu tượng có màu của khu vực, tên trang, một dòng giải thích.
 *
 * Không có `'use client'` và không dùng hook nên dùng thẳng được trong Server
 * Component. Biểu tượng truyền vào dưới dạng phần tử đã dựng (`<IconBook2 />`)
 * chứ không truyền component, vì component là hàm và hàm không đi qua được ranh
 * giới server/client.
 *
 * `section` chọn cặp màu, khai ở `[data-section]` trong globals.css — cùng một
 * chỗ với màu của thanh tab, để hai thứ luôn khớp nhau.
 */
export function PageHeader({
  section,
  icon,
  title,
  description,
}: {
  section: string;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="page-header">
      <span className="section-icon" data-section={section} aria-hidden>
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <Title order={1} size="h2">
          {title}
        </Title>
        {description && (
          <Text size="sm" c="dimmed" mt={2}>
            {description}
          </Text>
        )}
      </div>
    </div>
  );
}
