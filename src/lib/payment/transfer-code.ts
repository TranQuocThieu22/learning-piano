/**
 * Mã nối một lần chuyển khoản với một đơn hàng.
 *
 * Đây là mắt xích mong manh nhất của cả luồng: người học gõ tay nội dung chuyển
 * khoản, ngân hàng lại chèn thêm chữ của họ vào trước và sau. Nên mã phải vừa
 * dễ chép lại đúng, vừa tìm lại được trong một chuỗi rác.
 */

/**
 * Bỏ 0/O, 1/I/L, U/V — những cặp người ta hay chép nhầm khi nhìn từ màn hình
 * sang app ngân hàng. Chỉ dùng chữ hoa vì nhiều ngân hàng tự viết hoa nội dung.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';

/** Tiền tố cố định để nhặt mã ra khỏi phần chữ ngân hàng tự chèn. */
export const TRANSFER_CODE_PREFIX = 'PJ';

const BODY_LENGTH = 6;

const CODE_PATTERN = new RegExp(
  `${TRANSFER_CODE_PREFIX}[${ALPHABET}]{${BODY_LENGTH}}`
);

/**
 * Sinh mã mới. `random` tách thành tham số để kiểm thử được, cùng kiểu với
 * `pickNextNote` trong midi-notes.ts.
 */
export function generateTransferCode(random: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  }
  return TRANSFER_CODE_PREFIX + body;
}

/**
 * Nhặt mã ra khỏi nội dung chuyển khoản thô.
 *
 * Ngân hàng bọc nội dung người dùng gõ vào giữa phần chữ của họ, đại loại
 * "CT DEN:0123456789 PJ7K3M9Q TU NGUYEN VAN A". Có ngân hàng viết thường, có
 * ngân hàng bỏ dấu cách, nên chuẩn hoá về chữ hoa rồi mới dò.
 *
 * Trả về null khi không tìm thấy — người chuyển quên ghi mã, phải xử lý tay.
 */
export function extractTransferCode(content: string | null | undefined): string | null {
  if (!content) return null;
  const match = content.toUpperCase().match(CODE_PATTERN);
  return match ? match[0] : null;
}

/** Mã có đúng khuôn không. Dùng khi nhận mã từ đầu vào bên ngoài. */
export function isValidTransferCode(code: string): boolean {
  return new RegExp(`^${CODE_PATTERN.source}$`).test(code);
}
