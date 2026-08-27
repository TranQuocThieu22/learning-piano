import { describe, expect, it } from 'vitest';
import { buildVietQrUrl, formatVnd, getBankAccount } from './vietqr';

const account = {
  bankCode: 'MBBank',
  accountNumber: '0903252427',
  accountName: 'TRAN QUOC THIEU',
};

describe('buildVietQrUrl', () => {
  it('gắn đủ số tài khoản, ngân hàng, số tiền và mã chuyển khoản', () => {
    const url = new URL(
      buildVietQrUrl({ account, amountVnd: 399_000, transferCode: 'PJ7K3M9Q' })
    );

    expect(url.searchParams.get('acc')).toBe('0903252427');
    expect(url.searchParams.get('bank')).toBe('MBBank');
    expect(url.searchParams.get('amount')).toBe('399000');
    expect(url.searchParams.get('des')).toBe('PJ7K3M9Q');
  });

  it('số tiền là số nguyên đồng, không có dấu phân cách', () => {
    const url = new URL(
      buildVietQrUrl({ account, amountVnd: 1_200_000, transferCode: 'PJ7K3M9Q' })
    );
    expect(url.searchParams.get('amount')).toBe('1200000');
  });
});

describe('formatVnd', () => {
  it('hiển thị theo cách người Việt đọc', () => {
    // toLocaleString dùng dấu chấm ngăn nghìn với vi-VN; so bằng regex để test
    // không vỡ nếu Node đổi sang dấu cách không ngắt giữa các phiên bản ICU.
    expect(formatVnd(399_000)).toMatch(/^399.000đ$/);
    expect(formatVnd(0)).toBe('0đ');
  });
});

describe('getBankAccount', () => {
  it('dựng được tài khoản khi có đủ mã ngân hàng và số tài khoản', () => {
    expect(
      getBankAccount({
        SEPAY_BANK_CODE: 'MBBank',
        SEPAY_ACCOUNT_NUMBER: '0903252427',
        SEPAY_ACCOUNT_NAME: 'TRAN QUOC THIEU',
      })
    ).toEqual(account);
  });

  it('tên chủ tài khoản để trống được, vì mã QR không cần tới nó', () => {
    expect(
      getBankAccount({ SEPAY_BANK_CODE: 'MBBank', SEPAY_ACCOUNT_NUMBER: '0903252427' })
    ).toEqual({ ...account, accountName: '' });
  });

  it('trả null khi thiếu cấu hình — thà không có QR còn hơn QR sai người nhận', () => {
    expect(getBankAccount({})).toBeNull();
    expect(getBankAccount({ SEPAY_BANK_CODE: 'MBBank' })).toBeNull();
    expect(getBankAccount({ SEPAY_ACCOUNT_NUMBER: '0903252427' })).toBeNull();
  });
});
