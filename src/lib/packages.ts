/**
 * Danh mục gói bán. Giá và ranh giới gói lấy từ mục 4 của
 * `docs/_internal/dinh-huong-kinh-doanh.md` — sửa giá thì sửa cả hai nơi.
 *
 * Chỉ liệt kê ở đây những gói **đã soạn xong và bán được**. Tài liệu định hướng
 * ghi rõ không quảng bá Giai đoạn 3-4 kèm chữ "sắp ra mắt", vì vừa tạo kỳ vọng
 * phải trả vừa khiến người ta chần chừ chờ mua trọn bộ.
 */
export interface Package {
  id: string;
  name: string;
  /** Giá chốt tại thời điểm tạo đơn, đơn vị đồng. */
  priceVnd: number;
  description: string;
}

export const PACKAGES: Package[] = [
  {
    id: 'nen-tang',
    name: 'Nền tảng',
    priceVnd: 399_000,
    description: 'Toàn bộ Giai đoạn 1 và Giai đoạn 2, mua đứt một lần.',
  },
];

export function findPackage(id: string): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}
