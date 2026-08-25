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
