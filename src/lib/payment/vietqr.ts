/**
 * Dựng đường dẫn ảnh mã VietQR cho một đơn hàng.
 *
 * Dùng dịch vụ ảnh sẵn có của SePay thay vì tự sinh payload EMVCo tại chỗ: định
 * dạng EMVCo có phần TLV lồng nhau và CRC16 riêng, sai một byte là điện thoại
 * không quét được mà mình lại không biết. Đây là ảnh tĩnh, không kèm khoá bí mật.
 *
 * Đổi lại, mã QR phụ thuộc một tên miền bên ngoài. Vì vậy giao diện **luôn phải
 * hiện kèm số tài khoản, số tiền và mã chuyển khoản dưới dạng chữ** — vừa để
 * người dùng tự gõ khi ảnh không tải được, vừa vì nhiều người chuyển khoản bằng
 * cách nhập tay chứ không quét.
 */

const QR_ENDPOINT = 'https://qr.sepay.vn/img';

export interface BankAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

/** Đọc thông tin tài khoản nhận tiền từ biến môi trường. */
export function getBankAccount(): BankAccount | null {
  const bankCode = process.env.SEPAY_BANK_CODE;
  const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER;
  const accountName = process.env.SEPAY_ACCOUNT_NAME;

  if (!bankCode || !accountNumber) return null;
  return { bankCode, accountNumber, accountName: accountName ?? '' };
}

export function buildVietQrUrl(params: {
  account: BankAccount;
  amountVnd: number;
  transferCode: string;
}): string {
  const query = new URLSearchParams({
    acc: params.account.accountNumber,
    bank: params.account.bankCode,
    amount: String(params.amountVnd),
    des: params.transferCode,
    template: 'compact',
  });

  return `${QR_ENDPOINT}?${query.toString()}`;
}

/** "399.000đ" — hiển thị cho người Việt đọc. */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}
