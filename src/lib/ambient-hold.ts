/**
 * Sổ đăng ký "đang có tiếng khác, nhạc nền im giùm".
 *
 * Vì sao cần: nhạc nền không thể tự biết lúc nào người học bấm *Nghe thử* một
 * bản nhạc hay mở phần tập với đàn. Trước đây app đoán bằng đường dẫn — cứ vào
 * trang bài học là tắt — nhưng như thế thì đọc phần chữ của bài cũng mất nhạc,
 * trong khi lúc đó chẳng có tiếng gì khác cả.
 *
 * Cách làm: bên nào sắp phát tiếng thì gọi `holdAmbient()` và giữ lấy hàm trả
 * về; gọi hàm đó là nhả. Dùng đúng kiểu hàm dọn dẹp của `useEffect`:
 *
 * ```ts
 * useEffect(() => {
 *   if (!isPlaying) return;
 *   return holdAmbient();
 * }, [isPlaying]);
 * ```
 *
 * Đếm chứ không dùng cờ bật/tắt: hai nguồn tiếng có thể chồng nhau (đang nghe
 * mẫu thì mở luôn phần tập với đàn), mà một cờ thì nguồn nào nhả trước cũng bật
 * nhạc lại ngay giữa lúc nguồn kia còn đang kêu.
 */

export const AMBIENT_HOLD_EVENT = 'pj-ambient-hold';

let dangGiu = 0;

function baoTin(): void {
  // Chạy được cả ở môi trường không có DOM (vitest), để phần đếm kiểm thử được.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AMBIENT_HOLD_EVENT));
  }
}

/**
 * Báo rằng sắp có tiếng khác. Trả về hàm nhả — gọi nhiều lần cũng chỉ tính một,
 * vì React có thể chạy hàm dọn dẹp hai lần ở chế độ Strict, mà đếm âm thì nhạc
 * nền không bao giờ kêu lại nữa.
 */
export function holdAmbient(): () => void {
  dangGiu += 1;
  baoTin();

  let daNha = false;
  return () => {
    if (daNha) return;
    daNha = true;
    dangGiu = Math.max(0, dangGiu - 1);
    baoTin();
  };
}

/** Có nguồn tiếng nào đang giữ không? */
export function ambientHeld(): boolean {
  return dangGiu > 0;
}

/** Chỉ dùng trong test, để mỗi ca bắt đầu từ trạng thái sạch. */
export function resetAmbientHoldsForTest(): void {
  dangGiu = 0;
}
