import { describe, expect, it } from 'vitest';
import { buildVietQrUrl, formatVnd } from './vietqr';

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
