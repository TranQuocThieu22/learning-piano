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
}

/** Giữ danh sách này khớp với INSTRUMENTS trong scripts/download-soundfont.mjs. */
export const INSTRUMENTS: Instrument[] = [
  { program: 0, folder: 'acoustic_grand_piano', label: 'Piano cơ (Grand Piano)' },
  { program: 1, folder: 'bright_acoustic_piano', label: 'Piano sáng tiếng' },
  { program: 4, folder: 'electric_piano_1', label: 'Piano điện' },
  { program: 6, folder: 'harpsichord', label: 'Harpsichord (đàn cổ)' },
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
