/**
 * Nhạc nền: phần THUẦN — hợp âm, quy đổi cao độ, cài đặt, và luật trang nào được
 * bật nhạc. Không chạm Web Audio, không chạm React, nên kiểm thử được hết.
 *
 * Phần phát tiếng nằm ở `ambient-engine.ts`.
 *
 * **Vì sao tự sinh nhạc bằng Web Audio chứ không tải một bản nhạc nền về.**
 *
 * 1. **Bản quyền.** Đây là sản phẩm có bán. "Miễn phí" trên mạng gần như luôn
 *    kèm điều kiện (ghi công, cấm dùng thương mại, cấm nhúng vào sản phẩm), mà
 *    sai một cái là gỡ cả bản đã phát hành. Nhạc do chính app sinh ra thì không
 *    có ai để mà xin phép.
 * 2. **Không phải tải gì.** Một bản nhạc nền vài phút là 2-4 MB, tải trên 4G ở
 *    Việt Nam vừa lâu vừa tốn dung lượng của người học. Ở đây là vài trăm dòng
 *    mã, và không lặp lại y hệt sau mỗi vòng.
 * 3. **Đổi được ngay.** Thấy chói tai chỗ nào thì sửa một con số, không phải đi
 *    tìm bản nhạc khác.
 *
 * **Vì sao thang âm là Đô trưởng.** Chương 1 dạy đúng năm nốt Đô-Rê-Mi-Pha-Sol.
 * Nhạc nền ở giọng khác sẽ nghịch tai với chính thứ người học đang bấm. Ở Đô
 * trưởng thì nếu có lỡ nghe chồng lên nhau, nó vẫn thuận.
 */

/** Một hợp âm trong vòng nhạc nền, ghi bằng số hiệu MIDI. */
export interface AmbientChord {
  /** Tên để đọc mã cho dễ, không hiện ra giao diện. */
  name: string;
  /** Cao độ MIDI, thấp lên cao. 60 là Đô giữa. */
  notes: number[];
}

/**
 * Vòng hợp âm, cố ý chỉ bốn hợp âm và đều là hợp âm "mở" (có bậc 7 hoặc bậc 6).
 *
 * Không dùng hợp âm ba nốt thuần vì nghe quá "có chuyện xảy ra" — nhạc nền phải
 * là thứ người ta quên mất là nó đang chạy. Bậc 7 làm hoà âm mờ đi, không kéo
 * tai về phía mình.
 */
export const PROGRESSION: AmbientChord[] = [
  { name: 'Cmaj7', notes: [48, 55, 59, 64] },
  { name: 'Am7', notes: [45, 55, 60, 64] },
  { name: 'Fmaj7', notes: [41, 53, 57, 60] },
  { name: 'G6', notes: [43, 55, 59, 64] },
];

/** Hợp âm thứ `index` trong vòng, quay vòng mãi. Nhận cả số âm cho an toàn. */
export function chordAt(index: number): AmbientChord {
  const n = PROGRESSION.length;
  return PROGRESSION[((index % n) + n) % n];
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
 * Mặc định là TẮT, và đây là chuyện có chủ ý chứ không phải quên bật.
 *
 * `AGENTS.md` chốt rằng người học tự quyết khi nào bắt đầu, dừng, tập lại đoạn
 * nào. Nhạc tự kêu lên khi vừa mở app là đúng thứ đó ngược lại — chưa kể trình
 * duyệt vốn đã chặn tự phát tiếng khi chưa có thao tác của người dùng.
 */
export const AMBIENT_DEFAULT: AmbientSettings = { on: false, volume: 0.5 };

export const AMBIENT_STORAGE_KEY = 'pj-ambient';
/** Tên sự kiện để thẻ điều khiển và bộ phát nói chuyện với nhau. */
export const AMBIENT_EVENT = 'pj-ambient-change';

/**
 * Đọc cài đặt từ chuỗi đã lưu, sai kiểu gì cũng không được ném lỗi.
 *
 * Dữ liệu ở localStorage là thứ người dùng sửa được và là thứ còn sót lại từ
 * phiên bản cũ của app, nên phải coi như dữ liệu lạ: hỏng thì lùi về mặc định,
 * số ngoài khoảng thì kẹp lại.
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
    return { on: doc.on === true, volume };
  } catch {
    return AMBIENT_DEFAULT;
  }
}

/**
 * Trang này có được bật nhạc nền không?
 *
 * Tắt ở mọi trang mà người học đang nghe thứ khác: máy đánh nhịp, bài luyện nhận
 * nốt, và MỌI trang bài học (bài nào cũng có thể có khối nhạc bấm nghe được, và
 * phần tập với đàn). Nhạc nền chồng lên tiếng đàn mẫu thì không còn là dễ chịu
 * nữa, nó thành thứ cản đường học.
 *
 * Nhận ra trang bài học bằng dạng đường dẫn `/<thư mục nội dung>/<slug>`, mà thư
 * mục nội dung luôn bắt đầu bằng hai chữ số (`02-chapters`, `03-exercises`).
 */
export function ambientAllowedOn(pathname: string): boolean {
  if (pathname === '/metronome' || pathname === '/note-trainer') return false;

  const segments = pathname.split('/').filter(Boolean);
  const laTrangBaiHoc = segments.length === 2 && /^\d{2}-/.test(segments[0]);
  return !laTrangBaiHoc;
}
