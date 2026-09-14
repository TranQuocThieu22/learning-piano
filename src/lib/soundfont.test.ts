import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROGRAM,
  INSTRUMENT_GROUPS,
  INSTRUMENTS,
  normalizeBufferVolume,
  synthOptions,
} from './soundfont';

/**
 * Ca quan trọng nhất của tệp này là ca **đếm tệp mẫu âm**.
 *
 * Thêm một nhạc cụ vào bảng mà quên tải mẫu âm về thì không có gì đỏ: trang vẫn
 * dựng, ô chọn vẫn có dòng mới, người học bấm vào rồi bấm nghe mẫu và **không ra
 * tiếng gì cả** — không báo lỗi, không log. Đúng kiểu hỏng mà chỉ người học gặp,
 * và họ tưởng máy mình hỏng. Đọc thư mục thật chứ không dựng tệp giả, cùng lối
 * với `updates.test.ts`.
 */
const SOUNDFONT_DIR = path.join(process.cwd(), 'public', 'soundfonts');

/** A0 tới C8 — đúng 88 phím, cùng dải mà `scripts/download-soundfont.mjs` tải. */
const SO_PHIM = 88;

describe('bảng tiếng đàn', () => {
  it('nhạc cụ nào cũng có đủ 88 phím mẫu âm, không phím nào rỗng', () => {
    for (const instrument of INSTRUMENTS) {
      const dir = path.join(SOUNDFONT_DIR, `${instrument.folder}-mp3`);
      expect(fs.existsSync(dir), `${instrument.label}: thiếu thư mục ${instrument.folder}-mp3`).toBe(true);

      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mp3'));
      expect(files.length, instrument.folder).toBe(SO_PHIM);
      for (const file of files) {
        expect(fs.statSync(path.join(dir, file)).size, `${instrument.folder}/${file}`).toBeGreaterThan(0);
      }
    }
  });

  it('tên thư mục khớp bảng nhạc cụ của abcjs, vì abcjs tự suy tên từ số hiệu', () => {
    /*
     * abcjs ghép `{soundFontUrl}{tên nó tự suy}-mp3/{nốt}.mp3`, nên tên trong bảng
     * của mình chỉ đúng khi trùng bảng của nó. Lệch là tải mẫu âm về một thư mục
     * abcjs không bao giờ tìm tới, và lại im lặng không ra tiếng.
     *
     * Đọc tệp của abcjs như CHỮ chứ không `import`: đó là tệp bên trong thư viện,
     * không có khai báo kiểu nên `tsc` đỏ. Đường dẫn ổn định vì `abcjs` ghim đúng
     * `6.7.0` không có dấu `^` (lý do ở mục 1 của `nhat-ky-quyet-dinh.md`).
     */
    const file = createRequire(import.meta.url).resolve('abcjs/src/synth/instrument-index-to-name.js');
    const names = [...fs.readFileSync(file, 'utf8').matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(46);
    for (const instrument of INSTRUMENTS) {
      expect(names[instrument.program], `program ${instrument.program}`).toBe(instrument.folder);
    }
  });

  it('script tải mẫu âm biết đúng những nhạc cụ đang bày ra cho người học', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts', 'download-soundfont.mjs'), 'utf8');
    const trongScript = /const INSTRUMENTS = \[([\s\S]*?)\]/.exec(script)?.[1] ?? '';
    for (const instrument of INSTRUMENTS) {
      expect(trongScript, instrument.folder).toContain(`'${instrument.folder}'`);
    }
  });

  it('mỗi số hiệu nhạc cụ chỉ xuất hiện một lần', () => {
    const programs = INSTRUMENTS.map((i) => i.program);
    expect(new Set(programs).size).toBe(programs.length);
  });

  it('nhóm nào cũng có nhạc cụ, và không nhạc cụ nào rơi ra ngoài ô chọn', () => {
    // Ô chọn vẽ theo `INSTRUMENT_GROUPS`; nhạc cụ mang nhóm lạ thì biến mất khỏi ô.
    for (const group of INSTRUMENT_GROUPS) {
      expect(INSTRUMENTS.some((i) => i.group === group), group).toBe(true);
    }
    for (const instrument of INSTRUMENTS) {
      expect(INSTRUMENT_GROUPS, instrument.label).toContain(instrument.group);
    }
  });

  it('tiếng mặc định là Grand Piano và nằm trong bảng', () => {
    expect(INSTRUMENTS.some((i) => i.program === DEFAULT_PROGRAM)).toBe(true);
    expect(INSTRUMENTS[0].folder).toBe('acoustic_grand_piano');
  });

  it('người học có tiếng êm để đổi sang khi Grand Piano nghe chói', () => {
    const em = INSTRUMENTS.filter((i) => i.group === 'Tiếng êm');
    expect(em.length).toBeGreaterThanOrEqual(3);
    // Rhodes là tiếng êm nhất đo được, nên nó phải nằm trong nhóm đó chứ không
    // nấp dưới tên "Piano điện 1" như trước.
    expect(em.some((i) => i.folder === 'electric_piano_1')).toBe(true);
  });

  it('mẫu âm tự host, và khai đúng hệ số âm lượng của bộ MusyngKite', () => {
    const options = synthOptions(DEFAULT_PROGRAM);
    expect(options.soundFontUrl).toBe('/soundfonts/');
    // Để trống hệ số này là abcjs rơi về 1.0 và tiếng nhỏ hẳn đi.
    expect(options.soundFontVolumeMultiplier).toBe(3);
  });
});

describe('kéo to bản nhạc trước khi phát', () => {
  /** Buffer giả đủ dùng: `normalizeBufferVolume` chỉ cần ba thứ này. */
  function buffer(samples: number[]): AudioBuffer {
    const data = Float32Array.from(samples);
    return {
      numberOfChannels: 1,
      getChannelData: () => data,
    } as unknown as AudioBuffer;
  }

  it('bài thu nhỏ tiếng được kéo lên gần chạm đỉnh', () => {
    const buf = buffer([0.1, -0.05, 0.02]);
    normalizeBufferVolume(buf);
    expect(Math.max(...buf.getChannelData(0))).toBeCloseTo(0.9, 5);
  });

  it('bài lỡ quá to thì hạ xuống, không để vỡ tiếng', () => {
    const buf = buffer([0.99, -0.98]);
    normalizeBufferVolume(buf);
    expect(Math.max(...buf.getChannelData(0).map(Math.abs))).toBeLessThanOrEqual(0.9001);
  });

  it('bản nhạc toàn dấu lặng thì để yên, không khuếch đại tiếng ồn nền', () => {
    const buf = buffer([0, 0, 0]);
    normalizeBufferVolume(buf);
    expect([...buf.getChannelData(0)]).toEqual([0, 0, 0]);
  });

  it('tương quan mạnh nhẹ giữa các nốt giữ nguyên sau khi kéo', () => {
    const buf = buffer([0.2, 0.1]);
    normalizeBufferVolume(buf);
    const [manh, nhe] = buf.getChannelData(0);
    expect(manh / nhe).toBeCloseTo(2, 5);
  });
});
