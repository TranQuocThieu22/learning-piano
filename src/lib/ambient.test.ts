import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DEFAULT,
  ARPEGGIO_PATTERNS,
  PROGRESSION,
  ambientAllowedOn,
  arpeggioForBar,
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

describe('arpeggioForBar', () => {
  it('đổi mẫu theo từng ô nhịp rồi mới quay lại', () => {
    expect(arpeggioForBar(0)).toBe(ARPEGGIO_PATTERNS[0]);
    expect(arpeggioForBar(1)).toBe(ARPEGGIO_PATTERNS[1]);
    expect(arpeggioForBar(ARPEGGIO_PATTERNS.length)).toBe(ARPEGGIO_PATTERNS[0]);
    expect(arpeggioForBar(-1)).toBe(ARPEGGIO_PATTERNS[ARPEGGIO_PATTERNS.length - 1]);
  });

  it('mỗi mẫu đúng tám móc đơn cho một ô nhịp 4/4', () => {
    for (const pattern of ARPEGGIO_PATTERNS) {
      expect(pattern).toHaveLength(8);
    }
  });

  // Rải kín tám móc suốt mấy phút là thành tiếng máy khâu; mỗi mẫu phải có chỗ thở.
  it('mẫu nào cũng có ít nhất hai chỗ lặng', () => {
    for (const pattern of ARPEGGIO_PATTERNS) {
      expect(pattern.filter((x) => x === null).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('chỉ số nốt luôn nằm trong số nốt của mọi hợp âm', () => {
    const itNhatSoNot = Math.min(...PROGRESSION.map((c) => c.tones.length));
    for (const pattern of ARPEGGIO_PATTERNS) {
      for (const step of pattern) {
        if (step === null) continue;
        expect(step).toBeGreaterThanOrEqual(0);
        expect(step).toBeLessThan(itNhatSoNot);
      }
    }
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
      for (const midi of [chord.bass, ...chord.tones]) {
        const f = midiToFreq(midi);
        expect(f).toBeGreaterThan(60);
        expect(f).toBeLessThan(1200);
      }
    }
  });

  it('nốt trầm luôn thấp hơn mọi nốt rải', () => {
    for (const chord of PROGRESSION) {
      expect(chord.bass).toBeLessThan(Math.min(...chord.tones));
    }
  });
});

describe('parseAmbient', () => {
  it('chưa lưu gì thì lùi về mặc định, và mặc định là BẬT', () => {
    expect(parseAmbient(null)).toEqual(AMBIENT_DEFAULT);
    expect(AMBIENT_DEFAULT.on).toBe(true);
  });

  it('chuỗi hỏng không được ném lỗi', () => {
    expect(parseAmbient('{khong-phai-json')).toEqual(AMBIENT_DEFAULT);
    expect(parseAmbient('null')).toEqual(AMBIENT_DEFAULT);
    expect(parseAmbient('"chuỗi"')).toEqual(AMBIENT_DEFAULT);
  });

  // Đây là ca quan trọng nhất từ khi mặc định đổi thành bật: người học đã gạt
  // tắt thì mở app lần sau KHÔNG được tự kêu lại.
  it('người học gạt tắt thì nhớ đúng là tắt', () => {
    expect(parseAmbient('{"on":false,"volume":0.5}').on).toBe(false);
  });

  it('thiếu trường on (bản lưu từ phiên bản cũ) thì theo mặc định mới', () => {
    expect(parseAmbient('{"volume":0.3}')).toEqual({ on: true, volume: 0.3 });
  });

  it('âm lượng ngoài khoảng thì kẹp về 0..1', () => {
    expect(parseAmbient('{"on":true,"volume":9}').volume).toBe(1);
    expect(parseAmbient('{"on":true,"volume":-3}').volume).toBe(0);
    expect(parseAmbient('{"on":true,"volume":"to"}').volume).toBe(AMBIENT_DEFAULT.volume);
  });
});

describe('ambientAllowedOn', () => {
  it('bật được ở các trang chỉ để xem', () => {
    for (const p of ['/', '/library', '/exercises', '/journal', '/terms', '/checkout']) {
      expect(ambientAllowedOn(p)).toBe(true);
    }
  });

  it('tắt ở hai trang sinh ra để phát tiếng', () => {
    expect(ambientAllowedOn('/metronome')).toBe(false);
    expect(ambientAllowedOn('/note-trainer')).toBe(false);
  });

  // Đổi 11/09/2026: đọc phần chữ của bài thì nhạc vẫn chạy. Việc tắt lúc bấm
  // nghe bản nhạc mẫu hay mở phần tập với đàn do `ambient-hold.ts` lo.
  it('KHÔNG tắt theo trang ở bài học nữa', () => {
    expect(ambientAllowedOn('/03-exercises/chuong-01-bai-02')).toBe(true);
    expect(ambientAllowedOn('/02-chapters/chuong-00')).toBe(true);
  });
});
