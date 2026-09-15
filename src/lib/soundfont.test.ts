import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTRUMENT,
  findInstrument,
  GM_PIANO_PROGRAMS,
  INSTRUMENT_GROUPS,
  INSTRUMENT_SELECT_DATA,
  INSTRUMENTS,
  liveSampleGain,
  SAMPLE_RANGE,
  sampleUrl,
  shapeBuffer,
  shapeSample,
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

/** AudioBuffer giả đủ cho các hàm nắn tiếng: chỉ cần kênh và tần số lấy mẫu. */
function fakeBuffer(samples: number[], channels = 1): AudioBuffer {
  const data = Array.from({ length: channels }, () => Float32Array.from(samples));
  return {
    numberOfChannels: channels,
    sampleRate: 44100,
    length: samples.length,
    getChannelData: (ch: number) => data[ch],
  } as unknown as AudioBuffer;
}

describe('bộ phát tiếng lúc bấm phím tìm đúng tệp mẫu âm', () => {
  it('nốt nào trong 88 phím, của tiếng đàn nào, cũng trỏ tới một tệp có thật', () => {
    // Sai một chữ trong tên tệp (Db hay C#) là nốt đó im lặng mà không báo lỗi gì.
    const thieu: string[] = [];
    for (const instrument of INSTRUMENTS) {
      for (let midi = SAMPLE_RANGE.lowest; midi <= SAMPLE_RANGE.highest; midi++) {
        const url = sampleUrl(instrument, midi);
        const file = path.join(process.cwd(), 'public', url);
        if (!fs.existsSync(file)) thieu.push(url);
      }
    }
    expect(thieu).toEqual([]);
  });

  it('Đô giữa và phím đen ghi theo dấu giáng, đúng tên tệp của bộ mẫu âm', () => {
    expect(sampleUrl(DEFAULT_INSTRUMENT, 60)).toBe('/soundfonts/acoustic_grand_piano-mp3/C4.mp3');
    expect(sampleUrl(DEFAULT_INSTRUMENT, 61)).toBe('/soundfonts/acoustic_grand_piano-mp3/Db4.mp3');
  });
});

describe('âm lượng tiếng bấm phím', () => {
  it('mẫu âm thu nhỏ thì kéo nốt mốc lên đủ nghe trên loa điện thoại', () => {
    // 0,03 là đỉnh đo được của Đô4 Grand Piano thật.
    const gain = liveSampleGain(fakeBuffer([0, 0.03, -0.02]));
    expect(0.03 * gain).toBeCloseTo(0.5, 5);
  });

  it('tệp gần như câm thì không kéo thành tiếng xì', () => {
    expect(liveSampleGain(fakeBuffer([0, 0.0001]))).toBe(40);
    expect(liveSampleGain(fakeBuffer([0, 0]))).toBe(1);
  });

  it('mọi nốt nhân cùng một hệ số, nên nốt trầm vẫn dày hơn nốt cao', () => {
    const tram = fakeBuffer([0.04, -0.04]);
    const cao = fakeBuffer([0.01, -0.01]);
    shapeSample(tram, DEFAULT_INSTRUMENT, 10);
    shapeSample(cao, DEFAULT_INSTRUMENT, 10);
    expect(tram.getChannelData(0)[0] / cao.getChannelData(0)[0]).toBeCloseTo(4, 5);
  });
});

describe('ô chọn tiếng đàn', () => {
  it('có đủ mọi tiếng, mỗi tiếng đúng một lần', () => {
    const ids = INSTRUMENT_SELECT_DATA.flatMap((g) => g.items.map((i) => i.value));
    expect([...ids].sort()).toEqual(INSTRUMENTS.map((i) => i.id).sort());
  });
});

/** A0 tới C8 — đúng 88 phím, cùng dải mà `scripts/download-soundfont.mjs` tải. */
const SO_PHIM = 88;

