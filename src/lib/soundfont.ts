import type { SynthOptions } from 'abcjs';
import { createLocalStore } from './local-store';
import { octaveOf, pitchClass } from './pitch';
import { voiceChannel, type PianoVoicing } from './piano-tone';

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

/**
 * Thứ tự nhóm trong ô chọn. Xuất ra để ô chọn đọc thẳng từ đây — trước kia
 * component chép lại danh sách này, mà chép thì thêm nhóm mới là nhóm đó im lặng
 * biến khỏi ô chọn chứ không báo gì.
 */
export const INSTRUMENT_GROUPS = ['Piano cơ', 'Piano điện', 'Khác'] as const;

export type InstrumentGroup = typeof INSTRUMENT_GROUPS[number];

export interface Instrument {
  /**
   * Khoá lưu vào máy người học, và giá trị của ô chọn.
   *
   * Không dùng `program` làm khoá nữa vì **một cây đàn cho ra nhiều tiếng**: ba
   * dòng Grand Piano dưới đây cùng `program: 0`, chỉ khác cách nắn tiếng.
   */
  id: string;
  /** Số hiệu nhạc cụ theo chuẩn General MIDI, truyền vào abcjs qua `program`. */
  program: number;
  /**
   * Tên thư mục mẫu âm, phải khớp thư mục trong public/soundfonts/.
   *
   * **Không phải mình đặt tên**: abcjs tự suy tên thư mục từ `program` theo bảng
   * `instrumentIndexToName` của nó, nên trường này chỉ chép lại cho người đọc và
   * cho script tải mẫu âm. Ghi lệch là tải về một thư mục abcjs không bao giờ
   * tìm tới — `soundfont.test.ts` gác chỗ đó.
   */
  folder: string;
  label: string;
  /** Nhóm hiển thị trong ô chọn (Select group của Mantine). */
  group: InstrumentGroup;
  /**
   * Nắn tiếng sau khi abcjs dựng xong — bỏ trống là tiếng mộc của mẫu âm.
   *
   * Đây là cách app có **tiếng piano êm và vang** mà không cần thêm nhạc cụ nào:
   * mẫu âm nào cũng thu khô trong phòng tiêu âm, còn tiếng piano trong nhạc buồn
   * là tiếng đàn ĐÓ đặt trong một căn phòng. Xem `piano-tone.ts`.
   */
  voicing?: PianoVoicing;
}

