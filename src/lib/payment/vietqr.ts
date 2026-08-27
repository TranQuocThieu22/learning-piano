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

/**
 * Dựng thông tin tài khoản nhận tiền từ cấu hình.
 *
 * Nhận cấu hình qua tham số chứ không tự đọc `env`: import module 'server-only'
 * vào đây sẽ khiến vietqr.test.ts không nạp được file, và ba test của nó lặng
 * lẽ ngừng chạy mà tổng số test vẫn xanh. Phía gọi truyền `env` vào.
 *
 * Thiếu mã ngân hàng hoặc số tài khoản thì trả `null` — giao diện tự hiện lời
 * nhắc cấu hình, không dựng ra một mã QR chuyển tiền đi đâu không rõ.
 */
export function getBankAccount(config: {
  SEPAY_BANK_CODE?: string;
  SEPAY_ACCOUNT_NUMBER?: string;
  SEPAY_ACCOUNT_NAME?: string;
}): BankAccount | null {
  const { SEPAY_BANK_CODE: bankCode, SEPAY_ACCOUNT_NUMBER: accountNumber } = config;

  if (!bankCode || !accountNumber) return null;
  return {
    bankCode,
    accountNumber,
    accountName: config.SEPAY_ACCOUNT_NAME ?? '',
  };
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
