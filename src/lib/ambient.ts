/**
 * Nhạc nền: phần THUẦN — vòng hợp âm, mẫu rải nốt, quy đổi cao độ, cài đặt, và
 * luật trang nào được bật nhạc. Không chạm Web Audio, không chạm React, nên kiểm
 * thử được hết. Phần phát tiếng nằm ở `ambient-engine.ts`.
 *
 * **Vì sao tự sinh nhạc bằng Web Audio chứ không tải một bản nhạc nền về.**
 *
 * 1. **Bản quyền.** Đây là sản phẩm có bán. "Miễn phí" trên mạng gần như luôn
 *    kèm điều kiện (ghi công, cấm dùng thương mại, cấm nhúng vào sản phẩm), mà
 *    sai một cái là gỡ cả bản đã phát hành. Nhạc do chính app sinh ra thì không
 *    có ai để mà xin phép.
 * 2. **Không phải tải gì.** Một bản nhạc nền vài phút là 2-4 MB, tải trên 4G ở
 *    Việt Nam vừa lâu vừa tốn dung lượng của người học.
 * 3. **Đổi được ngay.** Thấy chói tai hay buồn ngủ thì sửa một con số.
 *
 * **Vì sao thang âm là Đô trưởng.** Chương 1 dạy đúng năm nốt Đô-Rê-Mi-Pha-Sol.
 * Nhạc nền ở giọng khác sẽ nghịch tai với chính thứ người học đang bấm.
 */

/** Một hợp âm trong vòng nhạc nền, ghi bằng số hiệu MIDI. 60 là Đô giữa. */
export interface AmbientChord {
  /** Tên để đọc mã cho dễ, không hiện ra giao diện. */
  name: string;
  /** Nốt trầm, đánh ở phách mạnh. */
  bass: number;
  /** Các nốt để rải và để giữ nền, thấp lên cao. */
  tones: number[];
}

/**
 * Vòng I–V–vi–IV ở Đô trưởng.
 *
 * Đây là vòng hợp âm của hàng nghìn bài hát vui trong nhạc đại chúng, và chọn nó
 * là cố ý: tai người nghe nhận ra ngay dù chưa từng học nhạc, nên nghe là thấy
 * quen và dễ chịu chứ không phải "đang có nhạc lạ chạy trong app".
 *
 * Bản đầu tiên dùng hợp âm bậc 7 ngân dài kiểu thiền — nghe hay nhưng buồn ngủ,
 * không hợp với thứ cần ở đây là làm người học thấy hứng ngồi vào đàn.
 */
export const PROGRESSION: AmbientChord[] = [
  { name: 'C', bass: 48, tones: [60, 64, 67, 72] },
  { name: 'G', bass: 43, tones: [59, 62, 67, 71] },
  { name: 'Am', bass: 45, tones: [57, 60, 64, 69] },
  { name: 'F', bass: 41, tones: [57, 60, 65, 69] },
];

/** Hợp âm thứ `index` trong vòng, quay vòng mãi. Nhận cả số âm cho an toàn. */
export function chordAt(index: number): AmbientChord {
  const n = PROGRESSION.length;
  return PROGRESSION[((index % n) + n) % n];
}

/**
 * Bốn mẫu rải nốt, mỗi mẫu tám móc đơn cho một ô nhịp 4/4.
 *
 * Số là chỉ số trong `tones` của hợp âm; `null` là lặng. Lặng quan trọng ngang
 * nốt: rải kín tám móc suốt mấy phút là thành tiếng máy khâu, tai bám theo rồi
 * đâm mệt. Mỗi mẫu đều chừa ít nhất hai chỗ thở.
 *
 * Bốn mẫu đổi vòng theo từng ô nhịp nên phải qua tám ô (khoảng 20 giây) mới lặp
 * lại đúng một cặp hợp âm + mẫu.
 */
export const ARPEGGIO_PATTERNS: (number | null)[][] = [
  [0, 2, 1, 3, null, 2, 1, null],
  [0, 1, 2, 3, 2, null, 1, null],
  [2, null, 1, 2, 3, null, 2, 1],
  [0, 2, 3, null, 2, 1, null, 2],
];

