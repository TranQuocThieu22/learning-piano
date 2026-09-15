import { describe, expect, it } from 'vitest';
import { encodeBlePackets, parseBlePacket, type BleMidiNote } from './ble-midi';
import { localControlMessages } from './midi-messages';

describe('encodeBlePackets', () => {
  it('một lệnh thành một gói: header, mốc thời gian, rồi ba byte MIDI', () => {
    expect(encodeBlePackets([[0xb0, 122, 0]]))
      .toEqual([new Uint8Array([0x80, 0x80, 0xb0, 122, 0])]);
  });

  it('lệnh tắt loa trên 16 kênh chia thành gói không quá 20 byte', () => {
    // Quá 20 byte thì đàn chưa nâng MTU cắt mất đuôi gói, và các kênh cuối không nhận được lệnh.
    const packets = encodeBlePackets(localControlMessages(false));
    expect(packets.every((p) => p.length <= 20)).toBe(true);
    const channels = packets.flatMap((p) => [...p].filter((_, i) => i % 4 === 2).map((b) => b & 0x0f));
    expect(channels).toEqual(Array.from({ length: 16 }, (_, ch) => ch));
  });

  it('không có lệnh nào thì không ghi gói nào', () => {
    expect(encodeBlePackets([])).toEqual([]);
  });
});

/** Dựng gói cho gọn: `pk(0x81, 0x90, 60, 100)` = header + các byte sau. */
const pk = (...bytes: number[]) => new Uint8Array([0x80, ...bytes]);

/** Chỉ lấy phím xuống/nhấc, bỏ pedal — cho các ca chỉ quan tâm nốt. */
const notesOf = (bytes: Uint8Array) => parseBlePacket(bytes)
  .filter((e): e is BleMidiNote => e.kind !== 'pedal');

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
    const notes = notesOf(pk(0x81, 0x90, 60, 100, 64, 100, 67, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64, 67]);
    expect(notes.every((n) => n.kind === 'down')).toBe(true);
  });

  it('nhiều thông điệp, mỗi cái có mốc thời gian và status riêng', () => {
    const notes = notesOf(pk(0x81, 0x90, 60, 100, 0x82, 0x90, 64, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64]);
  });

  it('running status nhưng vẫn có mốc thời gian ở giữa', () => {
    // Chuẩn cho phép lược byte status mà giữ mốc thời gian.
    const notes = notesOf(pk(0x81, 0x90, 60, 100, 0x82, 64, 100));
    expect(notes.map((n) => n.midi)).toEqual([60, 64]);
  });

  it('mốc thời gian từ 0x90 trở lên không bị hiểu nhầm thành status', () => {
    // Mốc chạy khắp 0x80-0xFF, quay vòng mỗi 128ms. Bản đầu chỉ nhận ra 0x80-0x8F nên
    // cứ rơi vào khoảng sau là nốt thứ hai của hợp âm biến mất.
    for (const ts of [0x90, 0xa5, 0xb0, 0xff]) {
      const notes = notesOf(pk(ts, 0x90, 60, 100, ts, 64, 100));
      expect(notes.map((n) => n.midi)).toEqual([60, 64]);
    }
  });

  it('xuống rồi nhấc trong cùng một gói', () => {
    const notes = parseBlePacket(pk(0x81, 0x90, 60, 100, 0x85, 0x80, 60, 64));
    expect(notes).toEqual([
      { kind: 'down', midi: 60, velocity: 100 },
      { kind: 'up', midi: 60, velocity: 64 },
    ]);
  });

  it('nhấc hai phím liền nhau bằng running status note off', () => {
    const notes = notesOf(pk(0x81, 0x80, 60, 64, 0x82, 64, 64));
    expect(notes.map((n) => `${n.kind}:${n.midi}`)).toEqual(['up:60', 'up:64']);
  });

  it('đạp và nhả pedal ngân', () => {
    expect(parseBlePacket(pk(0x81, 0xb0, 64, 127))).toEqual([{ kind: 'pedal', down: true }]);
    expect(parseBlePacket(pk(0x81, 0xb0, 64, 0))).toEqual([{ kind: 'pedal', down: false }]);
  });

  it('pedal nửa chừng gửi dồn nhiều mức bằng running status, đọc đủ từng mức', () => {
    // FP-30X gửi cả dải 0..127 theo độ lún của chân pedal, liền nhau trong một gói.
    const events = parseBlePacket(pk(0x81, 0xb0, 64, 20, 0x82, 64, 90, 0x83, 64, 30));
    expect(events).toEqual([
      { kind: 'pedal', down: false },
      { kind: 'pedal', down: true },
      { kind: 'pedal', down: false },
    ]);
  });

  it('pedal và nốt chung một gói giữ đúng thứ tự', () => {
    // Thứ tự quyết định nốt có ngân hay không: nhả phím trước khi đạp là không ngân.
    const events = parseBlePacket(pk(0x81, 0x80, 60, 64, 0x82, 0xb0, 64, 127));
    expect(events).toEqual([
      { kind: 'up', midi: 60, velocity: 64 },
      { kind: 'pedal', down: true },
    ]);
  });

  it('bỏ qua những lệnh điều khiển khác và bánh xe uốn tiếng', () => {
    // CC7 là âm lượng, 0xE0 là uốn tiếng — bộ phát tiếng không dùng.
    expect(parseBlePacket(pk(0x81, 0xb0, 7, 100, 0x82, 0xe0, 0, 64))).toEqual([]);
  });

  it('vẫn đọc được nốt đứng sau một thông điệp không phải nốt', () => {
    const notes = notesOf(pk(0x81, 0xe0, 0, 64, 0x82, 0x90, 60, 100));
    expect(notes.map((n) => n.midi)).toEqual([60]);
  });

  it('thông điệp đổi tiếng chỉ có một byte dữ liệu, không nuốt mất nốt sau nó', () => {
    const notes = notesOf(pk(0x81, 0xc0, 5, 0x82, 0x90, 60, 100));
    expect(notes.map((n) => n.midi)).toEqual([60]);
  });

  it('bỏ qua SysEx của đàn rồi đọc tiếp nốt phía sau', () => {
    // Đàn Roland gửi SysEx báo trạng thái; F7 kết thúc luôn có mốc thời gian đứng trước.
    const notes = notesOf(pk(0x81, 0xf0, 0x41, 0x10, 0x42, 0x82, 0xf7, 0x83, 0x90, 60, 100));
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
    expect(parseBlePacket(pk(0x81))).toEqual([]);
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
      expect(parseBlePacket(pk(0x81, 0xb0 | ch, 64, 127)))
        .toEqual([{ kind: 'pedal', down: true }]);
    }
  });

  it('nốt ở hai đầu bàn phím 88 phím', () => {
    expect(notesOf(pk(0x81, 0x90, 21, 80))[0].midi).toBe(21);
    expect(notesOf(pk(0x81, 0x90, 108, 80))[0].midi).toBe(108);
  });
});
