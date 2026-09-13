/**
 * Luật "bài này ai được đọc".
 *
 * Vị trí khoá và mã gói lấy từ mục 3 và 4 của
 * `docs/_internal/dinh-huong-kinh-doanh.md` — sửa ở đây thì sửa cả tài liệu đó.
 *
 * Giữ thuần, không chạm database, để kiểm thử được mọi nhánh. Việc tra quyền
 * sở hữu do phía gọi làm rồi truyền vào (giống cách reconcile.ts tách quyết
 * định khỏi I/O).
 */

/**
 * Mở miễn phí tới hết Chương 1.
 *
 * Không khoá sớm hơn: người học mới bỏ ra 15 phút, chưa đủ đầu tư để tiếc.
 * Không mở rộng hơn: Chương 2 (ghép hai tay) đúng là chỗ giá trị bắt đầu rõ.
 */
export const FREE_THROUGH_CHAPTER = 1;

/** Gói mở khoá toàn bộ Giai đoạn 1 và 2. */
export const REQUIRED_PACKAGE_ID = 'nen-tang';

/** Chỉ hai thư mục này là bài học tính tiền. Lộ trình và Đọc thêm luôn mở. */
const PAID_CATEGORIES = ['02-chapters', '03-exercises'];

const CHAPTER_IN_SLUG = /^chuong-(\d+)/;

/** Số chương suy từ slug ("chuong-03-bai-02" -> 3), null nếu không theo mẫu. */
export function chapterOf(slug: string): number | null {
  const m = CHAPTER_IN_SLUG.exec(slug);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) ? n : null;
}

/**
 * Nội dung này có mở cho mọi người không?
 *
 * Mặc định là MỞ khi không nhận ra slug: thà lỡ cho đọc một trang còn hơn khoá
 * nhầm trang lẽ ra miễn phí rồi người học tưởng sản phẩm hỏng. Ngược lại với
 * admin-allowlist.ts, nơi mặc định phải là từ chối — ở đó nhầm là mất quyền
 * kiểm soát, ở đây nhầm chỉ là cho không một bài.
 */
export function isFreeContent(category: string, slug: string): boolean {
  if (!PAID_CATEGORIES.includes(category)) return true;

  const chapter = chapterOf(slug);
  if (chapter === null) return true;

  return chapter <= FREE_THROUGH_CHAPTER;
}

/**
 * Quyết định cuối cùng cho một lượt xem.
 *
 * `hasFullAccess` do phía server tính một lần cho cả request (xem
 * `access-server.ts`), rồi dùng lại cho cả nội dung trang lẫn ổ khoá ở thanh
 * bên — nếu mỗi chỗ tự tra thì một lượt mở bài tốn hai truy vấn database.
 */
export function canReadLesson(params: {
  category: string;
  slug: string;
  hasFullAccess: boolean;
}): boolean {
  return params.hasFullAccess || isFreeContent(params.category, params.slug);
}

/**
 * Mức duy nhất của bài luyện nhận nốt mở cho mọi người.
 *
 * **Vì sao đúng mức Dễ, và vì sao chặn ở đây mà không phải trong bảng mức độ:**
 * thang khó của bài luyện bám theo lộ trình giáo trình — Dễ là tầm Chương 1,
 * Trung bình là Chương 2-3, Khó là Chương 4-6, Rất khó là sau Chương 7. Nên ranh
 * giới trả phí của bài luyện trùng đúng `FREE_THROUGH_CHAPTER` ở trên: người chưa
 * mở gói thì tập đúng phần họ đã được học. Chặn ở file này để cả hai ranh giới
 * (nội dung và công cụ) chỉ có MỘT chỗ sửa; `midi-notes.ts` vẫn là thư viện nhạc
 * thuần, không biết gì về chuyện tiền.
 */
export const FREE_DRILL_PRESET_ID = 'de';

/**
 * Người đang xem có được dùng mức này của bài luyện nhận nốt không?
 *
 * `presetId` là `null` khi lựa chọn không khớp mức nào — tức người học đã tự
 * chỉnh trong bảng *Tuỳ chọn*. Ca đó phải **từ chối**: cho tự chỉnh tức là cho
 * dựng lại đúng mức Rất khó bằng tay, khoá mấy mức kia thành khoá trang trí.
 * Đây là chỗ duy nhất trong file mặc định TỪ CHỐI thay vì cho qua (ngược với
 * `isFreeContent`), vì nhầm ở đây chỉ là mời mua sai lúc, còn nhầm chiều kia là
 * cho không cả công cụ.
 */
export function canUseDrillPreset(params: {
  presetId: string | null;
  hasFullAccess: boolean;
}): boolean {
  return params.hasFullAccess || params.presetId === FREE_DRILL_PRESET_ID;
}
