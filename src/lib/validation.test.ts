import { describe, expect, it } from 'vitest';
import { idSchema, noteSchema, slugSchema } from './validation';
import { sePayWebhookPayloadSchema } from './payment/reconcile';

/**
 * Điểm chính của bộ test này: đầu vào từ client KHÔNG chắc là chuỗi. Server
 * Action là endpoint HTTP thật nên tham số có thể là object, mảng, null.
 */
describe('idSchema', () => {
  it('nhận id bình thường và cắt khoảng trắng', () => {
    expect(idSchema.parse('  abc-123  ')).toBe('abc-123');
  });

  it('từ chối thứ không phải chuỗi', () => {
    for (const bad of [null, undefined, 42, {}, [], true]) {
      expect(idSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('từ chối chuỗi rỗng và chuỗi dài vô lý', () => {
    expect(idSchema.safeParse('').success).toBe(false);
    expect(idSchema.safeParse('   ').success).toBe(false);
    expect(idSchema.safeParse('x'.repeat(129)).success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('nhận slug đúng dạng của giáo trình', () => {
    expect(slugSchema.parse('chuong-01-bai-01')).toBe('chuong-01-bai-01');
  });

  it('từ chối slug có ký tự lạ', () => {
    for (const bad of ['../../etc/passwd', 'Chuong-01', 'a b', 'x;drop']) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('từ chối thứ không phải chuỗi', () => {
    expect(slugSchema.safeParse({ slug: 'chuong-01-bai-01' }).success).toBe(false);
  });
});

describe('noteSchema', () => {
  it('lùi về chuỗi rỗng thay vì ném lỗi khi đầu vào bậy', () => {
    expect(noteSchema.parse(undefined)).toBe('');
    expect(noteSchema.parse({})).toBe('');
    expect(noteSchema.parse('x'.repeat(1000))).toBe('');
  });

  it('giữ ghi chú hợp lệ và cắt khoảng trắng', () => {
    expect(noteSchema.parse('  CK thieu ma  ')).toBe('CK thieu ma');
  });
});

describe('sePayWebhookPayloadSchema', () => {
  const ok = {
    id: 12345,
    transferType: 'in',
    transferAmount: 399_000,
    content: 'CT DEN:0123 PJ7K3M9Q TU NGUYEN VAN A',
  };

  it('nhận payload thật của SePay', () => {
    expect(sePayWebhookPayloadSchema.safeParse(ok).success).toBe(true);
  });

  it('giữ nguyên field lạ, vì cả payload được lưu làm bằng chứng', () => {
    const parsed = sePayWebhookPayloadSchema.parse({ ...ok, fieldMoiCuaSePay: 'x' });
    expect(parsed).toHaveProperty('fieldMoiCuaSePay', 'x');
  });

  it('từ chối payload không có id — đó là khoá chống trùng', () => {
    const khongCoId: Record<string, unknown> = { ...ok };
    delete khongCoId.id;
    expect(sePayWebhookPayloadSchema.safeParse(khongCoId).success).toBe(false);
    expect(sePayWebhookPayloadSchema.safeParse({ ...ok, id: null }).success).toBe(false);
  });

  it('nhận id dạng chuỗi, vì cổng hay gửi số dưới dạng chuỗi', () => {
    expect(sePayWebhookPayloadSchema.safeParse({ ...ok, id: '12345' }).success).toBe(true);
    expect(
      sePayWebhookPayloadSchema.safeParse({ ...ok, transferAmount: '399000' }).success
    ).toBe(true);
  });

  it('KHÔNG từ chối khi thiếu field phụ — SePay đổi format không được làm mất giao dịch', () => {
    expect(sePayWebhookPayloadSchema.safeParse({ id: 1 }).success).toBe(true);
  });

  it('từ chối thứ không phải object', () => {
    for (const bad of [null, 'chuỗi', 42, []]) {
      expect(sePayWebhookPayloadSchema.safeParse(bad).success).toBe(false);
    }
  });
});
