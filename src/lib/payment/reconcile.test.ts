import { describe, expect, it } from 'vitest';
import { decideReconcile, type OrderSnapshot, type SePayWebhookPayload } from './reconcile';
import {
  extractTransferCode,
  generateTransferCode,
  isValidTransferCode,
} from './transfer-code';

const order: OrderSnapshot = {
  id: 'order-1',
  userId: 'user-1',
  packageId: 'nen-tang',
  amountVnd: 399_000,
  status: 'pending',
};

/** Payload tối thiểu của một lần chuyển khoản vào, đủ 399k và ghi đúng mã. */
function inbound(overrides: Partial<SePayWebhookPayload> = {}): SePayWebhookPayload {
  return {
    id: 12345,
    transferType: 'in',
    transferAmount: 399_000,
    content: 'CT DEN:0123456789 PJ7K3M9Q TU NGUYEN VAN A',
    ...overrides,
  };
}

describe('extractTransferCode', () => {
  it('nhặt được mã nằm giữa phần chữ ngân hàng tự chèn', () => {
    expect(extractTransferCode('CT DEN:0123 PJ7K3M9Q TU NGUYEN VAN A')).toBe('PJ7K3M9Q');
  });

  it('chấp nhận cả khi ngân hàng viết thường', () => {
    expect(extractTransferCode('chuyen tien pj7k3m9q')).toBe('PJ7K3M9Q');
  });

  it('trả null khi không có mã', () => {
    expect(extractTransferCode('CHUYEN TIEN HOC PIANO')).toBeNull();
    expect(extractTransferCode('')).toBeNull();
    expect(extractTransferCode(null)).toBeNull();
  });

  it('không nhận mã sai độ dài', () => {
    expect(extractTransferCode('PJ7K3M')).toBeNull();
  });

  it('không nhận ký tự dễ nhìn nhầm đã bị loại khỏi bảng chữ', () => {
    // 0, 1, I, L, O, U, V không nằm trong bảng chữ nên không thể là mã hợp lệ.
    expect(extractTransferCode('PJ0O1ILU')).toBeNull();
  });
});

describe('generateTransferCode', () => {
  it('sinh ra mã đúng khuôn', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateTransferCode();
      expect(isValidTransferCode(code)).toBe(true);
      expect(extractTransferCode(`ND: ${code} XYZ`)).toBe(code);
    }
  });

  it('mã sinh ra tìm lại được sau khi ngân hàng viết hoa toàn bộ', () => {
    const code = generateTransferCode(() => 0.5);
    expect(extractTransferCode(`ct den ${code.toLowerCase()} tu abc`)).toBe(code);
  });
});

describe('decideReconcile', () => {
  it('cấp quyền khi tiền vào đủ và mã khớp đơn', () => {
    expect(decideReconcile(inbound(), order)).toEqual({
      kind: 'grant',
      orderId: 'order-1',
      userId: 'user-1',
      packageId: 'nen-tang',
      receivedVnd: 399_000,
    });
  });

  it('vẫn cấp quyền khi khách chuyển dư', () => {
    const decision = decideReconcile(inbound({ transferAmount: 400_000 }), order);
    expect(decision.kind).toBe('grant');
  });

  it('KHÔNG cấp quyền khi chuyển thiếu, kể cả thiếu rất ít', () => {
    expect(decideReconcile(inbound({ transferAmount: 398_999 }), order)).toEqual({
      kind: 'underpaid',
      orderId: 'order-1',
      expectedVnd: 399_000,
      receivedVnd: 398_999,
    });
  });

  it('KHÔNG cấp quyền khi chuyển một số tiền tượng trưng', () => {
    const decision = decideReconcile(inbound({ transferAmount: 10_000 }), order);
    expect(decision.kind).toBe('underpaid');
  });

  it('bỏ qua tiền đi ra khỏi tài khoản', () => {
    const decision = decideReconcile(inbound({ transferType: 'out' }), order);
    expect(decision).toEqual({ kind: 'ignore', reason: 'not-inbound' });
  });

  it('bỏ qua khi người chuyển quên ghi mã', () => {
    const decision = decideReconcile(inbound({ content: 'CHUYEN TIEN' }), order);
    expect(decision).toEqual({ kind: 'ignore', reason: 'no-transfer-code' });
  });

  it('bỏ qua khi mã đúng khuôn nhưng không có đơn nào mang mã đó', () => {
    expect(decideReconcile(inbound(), null)).toEqual({
      kind: 'ignore',
      reason: 'order-not-found',
    });
  });

  it('báo đã trả rồi khi đơn ở trạng thái paid — SePay gửi lại tối đa 7 lần', () => {
    const paid: OrderSnapshot = { ...order, status: 'paid' };
    expect(decideReconcile(inbound(), paid)).toEqual({
      kind: 'already-paid',
      orderId: 'order-1',
    });
  });

  it('không cấp quyền khi số tiền không phải là số', () => {
    const decision = decideReconcile(
      inbound({ transferAmount: undefined }),
      order
    );
    expect(decision).toEqual({
      kind: 'underpaid',
      orderId: 'order-1',
      expectedVnd: 399_000,
      receivedVnd: 0,
    });
  });

  it('đọc được mã nằm ở description khi content trống', () => {
    const decision = decideReconcile(
      inbound({ content: null, description: 'ND CK: PJ7K3M9Q' }),
      order
    );
    expect(decision.kind).toBe('grant');
  });
});
