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
 * Một bài nhạc nền.
 *
 * **Cả ba bài đều ở Đô trưởng, và đó là ràng buộc chứ không phải thiếu ý tưởng.**
 * Chương 1 dạy đúng năm nốt Đô-Rê-Mi-Pha-Sol; nhạc nền ở giọng khác sẽ nghịch
 * tai với chính thứ người học đang bấm. Muốn ba bài nghe khác nhau thì đổi bốn
 * thứ còn lại: vòng hợp âm, tốc độ, mật độ nốt, và tầm cao thấp của các nốt rải.
 */
export interface AmbientPiece {
  /** Khoá lưu xuống localStorage. Đổi là người học mất bài đang chọn, đừng đổi. */
  id: string;
  /** Tên hiện trên thẻ điều khiển. */
  name: string;
  /** Một dòng tả cảm giác, để chọn mà không cần bấm thử từng bài. */
  hint: string;
  bpm: number;
  /** Mỗi hợp âm kéo dài mấy ô nhịp. Càng nhỏ thì bài càng thấy trôi nhanh. */
  barsPerChord: number;
  progression: AmbientChord[];
  /** Các mẫu rải nốt, mỗi mẫu tám móc đơn cho một ô nhịp 4/4. */
  patterns: (number | null)[][];
}

/*
 * **Không có hệ số chỉnh âm lượng riêng cho từng bài, và đó là kết quả đo chứ
 * không phải bỏ sót.**
 *
 * Lo ban đầu là chính đáng: bài dày nốt lẽ ra phải to hơn bài thưa nốt ở cùng
 * một nấc thanh trượt, mà thanh trượt cần có nghĩa như nhau ở mọi bài — đổi bài
 * xong lại phải với tay chỉnh âm lượng là hỏng. Nhưng đo thật (kết xuất
 * `OfflineAudioContext` 62 giây mỗi bài rồi lấy RMS, cách đo ghi ở
 * `ambient-engine.ts`) thì ra thế này ở nấc kéo hết cỡ:
 *
 * | Bài | RMS | Đỉnh |
 * |---|---|---|
 * | Nắng sớm | -15,9dB | 0,87 |
 * | Chiều êm | -16,4dB | 0,88 |
 * | Bước nhẹ | -15,8dB | 0,87 |
 *
 * Chênh nhau 0,6dB, dưới ngưỡng tai nghe ra được (khoảng 1dB) — vì bộ nén ở cuối
 * chuỗi đã san bằng sẵn. Thêm một hệ số chỉnh vào lúc này là thêm một con số
 * không làm gì, mà lần sau sửa lại phải đoán xem nó dùng để làm gì.
 *
 * **Thêm bài mới thì đo lại.** Lệch quá 1dB thì mới dựng hệ số chỉnh, đừng chỉnh
 * bằng tai.
 */

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
const VONG_NANG_SOM: AmbientChord[] = [
  { name: 'C', bass: 48, tones: [60, 64, 67, 72] },
  { name: 'G', bass: 43, tones: [59, 62, 67, 71] },
  { name: 'Am', bass: 45, tones: [57, 60, 64, 69] },
  { name: 'F', bass: 41, tones: [57, 60, 65, 69] },
];

/**
 * Vòng vi–IV–I–V, cùng bốn hợp âm của bài trên nhưng **bắt đầu từ La thứ**.
 *
 * Cùng nguyên liệu mà đổi chỗ vào là đổi hẳn cảm giác: mở ra bằng hợp âm thứ thì
 * nghe trầm lắng, dù cả vòng vẫn nằm gọn trong Đô trưởng và không hề nghịch tai
 * với nốt người học đang bấm. Các nốt rải hạ xuống một quãng so với bài trên cho
 * tiếng ấm hơn.
 */
const VONG_CHIEU_EM: AmbientChord[] = [
  { name: 'Am', bass: 45, tones: [57, 60, 64, 69] },
  { name: 'F', bass: 41, tones: [53, 57, 60, 65] },
  { name: 'C', bass: 48, tones: [55, 60, 64, 67] },
  { name: 'G', bass: 43, tones: [55, 59, 62, 67] },
];

/**
 * Vòng I–vi–ii–V, và đây là bài duy nhất có hợp âm Rê thứ.
 *
 * Thêm một hợp âm mới vào là vòng nghe lạ hẳn so với hai bài kia dù vẫn đúng
 * giọng. Các nốt rải đẩy lên cao một quãng tám cho tiếng sáng, hợp với chỗ nhanh
 * nhất trong ba bài.
 */
const VONG_BUOC_NHE: AmbientChord[] = [
  { name: 'C', bass: 48, tones: [64, 67, 72, 76] },
  { name: 'Am', bass: 45, tones: [64, 69, 72, 76] },
  { name: 'Dm', bass: 50, tones: [62, 65, 69, 74] },
  { name: 'G', bass: 43, tones: [62, 67, 71, 74] },
];

