import { describe, expect, it } from 'vitest';
import { parseBlePacket } from './ble-midi';

/** Dựng gói cho gọn: `pk(0x81, 0x90, 60, 100)` = header + các byte sau. */
const pk = (...bytes: number[]) => new Uint8Array([0x80, ...bytes]);

describe('parseBlePacket', () => {
  it('một phím xuống', () => {
    expect(parseBlePacket(pk(0x81, 0x90, 60, 100)))
      .toEqual([{ kind: 'down', midi: 60, velocity: 100 }]);
  });

  it('một phím nhấc, báo bằng note off', () => {
    expect(parseBlePacket(pk(0x81, 0x80, 60, 64)))
      .toEqual([{ kind: 'up', midi: 60, velocity: 64 }]);
  });

  it('note on mà velocity 0 chính là nhấc phím', () => {
    // Đàn Roland dùng cách này. Hiểu nhầm là mỗi lần nhấc tay app tưởng đánh thêm nốt.
    expect(parseBlePacket(pk(0x81, 0x90, 60, 0)))
      .toEqual([{ kind: 'up', midi: 60, velocity: 0 }]);
  });

  it('hợp âm ba nốt về trong MỘT gói, dùng running status', () => {
    // Đọc mỗi thông điệp đầu là mất hai nốt của hợp âm.
    const notes = parseBlePacket(pk(0x81, 0x90, 60, 100, 64, 100, 67, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64, 67]);
    expect(notes.every((n) => n.kind === 'down')).toBe(true);
  });

  it('nhiều thông điệp, mỗi cái có mốc thời gian và status riêng', () => {
    const notes = parseBlePacket(pk(0x81, 0x90, 60, 100, 0x82, 0x90, 64, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64]);
  });

  it('running status nhưng vẫn có mốc thời gian ở giữa', () => {
    // Chuẩn cho phép lược byte status mà giữ mốc thời gian.
    const notes = parseBlePacket(pk(0x81, 0x90, 60, 100, 0x82, 64, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64]);
  });

  it('xuống rồi nhấc trong cùng một gói', () => {
    const notes = parseBlePacket(pk(0x81, 0x90, 60, 100, 0x85, 0x80, 60, 64));
    expect(notes).toEqual([
      { kind: 'down', midi: 60, velocity: 100 },
      { kind: 'up', midi: 60, velocity: 64 },
    ]);
  });

  it('nhấc hai phím liền nhau bằng running status note off', () => {
    const notes = parseBlePacket(pk(0x81, 0x80, 60, 64, 0x82, 64, 64));
    expect(notes.map((n) => `${n.kind}:${n.midi}`)).toEqual(['up:60', 'up:64']);
  });

  it('bỏ qua pedal và những thông điệp không phải nốt', () => {
    // 0xB0 là control change — pedal vang đi qua đây.
    expect(parseBlePacket(pk(0x81, 0xb0, 64, 127))).toEqual([]);
  });

  it('vẫn đọc được nốt đứng sau một thông điệp không phải nốt', () => {
    const notes = parseBlePacket(pk(0x81, 0xb0, 64, 127, 0x82, 0x90, 60, 100));
    expect(notes.map((n) => n.midi)).toEqual([60]);
  });

  it('gói cụt giữa đường thì trả về phần đọc được, không ném lỗi', () => {
    // Dữ liệu đến từ dây Bluetooth: hụt byte là chuyện thường, mà ném lỗi giữa
    // lúc người học đang đánh là mất cả buổi tập.
    expect(() => parseBlePacket(pk(0x81, 0x90, 60))).not.toThrow();
    expect(parseBlePacket(pk(0x81, 0x90, 60))).toEqual([]);
    expect(parseBlePacket(pk(0x81, 0x90, 60, 100, 0x82, 0x90, 64))).toEqual([
      { kind: 'down', midi: 60, velocity: 100 },
    ]);
  });

  it('gói rỗng hoặc chỉ có header', () => {
    expect(parseBlePacket(new Uint8Array([]))).toEqual([]);
    expect(parseBlePacket(pk())).toEqual([]);
  });

  it('gặp dữ liệu trước khi biết loại thông điệp thì bỏ, không đoán', () => {
    expect(parseBlePacket(new Uint8Array([0x80, 60, 100]))).toEqual([]);
  });

  it('đọc đúng ở mọi kênh MIDI, không chỉ kênh 1', () => {
    // Đàn có thể phát ở kênh khác; bỏ sót là app im lặng không nhận nốt nào.
    for (const ch of [0, 3, 15]) {
      expect(parseBlePacket(pk(0x81, 0x90 | ch, 60, 100)))
        .toEqual([{ kind: 'down', midi: 60, velocity: 100 }]);
    }
  });

  it('nốt ở hai đầu bàn phím 88 phím', () => {
    expect(parseBlePacket(pk(0x81, 0x90, 21, 80))[0].midi).toBe(21);
    expect(parseBlePacket(pk(0x81, 0x90, 108, 80))[0].midi).toBe(108);
  });
});
