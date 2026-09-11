import { beforeEach, describe, expect, it } from 'vitest';
import { ambientHeld, holdAmbient, resetAmbientHoldsForTest } from './ambient-hold';

beforeEach(() => resetAmbientHoldsForTest());

describe('holdAmbient', () => {
  it('chưa ai giữ thì nhạc nền được kêu', () => {
    expect(ambientHeld()).toBe(false);
  });

  it('giữ rồi nhả thì trả lại như cũ', () => {
    const nha = holdAmbient();
    expect(ambientHeld()).toBe(true);
    nha();
    expect(ambientHeld()).toBe(false);
  });

  // Vừa nghe bản nhạc mẫu vừa mở phần tập với đàn: nguồn nào nhả trước cũng
  // không được bật nhạc nền lại khi nguồn kia còn đang kêu.
  it('hai nguồn chồng nhau thì phải nhả hết mới hết giữ', () => {
    const nhaA = holdAmbient();
    const nhaB = holdAmbient();
    nhaA();
    expect(ambientHeld()).toBe(true);
    nhaB();
    expect(ambientHeld()).toBe(false);
  });

  // React chạy hàm dọn dẹp hai lần ở chế độ Strict. Đếm âm thì nhạc nền không
  // bao giờ kêu lại nữa, mà lỗi đó rất khó lần ra vì chẳng có gì báo.
  it('nhả hai lần cũng chỉ tính một', () => {
    const nhaA = holdAmbient();
    const nhaB = holdAmbient();
    nhaA();
    nhaA();
    nhaA();
    expect(ambientHeld()).toBe(true);
    nhaB();
    expect(ambientHeld()).toBe(false);
  });
});
