import type { SynthOptions } from 'abcjs';

/**
 * Mẫu âm tự host trong `public/soundfonts/` (bộ MusyngKite).
 * Tải về bằng `node scripts/download-soundfont.mjs`.
 *
 * Tự host thay vì trỏ ra CDN paulrosen.github.io vì hai lý do: người học mất
 * mạng vẫn nghe được bài mẫu, và không phụ thuộc vào một tên miền bên thứ ba
 * mà mình không kiểm soát.
 */
export const SOUNDFONT_URL = '/soundfonts/';

/**
 * abcjs chỉ tự đặt hệ số âm lượng 3.0 khi nhận ra đúng URL CDN của MusyngKite;
 * dùng URL nội bộ thì nó rơi về 1.0 và tiếng nhỏ hẳn đi. Khai báo lại cho khớp.
 * Xem `CreateSynth.init` trong abcjs (`self.soundFontVolumeMultiplier`).
 *
 * Đây chỉ là mức abcjs dựng ra ban đầu; mức phát ra tai người học do
 * `normalizeBufferVolume` ở cuối tệp quyết định.
 */
const MUSYNG_KITE_VOLUME_MULTIPLIER = 3.0;

export interface Instrument {
  /** Số hiệu nhạc cụ theo chuẩn General MIDI, truyền vào abcjs qua `program`. */
  program: number;
  /** Tên thư mục mẫu âm, phải khớp thư mục trong public/soundfonts/. */
  folder: string;
  label: string;
  /** Nhóm hiển thị trong ô chọn (Select group của Mantine). */
  group: 'Piano cơ' | 'Piano điện' | 'Khác';
}

/**
 * Giữ danh sách này khớp với INSTRUMENTS trong scripts/download-soundfont.mjs.
 *
 * Bộ MusyngKite chỉ có một nguồn mẫu âm chung (General MIDI), không có bản
 * ghi riêng theo hãng đàn (Yamaha, Steinway...) — danh sách dưới đây là các
 * *loại* piano khác nhau trong họ nhạc cụ GM (program 0-7), không phải hãng.
 */
export const INSTRUMENTS: Instrument[] = [
  { program: 0, folder: 'acoustic_grand_piano', label: 'Grand Piano', group: 'Piano cơ' },
  { program: 1, folder: 'bright_acoustic_piano', label: 'Piano sáng tiếng', group: 'Piano cơ' },
  { program: 3, folder: 'honkytonk_piano', label: 'Honky-tonk (piano cũ, hơi lệch tông)', group: 'Piano cơ' },
  { program: 2, folder: 'electric_grand_piano', label: 'Grand Piano điện', group: 'Piano điện' },
  { program: 4, folder: 'electric_piano_1', label: 'Piano điện 1', group: 'Piano điện' },
  { program: 5, folder: 'electric_piano_2', label: 'Piano điện 2', group: 'Piano điện' },
  { program: 7, folder: 'clavinet', label: 'Clavinet', group: 'Piano điện' },
  { program: 6, folder: 'harpsichord', label: 'Harpsichord (đàn cổ)', group: 'Khác' },
];

export const DEFAULT_PROGRAM = INSTRUMENTS[0].program;

const STORAGE_KEY = 'piano-journey:instrument';

/** Ghi nhớ lựa chọn để người học không phải chọn lại ở từng bài. */
export function loadSavedProgram(): number {
  if (typeof window === 'undefined') return DEFAULT_PROGRAM;
  const saved = Number(window.localStorage.getItem(STORAGE_KEY));
  return INSTRUMENTS.some((i) => i.program === saved) ? saved : DEFAULT_PROGRAM;
}

export function saveProgram(program: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String(program));
}

export function synthOptions(program: number): SynthOptions {
  return {
    program,
    soundFontUrl: SOUNDFONT_URL,
    soundFontVolumeMultiplier: MUSYNG_KITE_VOLUME_MULTIPLIER,
  };
}

/**
 * Đỉnh âm lượng muốn đạt sau khi kéo to, trên thang -1..1 của Web Audio.
 * Chừa lại 10% cho chắc, chạm đúng 1.0 là bắt đầu vỡ tiếng.
 */
const TARGET_PEAK = 0.9;

/**
 * Trần khuếch đại. Bản nhạc gần như im lặng (chỉ có dấu lặng, hoặc nốt cực
 * nhỏ) mà kéo lên vô hạn thì chỉ khuếch đại tiếng ồn nền của mẫu âm.
 */
const MAX_GAIN = 20;

/**
 * Kéo to bản nhạc abcjs vừa dựng xong, ngay trên buffer, trước khi phát.
 *
 * Bộ MusyngKite thu ở mức rất nhỏ: nốt to nhất trong quãng của giáo trình
 * (Đô2 tới Đô6) chỉ chạm đỉnh khoảng 0.11 trên thang -1..1. Nhân với hệ số 3.0
 * mà abcjs dùng cho bộ này thì một giai điệu một tay phát ra chỉ quanh
 * -16 dBFS — mở hết loa laptop nghe vẫn nhỏ.
 *
 * Không thể chỉ nâng `soundFontVolumeMultiplier` lên cao: hệ số đó áp cứng cho
 * mọi bài, nên mức đủ to cho bài một tay sẽ làm bài hai tay nhiều nốt chồng
 * nhau bị vỡ tiếng. Đo đỉnh thật của từng bài rồi kéo vừa đủ thì to hết mức mà
 * chắc chắn không vỡ, đồng thời tự hạ xuống nếu bài nào lỡ quá to.
 *
 * Sửa thẳng trên Float32Array của buffer nên tương quan mạnh/nhẹ giữa các nốt
 * (abcjs đánh phách mạnh 105, phách nhẹ 85) vẫn giữ nguyên.
 */
export function normalizeBufferVolume(buffer: AudioBuffer) {
  const channels: Float32Array[] = [];
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    channels.push(data);
    for (let i = 0; i < data.length; i++) {
      const level = Math.abs(data[i]);
      if (level > peak) peak = level;
    }
  }
  if (peak <= 0) return;

  const gain = Math.min(TARGET_PEAK / peak, MAX_GAIN);
  // Chênh dưới 1% thì tai không nghe ra, khỏi quét lại cả buffer.
  if (Math.abs(gain - 1) < 0.01) return;

  for (const data of channels) {
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
}