describe('bảng tiếng đàn', () => {
  it('tiếng nào cũng có đủ 88 phím mẫu âm, không phím nào rỗng', () => {
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

  it('mỗi mã tiếng chỉ xuất hiện một lần', () => {
    // Số hiệu GM thì trùng được — ba dòng Grand Piano cùng `program: 0`, khác
    // nhau ở cách nắn tiếng — nhưng mã là khoá lưu nên trùng là người học chọn
    // một đằng nghe một nẻo.
    const ids = INSTRUMENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
   * Ràng buộc sản phẩm, chủ sản phẩm chốt 14/09/2026: **mọi tiếng phải là piano**.
   * Đã từng thêm vibraphone, đàn hạc, celesta vì chúng đo ra êm hơn hẳn rồi phải
   * gỡ ngay trong ngày — đây là app dạy piano, nghe mẫu là để biết câu nhạc mình
   * sắp đánh nghe ra sao trên cây đàn của mình.
   */
  it('không tiếng nào ra khỏi họ Piano của General MIDI', () => {
    for (const instrument of INSTRUMENTS) {
      expect(instrument.program, instrument.label).toBeGreaterThanOrEqual(GM_PIANO_PROGRAMS.first);
      expect(instrument.program, instrument.label).toBeLessThanOrEqual(GM_PIANO_PROGRAMS.last);
    }
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

  it('tiếng mặc định là Grand Piano mộc, không nắn gì', () => {
    expect(DEFAULT_INSTRUMENT.folder).toBe('acoustic_grand_piano');
    expect(DEFAULT_INSTRUMENT.voicing).toBeUndefined();
  });

  it('mã lạ thì lùi về Grand Piano chứ không trả về tiếng không có mẫu âm', () => {
    expect(findInstrument('khong-co-that').id).toBe(DEFAULT_INSTRUMENT.id);
    expect(findInstrument('grand-vang').voicing?.reverb).toBeGreaterThan(0);
  });

  it('người học có tiếng piano êm và vang để đổi sang khi Grand Piano nghe chói', () => {
    const nan = INSTRUMENTS.filter((i) => i.voicing);
    expect(nan.length).toBeGreaterThanOrEqual(3);
    // Nắn tiếng chỉ được đổi ÂM SẮC. Đụng vào số hiệu GM là đổi luôn cây đàn,
    // mà người học chọn "Grand Piano êm dịu" thì vẫn phải là Grand Piano.
    for (const tieng of nan) {
      const moc = INSTRUMENTS.find((i) => i.program === tieng.program && !i.voicing);
      expect(moc, `${tieng.label}: không có bản mộc cùng cây đàn`).toBeDefined();
      expect(tieng.folder).toBe(moc?.folder);
    }
  });

  it('mẫu âm tự host, và khai đúng hệ số âm lượng của bộ MusyngKite', () => {
    const options = synthOptions(DEFAULT_INSTRUMENT);
    expect(options.soundFontUrl).toBe('/soundfonts/');
    // Để trống hệ số này là abcjs rơi về 1.0 và tiếng nhỏ hẳn đi.
    expect(options.soundFontVolumeMultiplier).toBe(3);
  });
});

describe('nắn tiếng rồi kéo to bản nhạc trước khi phát', () => {
  /** Buffer giả đủ dùng: `normalizeBufferVolume` chỉ cần ba thứ này. */
  function buffer(samples: number[]): AudioBuffer {
    const data = Float32Array.from(samples);
    return {
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: () => data,
    } as unknown as AudioBuffer;
  }

  /** Grand Piano mộc: chỉ kéo to, không nắn tiếng. */
  const moc = DEFAULT_INSTRUMENT;

  it('bài thu nhỏ tiếng được kéo lên gần chạm đỉnh', () => {
    const buf = buffer([0.1, -0.05, 0.02]);
    shapeBuffer(buf, moc);
    expect(Math.max(...buf.getChannelData(0))).toBeCloseTo(0.9, 5);
  });

  it('bài lỡ quá to thì hạ xuống, không để vỡ tiếng', () => {
    const buf = buffer([0.99, -0.98]);
    shapeBuffer(buf, moc);
    expect(Math.max(...buf.getChannelData(0).map(Math.abs))).toBeLessThanOrEqual(0.9001);
  });

  it('bản nhạc toàn dấu lặng thì để yên, không khuếch đại tiếng ồn nền', () => {
    const buf = buffer([0, 0, 0]);
    shapeBuffer(buf, moc);
    expect([...buf.getChannelData(0)]).toEqual([0, 0, 0]);
  });

  it('tương quan mạnh nhẹ giữa các nốt giữ nguyên sau khi kéo', () => {
    const buf = buffer([0.2, 0.1]);
    shapeBuffer(buf, moc);
    const [manh, nhe] = buf.getChannelData(0);
    expect(manh / nhe).toBeCloseTo(2, 5);
  });
});
