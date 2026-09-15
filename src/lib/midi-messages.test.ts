import { describe, expect, it } from 'vitest';
import { isPedalDown, localControlMessages, pickOutputFor } from './midi-messages';

describe('isPedalDown', () => {
  it('pedal nửa chừng cắt ở giữa dải: từ 64 trở lên là đang đạp', () => {
    expect([0, 20, 63].map(isPedalDown)).toEqual([false, false, false]);
    expect([64, 90, 127].map(isPedalDown)).toEqual([true, true, true]);
  });
});

describe('localControlMessages', () => {
  it('tắt loa đàn gửi Local Control mức 0 trên đủ 16 kênh', () => {
    // Đàn nghe ở kênh nào app không biết; thiếu một kênh là nút bấm vô tác dụng.
    const messages = localControlMessages(false);
    expect(messages).toHaveLength(16);
    expect(messages.map((m) => m[0])).toEqual(Array.from({ length: 16 }, (_, ch) => 0xb0 | ch));
    expect(messages.every((m) => m[1] === 122 && m[2] === 0)).toBe(true);
  });

  it('bật lại loa đàn gửi mức 127', () => {
    expect(localControlMessages(true).every((m) => m[2] === 127)).toBe(true);
  });
});

describe('pickOutputFor', () => {
  it('chọn cổng ra trùng tên với đàn đang nối', () => {
    const outputs = [{ name: 'Tai nghe MIDI' }, { name: 'FP-30X' }];
    expect(pickOutputFor('FP-30X', outputs)).toBe(outputs[1]);
  });

  it('trên Windows cổng vào và cổng ra khác tiền tố vẫn nhận ra là một đàn', () => {
    const outputs = [{ name: 'MIDIOUT3 (Casio)' }, { name: 'MIDIOUT2 (FP-30X)' }];
    expect(pickOutputFor('MIDIIN2 (FP-30X)', outputs)).toBe(outputs[1]);
  });

  it('không khớp tên nhưng máy chỉ có một cổng ra thì dùng cổng đó', () => {
    const outputs = [{ name: 'USB MIDI Interface' }];
    expect(pickOutputFor('Digital Piano', outputs)).toBe(outputs[0]);
  });

  it('nhiều cổng ra mà không cái nào khớp thì không đoán', () => {
    // Gửi nhầm là tắt tiếng một thiết bị người học không định tắt.
    expect(pickOutputFor('FP-30X', [{ name: 'A' }, { name: 'B' }])).toBeNull();
  });

  it('đàn không có cổng ra thì báo không gửi được', () => {
    expect(pickOutputFor('FP-30X', [])).toBeNull();
  });
});
