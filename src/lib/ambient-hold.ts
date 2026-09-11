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

/**
 * Bộ đếm nằm trên `window`, KHÔNG ở phạm vi module — và đây là chỗ đã sập một lần.
 *
 * Bộ phát nhạc nền sống ở `src/app/layout.tsx`, còn nơi giữ chỗ (`AbcjsViewer`)
 * nằm trong trang. Với App Router, layout gốc và trang là hai nhánh client khác
 * nhau, nên cùng một file `.ts` có thể được nạp thành HAI bản sao, mỗi bên một
 * biến đếm riêng. Triệu chứng đánh lừa: sự kiện vẫn bắn đều (đo được), bên nghe
 * vẫn chạy, nhưng `ambientHeld()` của nó đọc bản sao chưa ai tăng nên luôn trả
 * về `false` — nhạc nền cứ thế kêu chồng lên bản nhạc mẫu.
 *
 * `window` thì chỉ có một, dù module bị nhân ra bao nhiêu bản. Ở môi trường không
 * có DOM (vitest chạy ở `environment: 'node'`) thì lùi về một đối tượng cục bộ,
 * chỉ để phần đếm kiểm thử được.
 */
interface HoldStore {
  n: number;
}

const duPhong: HoldStore = { n: 0 };

function kho(): HoldStore {
  if (typeof window === 'undefined') return duPhong;
  const w = window as unknown as { __pjAmbientHolds?: HoldStore };
  return (w.__pjAmbientHolds ??= { n: 0 });
}

function baoTin(): void {
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
  kho().n += 1;
  baoTin();

  let daNha = false;
  return () => {
    if (daNha) return;
    daNha = true;
    const k = kho();
    k.n = Math.max(0, k.n - 1);
    baoTin();
  };
}

/** Có nguồn tiếng nào đang giữ không? */
export function ambientHeld(): boolean {
  return kho().n > 0;
}

/** Chỉ dùng trong test, để mỗi ca bắt đầu từ trạng thái sạch. */
export function resetAmbientHoldsForTest(): void {
  kho().n = 0;
}