/**
 * Giữ danh sách này khớp với INSTRUMENTS trong scripts/download-soundfont.mjs.
 *
 * Bộ MusyngKite chỉ có một nguồn mẫu âm chung (General MIDI), không có bản
 * ghi riêng theo hãng đàn (Yamaha, Steinway...) — mấy tiếng dưới đây là các
 * *loại* piano khác nhau trong họ nhạc cụ GM (program 0-7), không phải hãng.
 *
 * **CHỈ ĐƯỢC LÀ TIẾNG PIANO — chủ sản phẩm chốt 14/09/2026.** Họ Piano của
 * General MIDI là program 0-7, và bảng này không được ra khỏi đó. Từng thêm
 * vibraphone, đàn hạc, celesta vì chúng đo ra êm hơn hẳn, rồi gỡ ngay trong
 * ngày: đây là app dạy piano, người học nghe mẫu là để biết câu nhạc mình sắp
 * đánh nghe thế nào trên cây đàn của họ — một tiếng chuông gõ nghe hay hơn
 * nhưng nó không còn là thứ họ sắp đánh. `soundfont.test.ts` gác chỗ này.
 *
 * **Tiếng nào êm nhất thì đo chứ không đoán.** Số đo trên mẫu âm thật (C3, C4,
 * C5): trọng tâm phổ cho biết tiếng sáng hay tối, phần năng lượng trên 2kHz cho
 * biết độ chói, còn thời gian ngân quyết định nốt trắng có bị tắt giữa chừng không.
 *
 * | Tiếng | Trọng tâm phổ | Trên 2kHz | Còn ngân (-20dB) |
 * |---|---|---|---|
 * | Rhodes (`electric_piano_1`) | 360 Hz | 0,0% | 3,12s |
 * | Piano sáng tiếng | 423 Hz | 1,1% | 2,27s |
 * | Piano điện 2 | 501 Hz | 0,9% | 2,28s |
 * | Grand Piano điện | 556 Hz | 2,6% | 2,41s |
 * | Grand Piano | 624 Hz | 2,0% | 1,51s |
 * | Honky-tonk | 651 Hz | 1,3% | 0,89s |
 * | Harpsichord | 883 Hz | 9,3% | 2,25s |
 *
 * Nên người học thấy Grand Piano chói tai lúc nghe đi nghe lại một câu thì
 * **Rhodes là chỗ để đổi sang** — tên nhãn nói thẳng điều đó, vì dưới cái tên
 * "Piano điện 1" thì không ai đoán ra.
 *
 * **Mấy dòng *êm dịu*, *trong trẻo*, *vang* không phải nhạc cụ mới**, chúng là
 * chính cây đàn ở trên đem nắn lại tiếng (`voicing`). Đo trên câu mở đầu Ode to
 * Joy đánh bằng Grand Piano, tốc độ người mới tập: phần chói trên 2kHz **giảm
 * 79%**, mà chỗ trũng giữa hai nốt vẫn sâu -18,7dB nên tai vẫn đếm được từng
 * nốt — tiếng vang không trộn các nốt vào nhau.
 *
 * **Riêng *trong trẻo* dựng theo một bản ghi piano thật chủ sản phẩm gửi làm
 * mẫu** (15/09/2026). Đo hình phổ trên một đoạn hai tay có bè trầm, so ba dải
 * trên 800Hz với bản mẫu — càng nhỏ càng giống:
 *
 * | Tiếng | Cách bản mẫu | Đô6 còn lại |
 * |---|---|---|
 * | Grand Piano mộc | 5,5 dB | 100% |
 * | Grand Piano trong trẻo | **2,9 dB** | **70%** |
 * | khoét sâu hơn (đã thử, không dùng) | 2,2 dB | 57% |
 *
 * **Vì sao dừng ở đây chứ không đuổi cho giống hẳn:** thứ làm bản mẫu khác mẫu
 * âm của app nhiều nhất lại nằm đúng ở dải 800-1600Hz — dải của giai điệu. Khoét
 * sâu thêm thì số đo đẹp hơn, nhưng Đô6 tụt xuống 57% và giai điệu tay phải chìm
 * dưới bè đệm, đúng cái bẫy đã mắc một lần ở `piano-tone.ts`. Bản mẫu còn là một
 * bản ghi thật đã bị cắt trần ở 5,9kHz, nên chép y hệt cũng là chép cả khuyết
 * điểm của khâu thu.
 */
export const INSTRUMENTS: Instrument[] = [
  { id: 'grand', program: 0, folder: 'acoustic_grand_piano', label: 'Grand Piano', group: 'Piano cơ' },
  {
    id: 'grand-em',
    program: 0,
    folder: 'acoustic_grand_piano',
    label: 'Grand Piano êm dịu',
    group: 'Piano cơ',
    voicing: { soften: 0.85, reverb: 0.25 },
  },
  {
    id: 'grand-trong',
    program: 0,
    folder: 'acoustic_grand_piano',
    label: 'Grand Piano trong trẻo',
    group: 'Piano cơ',
    voicing: { roundness: 0.3, soften: 0.25, reverb: 0.4 },
  },
  {
    id: 'grand-vang',
    program: 0,
    folder: 'acoustic_grand_piano',
    label: 'Grand Piano vang (kiểu nhạc buồn)',
    group: 'Piano cơ',
    voicing: { soften: 0.85, reverb: 0.8 },
  },
  { id: 'bright', program: 1, folder: 'bright_acoustic_piano', label: 'Piano sáng tiếng', group: 'Piano cơ' },
  { id: 'honkytonk', program: 3, folder: 'honkytonk_piano', label: 'Honky-tonk (piano cũ, hơi lệch tông)', group: 'Piano cơ' },
  { id: 'electric-grand', program: 2, folder: 'electric_grand_piano', label: 'Grand Piano điện', group: 'Piano điện' },
  { id: 'rhodes', program: 4, folder: 'electric_piano_1', label: 'Piano điện Rhodes (êm nhất, ngân dài)', group: 'Piano điện' },
  {
    id: 'rhodes-vang',
    program: 4,
    folder: 'electric_piano_1',
    label: 'Rhodes vang (êm nhất, có tiếng phòng)',
    group: 'Piano điện',
    voicing: { soften: 0.5, reverb: 0.7 },
  },
  { id: 'electric-2', program: 5, folder: 'electric_piano_2', label: 'Piano điện 2', group: 'Piano điện' },
  { id: 'clavinet', program: 7, folder: 'clavinet', label: 'Clavinet', group: 'Piano điện' },
  { id: 'harpsichord', program: 6, folder: 'harpsichord', label: 'Harpsichord (đàn cổ)', group: 'Khác' },
];

