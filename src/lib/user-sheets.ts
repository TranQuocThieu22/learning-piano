/**
 * **Kho nhạc của tôi**: bản nhạc do chính người học đưa lên, chỉ mình họ xem.
 *
 * File này giữ phần LUẬT thuần — giới hạn, nhận dạng file, cắt chuỗi ảnh — để cả
 * trình duyệt lẫn máy chủ dùng chung đúng một bộ số. Phần chạm database nằm ở
 * `user-sheets-server.ts`, phần ghi ở `sheet-actions.ts`.
 *
 * ## Vì sao tính năng này tồn tại, và ranh giới không được vượt
 *
 * Kho bài hát của app chỉ có nhạc **đã hết hạn bảo hộ** (xem `songs.ts`), nên
 * người học không tìm thấy bài mình thích ở đó. Cho họ tự đưa bản nhạc của mình
 * vào giải đúng chỗ ấy — nhưng nó **đổi chiều câu chuyện bản quyền**: app thôi là
 * người phát hành và thành nơi chứa. Vị trí đó có chỗ trong luật (Nghị định
 * 17/2023 có cơ chế miễn trừ trách nhiệm cho doanh nghiệp cung cấp dịch vụ trung
 * gian), nhưng chỉ giữ được khi làm đủ bốn điều — **sửa file này thì đừng phá cái
 * nào**:
 *
 * 1. **Riêng tư mặc định, không có đường chia sẻ.** Không kho chung, không link
 *    công khai, không danh sách "bản nhạc hay của người dùng". Một cái kho chung
 *    là app thành nơi phát tán bản nhạc lậu — tệ hơn hẳn tình trạng hiện nay vì
 *    quy mô lớn hơn và không ai kiểm soát nổi.
 * 2. **App không chọn, không biên tập, không gợi ý** nội dung đưa lên. Chọn hộ là
 *    "khởi xướng", và mất luôn vị trí trung gian.
 * 3. **Gỡ được ngay**, và có đầu mối nhận khiếu nại ghi trong Điều khoản.
 * 4. **Không quảng bá kiểu "tha hồ sheet, bài nào cũng có"** — cùng loại rủi ro
 *    với mục 0 của `docs/_internal/dinh-huong-kinh-doanh.md`.
 *
 * Và ràng buộc của `AGENTS.md` vẫn nguyên: bản nhạc tự đưa lên **không tick tiến
 * độ, không đếm, không chấm** — giống Góc bài hát, đây là chỗ chơi.
 */

/** Hai kiểu bản nhạc trong kho: đọc được nốt, và ảnh chụp. */
export type SheetKind = 'notes' | 'photo';

export type SheetSource = 'midi' | 'musicxml' | 'photo';

export interface SheetSourceInfo {
  id: SheetSource;
  kind: SheetKind;
  label: string;
  /** Một câu nói app làm được gì với bản nhạc kiểu này. */
  note: string;
}

/**
 * Bảng nguồn — **thêm định dạng mới là thêm một dòng ở đây**, không phải thêm một
 * nhánh `if` (quy tắc 3 của `.claude/skills/code-standards/SKILL.md`).
 */
export const SHEET_SOURCES: SheetSourceInfo[] = [
  {
    id: 'midi',
    kind: 'notes',
    label: 'File MIDI',
    note: 'Nghe mẫu và tập với đàn thật được, nhưng hình nốt là máy đoán lại.',
  },
  {
    id: 'musicxml',
    kind: 'notes',
    label: 'File MusicXML',
    note: 'Nghe mẫu và tập với đàn thật được, hình nốt giữ đúng bản gốc.',
  },
  {
    id: 'photo',
    kind: 'photo',
    label: 'Ảnh chụp',
    note: 'Chỉ để đọc trên giá nhạc — app không biết đó là nốt gì nên không nghe mẫu được.',
  },
];

export function sheetSource(id: string): SheetSourceInfo | null {
  return SHEET_SOURCES.find((s) => s.id === id) ?? null;
}

export function sheetSourceLabel(id: string): string {
  return sheetSource(id)?.label ?? 'Bản nhạc';
}

/**
 * Bao nhiêu bản nhạc một người được giữ.
 *
 * Có chặn trên vì chỗ chứa là database thật và tiền là tiền thật. Năm mươi bản là
 * rộng hơn nhiều so với số bài một người tập trong cả năm đầu, nên người dùng
 * bình thường không bao giờ chạm tới.
 */
export const MAX_SHEETS_PER_USER = 50;

/** Bản nhạc dài quá thì vẽ ra cũng không ai đọc nổi trên màn hình điện thoại. */
export const MAX_ABC_CHARS = 60_000;

/** Số trang ảnh tối đa của một bản nhạc. Một bài piano vừa sức thường 2-6 trang. */
export const MAX_PAGES_PER_SHEET = 20;

/**
 * Cỡ tối đa một trang ảnh sau khi trình duyệt đã thu nhỏ, tính bằng byte của
 * chuỗi base64.
 *
 * Vì sao thu nhỏ ở TRÌNH DUYỆT chứ không gửi ảnh gốc lên rồi thu ở máy chủ: ảnh
 * gốc của điện thoại 3-5MB, mà Server Action của Next mặc định chỉ nhận 1MB mỗi
 * lần gọi — gửi thẳng là hỏng ngay ở trang đầu tiên. Thu trước còn tiết kiệm 4G
 * của người học, thứ họ trả tiền thật.
 */
