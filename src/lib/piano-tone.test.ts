import { describe, expect, it } from 'vitest';
import { voiceChannel } from './piano-tone';

const SR = 44100;

/** Sóng sin một tần số, để đo bộ lọc giữ lại bao nhiêu phần của nó. */
function sine(hz: number, seconds = 0.5): Float32Array {
  const data = new Float32Array(Math.round(SR * seconds));
  for (let i = 0; i < data.length; i++) data[i] = Math.sin((2 * Math.PI * hz * i) / SR);
  return data;
}

/** Mức trung bình của nửa sau — bỏ phần đầu để bộ lọc kịp ổn định. */
function level(data: Float32Array): number {
  const from = Math.floor(data.length / 2);
  let sum = 0;
  for (let i = from; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / (data.length - from));
}

/** Một tiếng gõ rồi im, để đo đuôi vang dài ra bao nhiêu. */
function pluck(seconds = 3): Float32Array {
  const data = new Float32Array(Math.round(SR * seconds));
  for (let i = 0; i < SR * 0.3; i++) {
    data[i] = Math.sin((2 * Math.PI * 440 * i) / SR) * Math.exp(-i / (SR * 0.08));
  }
  return data;
}

/** Giây cuối cùng còn tiếng tới mức nào. */
function tailLevel(data: Float32Array): number {
  return level(data.subarray(data.length - SR));
}

describe('nắn tiếng cho êm', () => {
  it('không nắn gì thì trả lại đúng tiếng gốc, từng mẫu một', () => {
    const goc = sine(440);
    const data = Float32Array.from(goc);
    voiceChannel(data, SR, { soften: 0, reverb: 0 });
    expect([...data]).toEqual([...goc]);
  });

  /*
   * Ca giữ cho bộ lọc không đi quá tay. Bản trước cắt từ 1100Hz, nghe êm thật
   * nhưng Đô6 chỉ còn 52% — mà giai điệu thường nằm ở bè cao nhất, nên tay phải
   * chìm xuống dưới tay trái và bản mẫu hết dạy được gì.
   */
  it('hạ tiếng búa gõ mà giữ nguyên cao độ của nốt', () => {
    // Đô6 (1047Hz) là nốt cao nhất giáo trình dùng; tiếng búa nằm quanh 4-6kHz.
    const not = sine(1047);
    const bass = sine(262);
    const bua = sine(6000);
    for (const song of [not, bass, bua]) voiceChannel(song, SR, { soften: 0.85, reverb: 0 });

    expect(level(bass) / level(sine(262))).toBeGreaterThan(0.9);
    expect(level(not) / level(sine(1047))).toBeGreaterThan(0.7);
    expect(level(bua) / level(sine(6000))).toBeLessThan(0.25);
  });

  it('hạ càng nhiều thì tiếng càng tối, theo đúng thứ tự', () => {
    const muc = [0, 0.3, 0.6, 1].map((soften) => {
      const cao = sine(4000);
      voiceChannel(cao, SR, { soften, reverb: 0 });
      return level(cao);
    });
    for (let i = 1; i < muc.length; i++) {
      expect(muc[i], `mức ${i}`).toBeLessThan(muc[i - 1]);
    }
  });
});