/**
 * Họ Piano của General MIDI: program 0-7. Ngoài dải này là nhạc cụ khác.
 *
 * Xem chú thích trên bảng — ràng buộc sản phẩm, không phải chi tiết kỹ thuật.
 */
export const GM_PIANO_PROGRAMS = { first: 0, last: 7 };

/**
 * Tên nốt trong tên tệp mẫu âm. Bộ MusyngKite ghi phím đen bằng **dấu giáng**
 * (`Db4.mp3`), không có tệp nào tên theo dấu thăng — nên bảng này là bảng duy
 * nhất, đừng đổi sang thăng cho "giống bản nhạc".
 */
const SAMPLE_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Mẫu âm có sẵn từ La0 tới Đô8 — đúng 88 phím của cây piano. */
export const SAMPLE_RANGE = { lowest: 21, highest: 108 };

/**
 * Đường dẫn tệp mẫu âm của một nốt, ví dụ `/soundfonts/acoustic_grand_piano-mp3/Db4.mp3`.
 *
 * Dùng cho bộ phát tiếng lúc người học bấm phím (`live-piano.ts`). Phần nghe mẫu
 * không đi qua đây — abcjs tự dựng URL từ `program`.
 */
export function sampleUrl(instrument: Instrument, midi: number): string {
  const name = SAMPLE_NOTE_NAMES[pitchClass(midi)];
  return `${SOUNDFONT_URL}${instrument.folder}-mp3/${name}${octaveOf(midi)}.mp3`;
}

/**
 * Dữ liệu cho ô chọn tiếng đàn, chia nhóm theo `INSTRUMENT_GROUPS`.
 *
 * Một chỗ dựng cho mọi ô chọn — dưới bản nhạc và ở trang phát tiếng lúc bấm phím. Để mỗi
 * chỗ tự dựng thì thêm một nhóm mới là nhóm đó hiện ở chỗ này mà thiếu ở chỗ kia.
 */
export const INSTRUMENT_SELECT_DATA = INSTRUMENT_GROUPS.map((group) => ({
  group,
  items: INSTRUMENTS.filter((i) => i.group === group).map((i) => ({ value: i.id, label: i.label })),
}));

export const DEFAULT_INSTRUMENT = INSTRUMENTS[0];

/** Tiếng theo mã đã lưu, lùi về Grand Piano khi mã lạ. */
export function findInstrument(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? DEFAULT_INSTRUMENT;
}

/**
 * Ghi nhớ lựa chọn để người học không phải chọn lại ở từng bài.
 *
 * Lọc qua `INSTRUMENTS` chứ không tin bản đã lưu: bản lưu từ trước có thể trỏ tới
 * một tiếng đã gỡ khỏi bảng, mà mã lạ xuống tới bộ phát thì nó nạp một tệp tiếng
 * không tồn tại và im lặng không ra tiếng gì.
 *
 * **Bản lưu cũ là SỐ hiệu GM** (`'4'`), từ thời mỗi cây đàn chỉ có một tiếng. Đổi
 * khoá lưu là người học mất thứ đang chọn, nên khoá giữ nguyên và chỗ đọc nhận cả
 * hai dạng — số cũ tra ngược về tiếng mộc của cây đàn đó.
 */
const instrumentStore = createLocalStore<string>({
  key: 'piano-journey:instrument',
  fallback: DEFAULT_INSTRUMENT.id,
  parse: (raw) => {
    if (/^\d+$/.test(raw.trim())) {
      const cu = INSTRUMENTS.find((i) => i.program === Number(raw) && !i.voicing);
      return (cu ?? DEFAULT_INSTRUMENT).id;
    }
    return findInstrument(raw).id;
  },
  serialize: (id) => id,
});

export function loadSavedInstrument(): Instrument {
  return findInstrument(instrumentStore.getSnapshot());
}

export function saveInstrument(id: string) {
  instrumentStore.save(id);
}

