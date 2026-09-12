/**
 * Đọc gói tin **BLE-MIDI** — MIDI chạy trên Bluetooth Low Energy.
 *
 * **Vì sao phải tự đọc thay vì dùng Web MIDI.** Trên Android, đàn nối Bluetooth
 * không hiện ra qua `requestMIDIAccess` — đã thử tới cùng trên một cây Roland
 * FP-30X: ghép đôi ở Cài đặt (chỉ ra tiếng, không ra MIDI), nối bằng app của
 * hãng cho tới khi app báo *Connected*, xin lại quyền để trình duyệt điểm danh
 * lại — trang web vẫn không thấy cây đàn nào. Xem bẫy 35.
 *
 * Đường còn lại là **bỏ qua Web MIDI**: dùng Web Bluetooth nối thẳng tới đàn rồi
 * tự đọc byte. Service BLE MIDI không nằm trong danh sách chặn GATT của Web
 * Bluetooth, nên làm được.
 *
 * **Khuôn một gói tin** (chuẩn BLE-MIDI của MIDI Association):
 *
 * ```
 * [header] [ts] [status] [d1] [d2]  [ts] [status] [d1] [d2] ...
 * ```
 *
 * - **header**: `1 0 t t t t t t` — bit 7 luôn bật, sáu bit thấp là bảy bit CAO
 *   của mốc thời gian. Bỏ qua được: app này không dùng mốc thời gian của đàn,
 *   nốt tới lúc nào thì tính lúc đó (xem chú thích ở cuối file).
 * - **ts**: `1 t t t t t t t` — bảy bit thấp của mốc thời gian, đứng TRƯỚC mỗi
 *   thông điệp.
 * - **status/d1/d2**: thông điệp MIDI thường.
 *
 * Ba chỗ dễ sai, và là lý do file này tách riêng để test:
 *
 * 1. **Một gói chứa nhiều thông điệp.** Bấm hợp âm ba nốt có thể về trong một
 *    gói duy nhất. Đọc mỗi thông điệp đầu là mất hai nốt.
 * 2. **Running status.** Thông điệp sau có thể lược cả byte status LẪN byte mốc
 *    thời gian, chỉ còn hai byte dữ liệu, hiểu là "cùng loại như thông điệp
 *    trước". Không xử lý thì hai nốt sau của hợp âm thành rác.
 * 3. **Nhấc phím cũng là nốt.** `note on` với velocity 0 chính là `note off` —
 *    chuẩn MIDI cho phép cả hai cách, và đàn Roland dùng cách này. Coi nó là
 *    phím xuống thì mỗi lần nhấc tay là app tưởng vừa đánh thêm một nốt.
 */

/** Service và characteristic của chuẩn BLE-MIDI. Hằng số của chuẩn, đừng đổi. */
export const BLE_MIDI_SERVICE = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
export const BLE_MIDI_CHARACTERISTIC = '7772e5db-3868-4112-a1a9-f2669d106bf3';

const STATUS_NOTE_OFF = 0x80;
const STATUS_NOTE_ON = 0x90;

export interface BleMidiNote {
  /** `down` là phím vừa xuống, `up` là vừa nhấc. */
  kind: 'down' | 'up';
  midi: number;
  /** 0..127. Phím xuống nhẹ thì nhỏ. */
  velocity: number;
}

/** Byte có bit 7 bật là byte điều khiển (status, header, mốc thời gian). */
function isStatusByte(byte: number): boolean {
  return (byte & 0x80) !== 0;
}

/**
 * Bóc một gói BLE-MIDI thành các phím xuống/nhấc.
 *
 * Bỏ qua mọi thứ không phải note on/note off — pedal, bánh xe uốn tiếng, đồng
 * hồ nhịp của đàn. Gói lạ hay gói cụt thì trả về những gì đọc được, **không ném
 * lỗi**: dữ liệu này đến từ dây Bluetooth, hụt một byte là chuyện bình thường,
 * mà ném lỗi giữa lúc người học đang đánh thì mất luôn cả buổi tập.
 */
export function parseBlePacket(bytes: Uint8Array): BleMidiNote[] {
  const out: BleMidiNote[] = [];
  // Byte 0 là header (mốc thời gian bậc cao) — bỏ.
  let i = 1;
  /** Status của thông điệp trước, để hiểu running status. */
  let runningStatus = 0;

  while (i < bytes.length) {
    // Byte mốc thời gian đứng trước thông điệp: có thì bỏ qua, không có thì đây
    // là running status, đọc thẳng dữ liệu.
    if (isStatusByte(bytes[i]) && (bytes[i] & 0xf0) === 0x80 && i + 1 < bytes.length
      && isStatusByte(bytes[i + 1])) {
      // `1 0 t t t t t t t` của mốc thời gian luôn nằm ngay trước một byte status.
      i += 1;
    } else if (isStatusByte(bytes[i]) && (bytes[i] & 0xf8) === 0x80 && !isStatusByte(bytes[i + 1] ?? 0)
      && (runningStatus & 0xf0) !== STATUS_NOTE_OFF) {
      /*
       * Chỗ nhập nhằng của chuẩn: byte mốc thời gian và byte status `note off`
       * dùng chung khoảng 0x80-0x8F. Phân biệt bằng byte kế tiếp — sau mốc thời
       * gian là một byte status (bit 7 bật), sau `note off` là số nốt (bit 7 tắt).
       */
      i += 1;
    }

    if (i >= bytes.length) break;

    let status = runningStatus;
    if (isStatusByte(bytes[i])) {
      status = bytes[i];
      runningStatus = status;
      i += 1;
    }
    if (status === 0) {
      // Chưa biết loại thông điệp mà đã gặp dữ liệu: gói hỏng, bỏ phần còn lại.
      break;
    }

    const kind = status & 0xf0;
    if (kind === STATUS_NOTE_ON || kind === STATUS_NOTE_OFF) {
      if (i + 1 >= bytes.length) break;
      const midi = bytes[i];
      const velocity = bytes[i + 1];
      i += 2;
      // note on velocity 0 chính là note off — xem chú thích 3 ở đầu file.
      const nhacPhim = kind === STATUS_NOTE_OFF || velocity === 0;
      out.push({ kind: nhacPhim ? 'up' : 'down', midi, velocity });
      continue;
    }

    /*
     * Thông điệp khác: nhảy qua đúng số byte dữ liệu của nó. Đoán sai độ dài là
     * lệch cả phần còn lại của gói, nên thà đọc từng byte cho tới byte điều
     * khiển kế tiếp.
     */
    while (i < bytes.length && !isStatusByte(bytes[i])) i += 1;
  }

  return out;
}

/**
 * Vì sao bỏ mốc thời gian của đàn.
 *
 * Chuẩn BLE-MIDI gói kèm mốc thời gian 13 bit (quay vòng mỗi 8192ms) để dựng
 * lại đúng khoảng cách giữa các nốt. App này không cần: nó **cố ý không chấm
 * điểm thời gian thực** (xem `AGENTS.md`), con trỏ chỉ nhích khi bấm đúng phím
 * chứ không so với đồng hồ. Phần thống kê sau khi bấm dừng thì đo bằng đồng hồ
 * của chính máy, và 15-40ms trễ của Bluetooth không đổi được kết luận nào.
 */
