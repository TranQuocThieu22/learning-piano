/**
 * Ba phép tính cơ bản trên số MIDI, dùng ở mọi nơi có nốt nhạc.
 *
 * **Vì sao tách hẳn ra một file**: cùng một câu hỏi "phím đen hay phím trắng"
 * trước đây có ba câu trả lời riêng — `isBlackPitch` ở hình học bàn phím,
 * `isBlack` ở luyện tai, `isBlackKey` ở bộ sinh câu hỏi — mà cả ba đều chép tay
 * đúng dãy `[1, 3, 6, 8, 10]`. Chép đúng thì không ai thấy gì; chép sót một số
 * thì bàn phím vẽ ra vẫn "trông như bàn phím", chỉ có điều Đô thăng đứng nhầm
 * chỗ, loại lỗi chỉ người biết đàn mới nhận ra. Một chỗ đúng thì cả ba đúng.
 *
 * Chuẩn dùng trong repo: **MIDI 60 là Đô4** (Đô giữa) — trùng với cách abcjs và
 * phần lớn phần mềm nhạc đánh số, để tên quãng hiện trên màn hình khớp với chữ
 * in trên bản nhạc giấy.
 */

/**
 * Nốt này là nốt nào trong mười hai, không kể cao thấp. Đô là 0.
 *
 * Phải cộng 12 rồi chia dư lần nữa vì `%` của JavaScript giữ dấu âm: `-1 % 12`
 * ra `-1` chứ không phải `11`. Số MIDI âm không đến từ cây đàn, nhưng đến từ
 * phép tính đổi giọng và từ dữ liệu cũ — và lúc đó nó lặng lẽ trỏ ra ngoài mảng.
 */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Quãng tám theo cách ghi của bản nhạc: `octaveOf(60)` là 4. */
export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Phím đen: đúng năm cái trong mỗi quãng tám. */
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function isBlackPitch(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClass(midi));
}