describe('khoét vùng tiếng đanh cho tròn tiếng', () => {
  it('hạ vùng 1,5kHz mà vẫn giữ được giai điệu', () => {
    const giai = sine(1047);   // Đô6, nốt cao nhất giáo trình dùng
    const danh = sine(1500);   // giữa vùng đanh
    const bass = sine(262);
    for (const song of [giai, danh, bass]) voiceChannel(song, SR, { roundness: 0.3, soften: 0, reverb: 0 });

    expect(level(danh) / level(sine(1500))).toBeLessThan(0.7);
    // Ngưỡng 70% là ngưỡng đã chốt: dưới mức này thì giai điệu tay phải chìm
    // xuống dưới bè đệm tay trái.
    expect(level(giai) / level(sine(1047))).toBeGreaterThan(0.7);
    expect(level(bass) / level(sine(262))).toBeGreaterThan(0.95);
  });

  it('khoét khác hẳn hạ phần cao: phần trên 4kHz vẫn còn nguyên', () => {
    // Đây là chỗ "trong trẻo" khác "êm dịu": không đụng tới phần cao nên tiếng
    // tròn mà không tối.
    const cao = sine(6000);
    voiceChannel(cao, SR, { roundness: 1, soften: 0, reverb: 0 });
    expect(level(cao) / level(sine(6000))).toBeGreaterThan(0.85);
  });

  it('không khai roundness thì không khoét gì', () => {
    const goc = sine(1500);
    const data = Float32Array.from(goc);
    voiceChannel(data, SR, { soften: 0, reverb: 0 });
    expect([...data]).toEqual([...goc]);
  });
});

describe('thêm tiếng vang', () => {
  it('nốt còn ngân sau khi tay đã rời phím', () => {
    const kho = pluck();
    const uot = Float32Array.from(kho);
    voiceChannel(uot, SR, { soften: 0, reverb: 0.8 });

    // Bản khô đã tắt hẳn ở giây cuối; bản vang thì vẫn còn tiếng dội.
    expect(tailLevel(kho)).toBeLessThan(1e-6);
    expect(tailLevel(uot)).toBeGreaterThan(tailLevel(kho) * 100);
  });

  it('vang càng nhiều thì đuôi càng dài', () => {
    const duoi = [0.3, 0.6, 1].map((reverb) => {
      const data = pluck();
      voiceChannel(data, SR, { soften: 0, reverb });
      return tailLevel(data);
    });
    expect(duoi[1]).toBeGreaterThan(duoi[0]);
    expect(duoi[2]).toBeGreaterThan(duoi[1]);
  });

  /*
   * Ràng buộc chống áp lực của `AGENTS.md` không đụng tới đây, nhưng ràng buộc
   * DẠY thì có: người mới tập phải nghe ra mình vừa đánh mấy nốt. Tiếng vang mà
   * trộn các nốt vào nhau thì bản mẫu thành một đám mây, không còn dạy được gì.
   */
  it('đuôi vang tắt dần chứ không kêu mãi', () => {
    const data = pluck(6);
    voiceChannel(data, SR, { soften: 0, reverb: 1 });
    const giua = level(data.subarray(SR * 2, SR * 3));
    const cuoi = level(data.subarray(SR * 5, SR * 6));
    expect(cuoi).toBeLessThan(giua * 0.5);
  });

  it('bản nhạc im lặng thì vẫn im, không tự sinh ra tiếng', () => {
    const data = new Float32Array(SR);
    voiceChannel(data, SR, { soften: 1, reverb: 1 });
    expect(Math.max(...data.map(Math.abs))).toBe(0);
  });

  it('tiếng vang hai tai lệch nhau, không dính cứng ở giữa đầu', () => {
    const trai = pluck(1);
    const phai = Float32Array.from(trai);
    voiceChannel(trai, SR, { soften: 0, reverb: 0.8 }, 0);
    voiceChannel(phai, SR, { soften: 0, reverb: 0.8 }, 1);
    const khac = trai.some((v, i) => Math.abs(v - phai[i]) > 1e-6);
    expect(khac).toBe(true);
  });

  it('bản nhạc dài ba phút nắn xong trong khoảng một nhịp thở', () => {
    // Chạy ngay trên luồng giao diện sau khi abcjs dựng xong, nên phải nhanh.
    // Ba phút là bài dài nhất giáo trình này có.
    const data = new Float32Array(SR * 180);
    for (let i = 0; i < data.length; i += 1000) data[i] = 0.5;
    const batDau = Date.now();
    voiceChannel(data, SR, { soften: 0.6, reverb: 0.8 });
    expect(Date.now() - batDau).toBeLessThan(3000);
  });
});