export function synthOptions(instrument: Instrument): SynthOptions {
  return {
    program: instrument.program,
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
function normalizeBufferVolume(buffer: AudioBuffer) {
  const peak = bufferPeak(buffer);
  if (peak <= 0) return;

  const gain = Math.min(TARGET_PEAK / peak, MAX_GAIN);
  // Chênh dưới 1% thì tai không nghe ra, khỏi quét lại cả buffer.
  if (Math.abs(gain - 1) < 0.01) return;

  scaleBuffer(buffer, gain);
}

/** Giá trị tuyệt đối lớn nhất trên mọi kênh. */
function bufferPeak(buffer: AudioBuffer): number {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const level = Math.abs(data[i]);
      if (level > peak) peak = level;
    }
  }
  return peak;
}

function scaleBuffer(buffer: AudioBuffer, gain: number) {
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
}

/**
 * **Cửa duy nhất** nắn lại chuỗi âm thanh abcjs vừa dựng xong.
 *
 * Gộp hai việc vào một hàm vì **thứ tự giữa chúng là bắt buộc**: nắn tiếng trước,
 * kéo to sau. Làm ngược lại thì bộ lọc và tiếng vang đổi mức đỉnh sau khi đã căn
 * xong, và bản nhạc hoặc nhỏ hẳn đi hoặc vỡ tiếng. Để hai cửa riêng là sớm muộn
 * có chỗ gọi thiếu một cái, hoặc gọi đúng hai cái mà sai thứ tự.
 *
 * Phải gọi lại **mỗi lần abcjs dựng lại chuỗi âm thanh** — đổi bài, đổi tiếng
 * đàn, đổi tốc độ — vì lần nào nó cũng tạo AudioBuffer mới ở mức gốc (bẫy 20).
 */
export function shapeBuffer(buffer: AudioBuffer, instrument: Instrument) {
  shapeVoicing(buffer, instrument);
  normalizeBufferVolume(buffer);
}

function shapeVoicing(buffer: AudioBuffer, instrument: Instrument) {
  if (!instrument.voicing) return;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    voiceChannel(buffer.getChannelData(ch), buffer.sampleRate, instrument.voicing, ch);
  }
}

/**
 * Nốt dùng làm mốc âm lượng cho bộ phát tiếng lúc bấm phím: Đô giữa, nốt người học
 * bấm nhiều nhất.
 */
export const LIVE_REFERENCE_MIDI = 60;

/**
 * Đỉnh nhắm cho nốt mốc sau khi kéo to.
 *
 * **Vì sao phải kéo, và kéo bao nhiêu — đo, không đoán.** Mẫu âm MusyngKite thu rất nhỏ:
 * Đô4 của Grand Piano chỉ đạt đỉnh 0,03. Bản đầu nhân 3 theo hệ số abcjs dùng, ra 0,09 —
 * khoảng -21dB, cộng thêm lực bấm vừa tay thì trên loa điện thoại nhỏ rõ. 0,5 chừa khoảng
 * 6dB cho hai tay bấm cùng lúc; hợp âm dày hơn thì bộ nén đặt trong hook đè đỉnh.
 */
const LIVE_REFERENCE_PEAK = 0.5;

/**
 * Trần hệ số kéo. Mốc 0,03 cần khoảng 17 lần; trần 40 đủ cho tiếng đã nắn êm (tối hơn,
 * đỉnh thấp hơn) mà không kéo một tệp gần như câm thành tiếng xì.
 */
const LIVE_MAX_GAIN = 40;

/**
 * Hệ số kéo to cho **cả bộ nốt** của một tiếng đàn, đo từ nốt mốc đã nắn tiếng.
 *
 * Một hệ số chung chứ không căn đỉnh từng nốt như `shapeBuffer`: căn từng nốt lẻ là nốt nào
 * cũng to bằng nhau — mất chỗ nốt trầm dày, nốt cao mỏng vốn có của cây đàn, và nốt mượn mẫu
 * âm cho nốt bên cạnh cũng lệch mức theo.
 */
export function liveSampleGain(voicedReference: AudioBuffer): number {
  const peak = bufferPeak(voicedReference);
  return peak > 0 ? Math.min(LIVE_REFERENCE_PEAK / peak, LIVE_MAX_GAIN) : 1;
}

/**
 * Nắn **một nốt lẻ** cho bộ phát tiếng lúc bấm phím (`live-piano.ts`): nắn tiếng như phần
 * nghe mẫu, rồi nhân hệ số chung của cả bộ (`liveSampleGain`). Đo hệ số thì gọi với
 * `gain = 1` trên nốt mốc trước.
 */
export function shapeSample(buffer: AudioBuffer, instrument: Instrument, gain: number) {
  shapeVoicing(buffer, instrument);
  if (gain !== 1) scaleBuffer(buffer, gain);
}
