import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DEFAULT,
  DEFAULT_PIECE_ID,
  PIECES,
  ambientAllowedOn,
  arpeggioForBar,
  chordAt,
  midiToFreq,
  parseAmbient,
  pieceById,
} from './ambient';

const NANG_SOM = PIECES[0];

describe('chordAt', () => {
  it('quay vòng hết vòng hợp âm', () => {
    const { progression } = NANG_SOM;
    expect(chordAt(NANG_SOM, 0)).toBe(progression[0]);
    expect(chordAt(NANG_SOM, progression.length)).toBe(progression[0]);
    expect(chordAt(NANG_SOM, progression.length + 2)).toBe(progression[2]);
  });

  // Chỉ số âm không xảy ra lúc chạy, nhưng `%` của JavaScript trả về số âm nên
  // `progression[-1]` sẽ là undefined và bộ phát ném lỗi giữa chừng.
  it('chỉ số âm vẫn trả về hợp âm thật', () => {
    for (const piece of PIECES) {
      const cuoi = piece.progression[piece.progression.length - 1];
      expect(chordAt(piece, -1)).toBe(cuoi);
    }
  });
});

describe('arpeggioForBar', () => {
  it('đổi mẫu theo từng ô nhịp rồi mới quay lại', () => {
    const { patterns } = NANG_SOM;
    expect(arpeggioForBar(NANG_SOM, 0)).toBe(patterns[0]);
    expect(arpeggioForBar(NANG_SOM, 1)).toBe(patterns[1]);
    expect(arpeggioForBar(NANG_SOM, patterns.length)).toBe(patterns[0]);
    expect(arpeggioForBar(NANG_SOM, -1)).toBe(patterns[patterns.length - 1]);
  });
});

/*
 * Từ 11/09/2026 có ba bài, nên mọi ràng buộc về nhạc phải soi TỪNG bài chứ không
 * riêng bài mặc định — thêm bài thứ tư mà quên kiểm là ra một bài nghe sai mà
 * không có gì báo.
 */
describe.each(PIECES.map((p) => [p.name, p] as const))('bài %s', (_ten, piece) => {
  it('mỗi mẫu đúng tám móc đơn cho một ô nhịp 4/4', () => {
    for (const pattern of piece.patterns) {
      expect(pattern).toHaveLength(8);
    }
  });

  // Rải kín tám móc suốt mấy phút là thành tiếng máy khâu; mỗi mẫu phải có chỗ thở.
  it('mẫu nào cũng có ít nhất hai chỗ lặng', () => {
    for (const pattern of piece.patterns) {
      expect(pattern.filter((x) => x === null).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('chỉ số nốt luôn nằm trong số nốt của mọi hợp âm', () => {
    const itNhatSoNot = Math.min(...piece.progression.map((c) => c.tones.length));
    for (const pattern of piece.patterns) {
      for (const step of pattern) {
        if (step === null) continue;
        expect(step).toBeGreaterThanOrEqual(0);
        expect(step).toBeLessThan(itNhatSoNot);
      }
    }
  });

  it('mọi nốt đều nằm trong khoảng nghe được', () => {
    for (const chord of piece.progression) {
      for (const midi of [chord.bass, ...chord.tones]) {
        const f = midiToFreq(midi);
        expect(f).toBeGreaterThan(60);
        expect(f).toBeLessThan(1200);
      }
    }
  });

  it('nốt trầm luôn thấp hơn mọi nốt rải', () => {
    for (const chord of piece.progression) {
      expect(chord.bass).toBeLessThan(Math.min(...chord.tones));
    }
  });

  /*
   * Ràng buộc của giáo trình, không phải chuyện thẩm mỹ: Chương 1 dạy đúng năm
   * nốt Đô-Rê-Mi-Pha-Sol, nhạc nền lạc giọng sẽ nghịch tai với chính thứ người
   * học đang bấm. Đô trưởng là các phím trắng, tức lớp cao độ 0,2,4,5,7,9,11 —
   * dính một phím đen là bài đó đã ra khỏi giọng.
   */
  it('không có nốt nào ngoài Đô trưởng', () => {
    const PHIM_TRANG = [0, 2, 4, 5, 7, 9, 11];
    for (const chord of piece.progression) {
      for (const midi of [chord.bass, ...chord.tones]) {
        expect(PHIM_TRANG).toContain(((midi % 12) + 12) % 12);
      }
    }
  });

  it('tốc độ nằm trong khoảng dùng được', () => {
    expect(piece.bpm).toBeGreaterThanOrEqual(60);
    expect(piece.bpm).toBeLessThanOrEqual(140);
  });
});

describe('PIECES', () => {
  it('khoá của bài không trùng nhau', () => {
    const ids = PIECES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Khoá được lưu trong localStorage của người học; đổi là họ mất bài đang chọn.
  it('giữ nguyên khoá của ba bài đã phát hành', () => {
    expect(PIECES.map((p) => p.id)).toEqual(['nang-som', 'chieu-em', 'buoc-nhe']);
  });

  it('bài mặc định là bài đầu tiên', () => {
    expect(DEFAULT_PIECE_ID).toBe(PIECES[0].id);
    expect(AMBIENT_DEFAULT.piece).toBe(PIECES[0].id);
  });
});

describe('pieceById', () => {
  it('tìm được bài theo khoá', () => {
    expect(pieceById('chieu-em').id).toBe('chieu-em');
  });

  // Khoá lạ mà lọt xuống bộ phát là nó đọc undefined rồi ném lỗi giữa chừng.
  it('khoá lạ hoặc thiếu thì lùi về bài mặc định', () => {
    expect(pieceById('khong-co-bai-nay').id).toBe(DEFAULT_PIECE_ID);
    expect(pieceById(undefined).id).toBe(DEFAULT_PIECE_ID);
  });
});

describe('midiToFreq', () => {
  it('La quãng tám 4 là 440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('lên một quãng tám là gấp đôi tần số', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6);
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
    expect(parseAmbient('{"volume":0.3}')).toEqual({
      on: true,
      volume: 0.3,
      piece: DEFAULT_PIECE_ID,
    });
  });

  it('âm lượng ngoài khoảng thì kẹp về 0..1', () => {
    expect(parseAmbient('{"on":true,"volume":9}').volume).toBe(1);
    expect(parseAmbient('{"on":true,"volume":-3}').volume).toBe(0);
    expect(parseAmbient('{"on":true,"volume":"to"}').volume).toBe(AMBIENT_DEFAULT.volume);
  });

  it('nhớ đúng bài đã chọn', () => {
    expect(parseAmbient('{"on":true,"volume":0.5,"piece":"buoc-nhe"}').piece).toBe('buoc-nhe');
  });

  /*
   * Hai ca này cùng một gốc: bản lưu từ trước 11/09/2026 chưa có trường `piece`,
   * và localStorage là thứ người dùng sửa tay được. Cả hai phải ra bài mặc định
   * chứ không được để khoá lạ đi tiếp xuống bộ phát.
   */
  it('bản lưu cũ hoặc khoá lạ đều ra bài mặc định', () => {
    expect(parseAmbient('{"on":true,"volume":0.5}').piece).toBe(DEFAULT_PIECE_ID);
    expect(parseAmbient('{"on":true,"volume":0.5,"piece":"bai-ma"}').piece).toBe(DEFAULT_PIECE_ID);
    expect(parseAmbient('{"on":true,"volume":0.5,"piece":42}').piece).toBe(DEFAULT_PIECE_ID);
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
