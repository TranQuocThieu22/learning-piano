/**
 * Thông điệp MIDI dùng chung cho mọi đường nối — phần tính toán thuần, không chạm trình duyệt.
 *
 * Hai chiều ở cùng một chỗ: **nhận** (pedal ngân, đọc giống nhau dù nốt tới bằng dây hay
 * Bluetooth) và **gửi** (Local Control). Lệnh gửi đi là **Local Control**: bảo đàn thôi
 * tự phát tiếng khi bấm phím nhưng vẫn gửi nốt, lực bấm và pedal ra cổng MIDI. Dùng ở
 * trang *Tiếng đàn qua điện thoại*, để người học không nghe hai tiếng chồng nhau — tiếng
 * loa đàn và tiếng điện thoại lệch nhau vài chục ms. Đàn Roland và Kawai bỏ qua lệnh này.
 */

const CONTROL_CHANGE = 0xb0;

/** Số hiệu pedal ngân (damper) theo chuẩn MIDI. */
export const SUSTAIN_PEDAL = 64;

/**
 * Mức CC64 nào thì coi là đang đạp.
 *
 * Đàn có pedal nửa chừng (FP-30X và nhiều đàn khác) gửi cả dải 0..127 theo độ lún của chân,
 * chứ không chỉ 0 và 127. Bộ phát tiếng mới có hai trạng thái ngân/không ngân, nên cắt ở giữa
 * — đúng mốc chuẩn MIDI định cho công tắc bật tắt.
 */
export function isPedalDown(value: number): boolean {
  return value >= 64;
}
/** Số hiệu Local Control trong chuẩn MIDI (channel mode message). Mức 0 là tắt, 127 là bật. */
const LOCAL_CONTROL = 122;

/**
 * Lệnh bật hoặc tắt Local Control, **gửi trên cả 16 kênh**.
 *
 * Vì sao cả 16: đàn chỉ nghe lệnh ở kênh nó đang nhận, và kênh đó không phải cây nào
 * cũng là kênh 1. App không đọc được đàn đang nhận kênh nào, mà gửi thừa ở kênh đàn
 * không nghe thì vô hại — gửi thiếu thì nút bấm không có tác dụng và người học không
 * biết vì sao.
 */
export function localControlMessages(on: boolean): number[][] {
  return Array.from({ length: 16 }, (_, channel) => [
    CONTROL_CHANGE | channel, LOCAL_CONTROL, on ? 127 : 0,
  ]);
}

/**
 * Bỏ phần hệ điều hành gắn vào tên cổng, để cổng vào và cổng ra của cùng một đàn
 * trùng tên. Windows đặt `MIDIIN2 (FP-30X)` cho cổng vào và `MIDIOUT2 (FP-30X)` cho cổng
 * ra; Android và macOS thì để nguyên tên đàn ở cả hai.
 */
function portKey(name: string | null | undefined): string {
  return (name ?? '').replace(/MIDI\s*(IN|OUT)\s*\d*/gi, '').trim().toLowerCase();
}

/**
 * Tìm cổng ra của **chính cây đàn** đang nối cổng vào.
 *
 * Web MIDI tách cổng vào và cổng ra thành hai danh sách với hai `id` khác nhau, không có
 * gì nối chúng lại ngoài cái tên. Không khớp tên mà máy chỉ có đúng một cổng ra thì dùng
 * nó — trường hợp thường gặp nhất, một điện thoại một cây đàn. Có nhiều cổng ra mà không
 * cái nào khớp thì **không đoán**: gửi nhầm sang thiết bị khác là tắt tiếng một thứ người
 * học không định tắt.
 */
export function pickOutputFor<T extends { name?: string | null }>(
  inputName: string | null | undefined,
  outputs: T[],
): T | null {
  const key = portKey(inputName);
  if (key) {
    const match = outputs.find((output) => portKey(output.name) === key);
    if (match) return match;
  }
  return outputs.length === 1 ? outputs[0] : null;
}