export const MAX_PAGE_BASE64 = 900_000;

/** Cạnh dài nhất của ảnh sau khi thu nhỏ. Đủ đọc nốt trên máy đặt ở giá nhạc. */
export const IMAGE_MAX_EDGE = 1600;

/** Chất lượng JPEG khi thu nhỏ: dưới mức này thì dòng kẻ khuông bắt đầu rỗ. */
export const IMAGE_QUALITY = 0.82;

/** Chỉ nhận ba định dạng ảnh mà mọi trình duyệt đều vẽ được. */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isImageMime(mime: string): boolean {
  return IMAGE_MIME_TYPES.includes(mime);
}

/**
 * Định dạng suy từ tên file, `null` nếu không nhận ra.
 *
 * Nhận theo ĐUÔI FILE chứ không theo kiểu MIME mà trình duyệt khai: máy Android
 * hay khai `.mid` là `application/octet-stream`, có máy khai chuỗi rỗng — chặn
 * theo MIME là người học thấy app từ chối file hoàn toàn hợp lệ.
 */
export function detectSource(fileName: string): SheetSource | null {
  const duoi = fileName.toLowerCase().split('.').pop() ?? '';
  if (duoi === 'mid' || duoi === 'midi') return 'midi';
  if (duoi === 'musicxml' || duoi === 'xml') return 'musicxml';
  return null;
}

/** Tên gợi ý cho bản nhạc, lấy từ tên file và bỏ đuôi. */
export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base.slice(0, 120) || 'Bản nhạc của tôi';
}

/**
 * Cỡ ảnh sau khi thu nhỏ cho vừa cạnh dài nhất, giữ nguyên tỉ lệ.
 *
 * Tách ra thành phép tính thuần vì đây là thứ duy nhất trong đường chụp ảnh kiểm
 * được bằng test — phần còn lại (canvas, `createImageBitmap`) là trình duyệt, và
 * vitest chạy ở `environment: 'node'`.
 *
 * **Không phóng to ảnh nhỏ hơn mức trần**: phóng to không thêm được nét nào mà
 * file lại nặng lên, và ảnh chụp bằng điện thoại đời cũ vốn đã vừa.
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = IMAGE_MAX_EDGE,
): { width: number; height: number } {
  const canh = Math.max(width, height);
  if (!(canh > 0)) return { width: 0, height: 0 };
  if (canh <= maxEdge) return { width: Math.round(width), height: Math.round(height) };

  const ti = maxEdge / canh;
  return {
    width: Math.max(1, Math.round(width * ti)),
    height: Math.max(1, Math.round(height * ti)),
  };
}

export interface DataUrlParts {
  mime: string;
  base64: string;
}

/**
 * Cắt chuỗi `data:image/jpeg;base64,...` thành kiểu ảnh và phần dữ liệu.
 *
 * Trả `null` khi chuỗi không đúng dạng, không đúng kiểu ảnh, hoặc quá cỡ — ba câu
 * hỏi đó đi cùng nhau, tách ra là chỗ gọi quên mất một cái. Máy chủ vẫn phải hỏi
 * lại đúng hàm này dù trình duyệt đã hỏi: Server Action là endpoint HTTP thật,
 * gọi được mà không qua giao diện.
 */
export function parseImageDataUrl(raw: string): DataUrlParts | null {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(raw.trim());
  if (!match) return null;

  const [, mime, base64] = match;
  if (!isImageMime(mime)) return null;
  if (base64.length === 0 || base64.length > MAX_PAGE_BASE64) return null;

  return { mime, base64 };
}

/** Cỡ thật của ảnh sau khi giải mã base64, để hiện cho người học và để ghi vào cột. */
export function base64Bytes(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * Chữ hiện cho người học khi một thao tác với kho không thành.
 *
 * Để ở file này chứ không ở `sheet-actions.ts` vì trong file `'use server'` chỉ
 * được xuất ra hàm bất đồng bộ — xuất một bảng hằng số ở đó là hỏng lúc dựng bản
 * production, mà `pnpm test` với `tsc` đều không bắt được (xem bẫy 19 trong
 * `docs/_internal/bay-ky-thuat.md` về việc chỉ `next build` mới thấy).
 *
 * Gom một chỗ để mọi trang nói cùng một câu, và để câu chữ sửa được mà không phải
 * mở tới phần ghi database.
 */
export const SHEET_ERRORS: Record<string, string> = {
  'not-signed-in': 'Bạn cần đăng nhập để lưu bản nhạc vào kho riêng của mình.',
  'bad-input': 'Dữ liệu gửi lên không đúng, thử lại giúp mình.',
  'too-many': `Kho của bạn đã đủ ${MAX_SHEETS_PER_USER} bản nhạc. Xoá bớt bản không còn tập rồi thêm tiếp.`,
  'too-many-pages': `Một bản nhạc giữ tối đa ${MAX_PAGES_PER_SHEET} trang ảnh.`,
  'bad-image': 'Ảnh này app không nhận — thử chụp lại, hoặc chọn ảnh JPG, PNG.',
  'not-found': 'Không tìm thấy bản nhạc này trong kho của bạn.',
};

export function sheetErrorMessage(error: string | undefined): string {
  if (!error) return '';
  return SHEET_ERRORS[error] ?? 'Có lỗi xảy ra, thử lại giúp mình.';
}
