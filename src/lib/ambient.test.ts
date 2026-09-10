import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DEFAULT,
  PROGRESSION,
  ambientAllowedOn,
  chordAt,
  midiToFreq,
  parseAmbient,
} from './ambient';

describe('chordAt', () => {
  it('quay vòng hết vòng hợp âm', () => {
    expect(chordAt(0)).toBe(PROGRESSION[0]);
    expect(chordAt(PROGRESSION.length)).toBe(PROGRESSION[0]);
    expect(chordAt(PROGRESSION.length + 2)).toBe(PROGRESSION[2]);
  });

  // Chỉ số âm không xảy ra lúc chạy, nhưng `%` của JavaScript trả về số âm nên
  // `PROGRESSION[-1]` sẽ là undefined và bộ phát ném lỗi giữa chừng.
  it('chỉ số âm vẫn trả về hợp âm thật', () => {
    expect(chordAt(-1)).toBe(PROGRESSION[PROGRESSION.length - 1]);
  });
});

describe('midiToFreq', () => {
  it('La quãng tám 4 là 440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('lên một quãng tám là gấp đôi tần số', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6);
  });

  it('mọi nốt trong vòng hợp âm đều nằm trong khoảng nghe được', () => {
    for (const chord of PROGRESSION) {
      for (const note of chord.notes) {
        const f = midiToFreq(note);
        expect(f).toBeGreaterThan(80);
        expect(f).toBeLessThan(1000);
      }
    }
  });
});

describe('parseAmbient', () => {
  it('chưa lưu gì thì lùi về mặc định, và mặc định là TẮT', () => {
    expect(parseAmbient(null)).toEqual(AMBIENT_DEFAULT);
    expect(AMBIENT_DEFAULT.on).toBe(false);
  });

  it('chuỗi hỏng không được ném lỗi', () => {
    expect(parseAmbient('{khong-phai-json')).toEqual(AMBIENT_DEFAULT);
    expect(parseAmbient('null')).toEqual(AMBIENT_DEFAULT);
    expect(parseAmbient('"chuỗi"')).toEqual(AMBIENT_DEFAULT);
  });

  it('đọc đúng giá trị đã lưu', () => {
    expect(parseAmbient('{"on":true,"volume":0.3}')).toEqual({ on: true, volume: 0.3 });
  });

  it('âm lượng ngoài khoảng thì kẹp về 0..1', () => {
    expect(parseAmbient('{"on":true,"volume":9}').volume).toBe(1);
    expect(parseAmbient('{"on":true,"volume":-3}').volume).toBe(0);
    expect(parseAmbient('{"on":true,"volume":"to"}').volume).toBe(AMBIENT_DEFAULT.volume);
  });

  it('chỉ đúng true mới là bật', () => {
    expect(parseAmbient('{"on":"true"}').on).toBe(false);
    expect(parseAmbient('{"on":1}').on).toBe(false);
  });
});

describe('ambientAllowedOn', () => {
  it('bật được ở các trang chỉ để xem', () => {
    for (const p of ['/', '/library', '/exercises', '/journal', '/terms', '/checkout']) {
      expect(ambientAllowedOn(p)).toBe(true);
    }
  });

  it('tắt ở trang có tiếng khác đang phát', () => {
    expect(ambientAllowedOn('/metronome')).toBe(false);
    expect(ambientAllowedOn('/note-trainer')).toBe(false);
  });

  // Mọi bài học đều có thể chứa khối nhạc bấm nghe được và phần tập với đàn.
  it('tắt ở mọi trang bài học', () => {
    expect(ambientAllowedOn('/03-exercises/chuong-01-bai-02')).toBe(false);
    expect(ambientAllowedOn('/02-chapters/chuong-00')).toBe(false);
    expect(ambientAllowedOn('/07-doc-them/lich-su-piano')).toBe(false);
  });

  it('không nhầm trang hai đoạn khác với trang bài học', () => {
    expect(ambientAllowedOn('/checkout/abc123')).toBe(true);
    expect(ambientAllowedOn('/admin/payments')).toBe(true);
  });
});