/**
 * Ba bài nhạc nền. Bài đầu là mặc định.
 *
 * Số là chỉ số trong `tones` của hợp âm; `null` là lặng. **Lặng quan trọng ngang
 * nốt**: rải kín tám móc suốt mấy phút là thành tiếng máy khâu, tai bám theo rồi
 * đâm mệt. Mỗi mẫu đều chừa ít nhất hai chỗ thở, và có test gác điều đó.
 *
 * Bốn mẫu đổi vòng theo từng ô nhịp nên phải qua tám ô mới lặp lại đúng một cặp
 * hợp âm + mẫu.
 */
export const PIECES: AmbientPiece[] = [
  {
    id: 'nang-som',
    name: 'Nắng sớm',
    hint: 'Vui, sáng — bài mặc định',
    bpm: 100,
    barsPerChord: 2,
    progression: VONG_NANG_SOM,
    patterns: [
      [0, 2, 1, 3, null, 2, 1, null],
      [0, 1, 2, 3, 2, null, 1, null],
      [2, null, 1, 2, 3, null, 2, 1],
      [0, 2, 3, null, 2, 1, null, 2],
    ],
  },
  {
    id: 'chieu-em',
    name: 'Chiều êm',
    hint: 'Chậm, thưa nốt — lúc cần yên',
    /*
     * 88 thay vì 100, và mẫu rải thưa hẳn.
     *
     * Đây KHÔNG phải quay lại bản thiền hồi đầu (hợp âm bậc 7 ngân dài, bị bỏ vì
     * ru ngủ). Chỗ khác nhau là bài này vẫn có tiếng gảy và vẫn nghe ra ô nhịp —
     * chậm chứ không lơ lửng. Và nó chỉ kêu khi người học tự chọn, mặc định vẫn
     * là bài sáng, nên không ai bị đẩy vào chỗ buồn ngủ mà không muốn.
     */
    bpm: 88,
    barsPerChord: 2,
    progression: VONG_CHIEU_EM,
    patterns: [
      [0, null, 2, null, 1, null, 2, null],
      [0, 2, null, 3, null, 2, null, null],
      [2, null, 1, null, 0, null, 2, null],
      [0, null, 2, 3, null, 1, null, null],
    ],
  },
  {
    id: 'buoc-nhe',
    name: 'Bước nhẹ',
    hint: 'Nhanh, nhiều nốt — lúc cần đà',
    bpm: 112,
    // Một ô nhịp một hợp âm: đổi hợp âm gấp đôi hai bài kia, nghe là thấy đi tới.
    barsPerChord: 1,
    progression: VONG_BUOC_NHE,
    patterns: [
      [0, 2, 1, 3, null, 2, 3, null],
      [3, 2, null, 1, 2, null, 0, 2],
      [0, 1, 2, null, 3, 2, null, 1],
      [2, null, 3, 1, 2, null, 0, 2],
    ],
  },
];

/** Bài mặc định, cũng là bài duy nhất tồn tại trước ngày 11/09/2026. */
export const DEFAULT_PIECE_ID = PIECES[0].id;

/**
 * Bài theo khoá đã lưu. Khoá lạ (bản lưu cũ, người dùng sửa tay) thì lùi về mặc
 * định chứ không được trả về `undefined` — bộ phát sẽ ném lỗi giữa chừng.
 */
export function pieceById(id: string | undefined): AmbientPiece {
  return PIECES.find((p) => p.id === id) ?? PIECES[0];
}

/** Hợp âm thứ `index` trong vòng của bài, quay vòng mãi. Nhận cả số âm cho an toàn. */
export function chordAt(piece: AmbientPiece, index: number): AmbientChord {
  const n = piece.progression.length;
  return piece.progression[((index % n) + n) % n];
}

/** Mẫu rải cho ô nhịp thứ `barIndex` tính từ lúc bật nhạc. */
export function arpeggioForBar(piece: AmbientPiece, barIndex: number): (number | null)[] {
  const n = piece.patterns.length;
  return piece.patterns[((barIndex % n) + n) % n];
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
  /** Khoá bài đang chọn trong `PIECES`. Thêm 11/09/2026, trước đó chỉ có một bài. */
  piece: string;
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
export const AMBIENT_DEFAULT: AmbientSettings = { on: true, volume: 0.5, piece: DEFAULT_PIECE_ID };

export const AMBIENT_STORAGE_KEY = 'pj-ambient';

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
    /*
     * Đi qua `pieceById` chứ không nhận thẳng chuỗi đã lưu: bản lưu từ trước ngày
     * 11/09/2026 không có trường này, và người dùng sửa tay localStorage thì đưa
     * vào tên gì cũng được. Khoá lạ mà lọt xuống bộ phát là nó đọc `undefined` rồi
     * ném lỗi giữa chừng, mà lúc đó chẳng có gì chỉ ra nguyên nhân nằm ở đây.
     */
    const piece = pieceById(typeof doc.piece === 'string' ? doc.piece : undefined).id;
    return { on: doc.on !== false, volume, piece };
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
