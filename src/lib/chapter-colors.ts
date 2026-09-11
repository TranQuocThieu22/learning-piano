import type { CSSProperties } from 'react';

/**
 * Mỗi chương một màu, lặp lại khi hết bảng.
 *
 * Để ở `lib/` chứ không để trong `ExerciseMap.tsx`: file đó là client component,
 * mà hàm export từ một module `'use client'` đi vào Server Component (trang
 * `/journal`) chỉ còn là tham chiếu, gọi không được.
 *
 * Màu ở đây chỉ để phân biệt chương cho dễ nhớ vị trí trên bản đồ — không mang
 * nghĩa khó dễ hay đúng sai nào.
 */
const CHAPTER_COLORS = ['brand', 'pink', 'orange', 'teal', 'cyan', 'grape', 'indigo', 'lime'] as const;

export function chapterColor(chapterNumber: number): string {
  const index = (Math.max(chapterNumber, 1) - 1) % CHAPTER_COLORS.length;
  return CHAPTER_COLORS[index];
}

/**
 * Biến CSS cho các ô bài và huy hiệu số chương — xem `.lesson-dot`, `.chapter-badge`
 * và `.num-bubble` trong `globals.css`. Dùng các biến `-light` / `-light-color` có
 * sẵn của Mantine vì chúng tự đổi theo giao diện sáng/tối, khỏi phải viết hai bộ.
 */
export function chapterColorVars(chapterNumber: number): CSSProperties {
  const color = chapterColor(chapterNumber);
  return {
    '--dot-from': `var(--mantine-color-${color}-6)`,
    '--dot-to': `var(--mantine-color-${color}-4)`,
    '--dot-soft': `var(--mantine-color-${color}-light)`,
    '--dot-ink': `var(--mantine-color-${color}-light-color)`,
  } as CSSProperties;
}