/** Mẫu rải cho ô nhịp thứ `barIndex` tính từ lúc bật nhạc. */
export function arpeggioForBar(barIndex: number): (number | null)[] {
  const n = ARPEGGIO_PATTERNS.length;
  return ARPEGGIO_PATTERNS[((barIndex % n) + n) % n];
}

/** Số hiệu MIDI sang tần số (La quãng tám 4, tức MIDI 69, là 440Hz). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Cài đặt nhạc nền, lưu trên máy người học. */
export interface AmbientSettings {
  on: boolean;
  /** 0..1, người học tự chỉnh. Đây KHÔNG phải gain thật, xem `ambient-engine.ts`. */
  volume: number;
}

/**
 * Mặc định BẬT.
 *
 * Đổi ngày 11/09/2026 theo yêu cầu của chủ sản phẩm: mở app ra là có nhạc, để
 * người học thấy hứng ngồi vào đàn. Trước đó mặc định tắt vì `AGENTS.md` chốt
 * "người học tự quyết khi nào bắt đầu và dừng" — ràng buộc đó vẫn nguyên giá
 * trị cho phần TẬP (bản nhạc không tự trôi, không chấm điểm thời gian thực), còn
 * nhạc nền thì tắt bằng đúng một cú gạt ở màn hình chủ và app nhớ lựa chọn đó.
 *
 * Lưu ý kỹ thuật: bật sẵn KHÔNG có nghĩa là nhạc kêu ngay lúc mở. Trình duyệt
 * chặn phát tiếng khi chưa có thao tác nào của người dùng, nên nó bắt đầu ở cú
 * chạm đầu tiên — xem `AmbientMusic.tsx`.
 */
export const AMBIENT_DEFAULT: AmbientSettings = { on: true, volume: 0.5 };

export const AMBIENT_STORAGE_KEY = 'pj-ambient';
/** Tên sự kiện để thẻ điều khiển và bộ phát nói chuyện với nhau. */
export const AMBIENT_EVENT = 'pj-ambient-change';

/**
 * Đọc cài đặt từ chuỗi đã lưu, sai kiểu gì cũng không được ném lỗi.
 *
 * Dữ liệu ở localStorage là thứ người dùng sửa được và là thứ còn sót lại từ
 * phiên bản cũ của app, nên phải coi như dữ liệu lạ: hỏng thì lùi về mặc định,
 * số ngoài khoảng thì kẹp lại.
 *
 * `on` đọc theo kiểu "chỉ `false` mới là tắt": người học đã gạt tắt thì phải giữ
 * nguyên ý họ, còn thiếu trường (bản lưu từ phiên bản cũ) thì theo mặc định mới.
 */
export function parseAmbient(raw: string | null): AmbientSettings {
  if (!raw) return AMBIENT_DEFAULT;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return AMBIENT_DEFAULT;
    const doc = parsed as Partial<Record<keyof AmbientSettings, unknown>>;
    const volume =
      typeof doc.volume === 'number' && Number.isFinite(doc.volume)
        ? Math.min(1, Math.max(0, doc.volume))
        : AMBIENT_DEFAULT.volume;
    return { on: doc.on !== false, volume };
  } catch {
    return AMBIENT_DEFAULT;
  }
}

/**
 * Trang này có được bật nhạc nền không?
 *
 * Chỉ còn hai trang tắt hẳn, và cả hai đều tồn tại để phát tiếng: máy đánh nhịp
 * và bài luyện nhận nốt. Nhạc nền chồng lên tiếng gõ nhịp thì hỏng cả hai.
 *
 * **Trang bài học thì KHÔNG tắt theo trang nữa** (đổi 11/09/2026). Đọc phần chữ
 * của bài vẫn là đọc, có nhạc vẫn dễ chịu. Nhạc chỉ tắt đúng lúc có tiếng khác
 * thật sự cất lên — bấm nghe bản nhạc mẫu, hoặc mở phần tập với đàn — và việc đó
 * do `ambient-hold.ts` lo theo SỰ KIỆN chứ không theo đường dẫn.
 */
export function ambientAllowedOn(pathname: string): boolean {
  return pathname !== '/metronome' && pathname !== '/note-trainer';
}
