import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmbientEngine } from './ambient-engine';
import { PIECES } from './ambient';

/**
 * Kiểm đúng MỘT chuyện: lệnh `stop()` gọi trong lúc `start()` còn đang chờ
 * `resume()` phải thắng.
 *
 * Đây là lỗi có thật trên production: người học bấm *Nghe thử* bản nhạc mẫu, một
 * hai giây sau nhạc nền kêu chồng lên. Đường đi của lỗi ghi ở `wantPlaying`
 * trong `ambient-engine.ts`.
 *
 * Vì sao phải dựng một `AudioContext` giả thay vì thử trên trình duyệt: cuộc đua
 * này nằm ở chỗ `resume()` mất bao lâu, mà trên máy thật nó xong gần như tức
 * thì — bấm tay cả trăm lần chưa chắc trúng. Ở đây `resume()` là một lời hứa ta
 * tự cầm, nên tái hiện được đúng thứ tự mỗi lần chạy.
 */

/** Nút âm thanh giả: nhận mọi lệnh, không làm gì, nối được vào nhau. */
function fakeNode() {
  /*
   * `value: 1` chứ không phải 0, vì **Web Audio thật mặc định là 1** — và đúng
   * con số đó là chỗ đã sinh ra lỗi: `stop()` đọc `gain.value` của một nốt chưa
   * chạy automation nào rồi hạ dần từ đó, tức nốt kêu ở mức gần gấp ba đỉnh
   * thật. Bộ giả để 0 thì lỗi ấy không ca test nào nhìn thấy.
   */
  const param = () => ({
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });
  const node = {
    gain: param(),
    frequency: param(),
    detune: param(),
    pan: param(),
    Q: param(),
    threshold: param(),
    knee: param(),
    ratio: param(),
    attack: param(),
    release: param(),
    type: '',
    connect: vi.fn(() => node),
    start: vi.fn(),
    stop: vi.fn(),
  };
  return node;
}

interface FakeCtx {
  ket: () => void;
  soLanHenLich: () => number;
  /** Mọi bộ dao động đã tạo, để soi xem lệnh dừng gửi tới chúng ra sao. */
  boDaoDong: () => ReturnType<typeof fakeNode>[];
  /** Mọi nút âm lượng đã tạo — nơi `stop()` thật sự ghi giá trị vào. */
  nutGain: () => ReturnType<typeof fakeNode>[];
}

/** Bối cảnh âm thanh giả; `resume()` chỉ xong khi ta gọi `ket()`. */
function dungBoiCanhGia(): { Ctor: unknown; dieuKhien: FakeCtx } {
  /*
   * Giữ MỌI lời hứa `resume()` đang chờ, không chỉ cái mới nhất.
   *
   * Bản đầu chỉ nhớ một cái, nên ca "gọi start() hai lần" treo 5 giây rồi trượt
   * vì hết giờ — trông y như đã bắt được lỗi, trong khi thứ hỏng là bộ giả. Máy
   * đo sai kiểu đó nguy hơn không đo: nó báo đỏ đúng lúc mình đang mong nó đỏ.
   */
  const dangCho: (() => void)[] = [];
  let daHenLich = 0;
  const daTao: ReturnType<typeof fakeNode>[] = [];
  const gainDaTao: ReturnType<typeof fakeNode>[] = [];

  class Gia {
    state = 'suspended';
    /**
     * Đồng hồ PHẢI chạy, không được đứng yên ở 0.
     *
     * Bộ phát hẹn trước bốn giây rồi mới ngó lại, nên với đồng hồ đứng yên thì
     * một bộ phát bị bỏ quên hẹn được vài ô nhịp là tự im — và ca test "còn bộ
     * nào hẹn nốt sau khi stop()" báo xanh dù bộ ấy vẫn sống. `vi.useFakeTimers`
     * làm `Date.now()` nhích theo `advanceTimersByTime`, nên bám vào đó là có
     * một đồng hồ chạy đúng nhịp với lịch hẹn.
     */
    get currentTime() {
      return Date.now() / 1000;
    }
    destination = fakeNode();
    resume() {
      return new Promise<void>((resolve) => {
        dangCho.push(() => {
          this.state = 'running';
          resolve();
        });
      });
    }
    close() {
      return Promise.resolve();
    }
    createGain() {
      const node = fakeNode();
      gainDaTao.push(node);
      return node;
    }
    createBiquadFilter() {
      return fakeNode();
    }
    createDynamicsCompressor() {
      return fakeNode();
    }
    createStereoPanner() {
      return fakeNode();
    }
    createOscillator() {
      daHenLich += 1;
      const node = fakeNode();
      daTao.push(node);
      return node;
    }
  }

  return {
    Ctor: Gia,
    dieuKhien: {
      ket: () => {
        // Giải phóng theo bản sao: hàm giải phóng có thể làm sinh thêm lời hứa mới.
        const danh = dangCho.splice(0);
        for (const xong of danh) xong();
      },
      soLanHenLich: () => daHenLich,
      boDaoDong: () => daTao,
      nutGain: () => gainDaTao,
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { window?: unknown }).window;
});

function gan(Ctor: unknown) {
  (globalThis as { window?: unknown }).window = { AudioContext: Ctor };
}

describe('AmbientEngine — đua giữa start và stop', () => {
  /*
   * Ca chính. Không có cờ `wantPlaying` thì `start()` đi tiếp sau khi chờ xong và
   * đặt lịch phát, tức nhạc nền kêu chồng lên bản nhạc mẫu.
   */
  it('stop() trong lúc start() còn chờ thì nhạc KHÔNG được kêu', async () => {
    vi.useFakeTimers();
    const { Ctor, dieuKhien } = dungBoiCanhGia();
    gan(Ctor);

    const engine = new AmbientEngine(0.5, PIECES[0]);
    const dangChay = engine.start();

    // Người học bấm *Nghe thử*: bản nhạc mẫu xin nhạc nền im.
    engine.stop();

    dieuKhien.ket();
    expect(await dangChay).toBe(false);
    expect(engine.running).toBe(false);
    expect(dieuKhien.soLanHenLich()).toBe(0);
  });

  it('không ai chen ngang thì start() vẫn kêu bình thường', async () => {
    vi.useFakeTimers();
    const { Ctor, dieuKhien } = dungBoiCanhGia();
    gan(Ctor);

    const engine = new AmbientEngine(0.5, PIECES[0]);
    const dangChay = engine.start();
    dieuKhien.ket();

    expect(await dangChay).toBe(true);
    expect(engine.running).toBe(true);
    expect(dieuKhien.soLanHenLich()).toBeGreaterThan(0);
  });

  // Nhả giữ chỗ xong thì phải bật lại được, nếu không nghe xong bản nhạc mẫu là
  // nhạc nền im luôn tới hết phiên.
  it('dừng rồi bật lại vẫn kêu', async () => {
    vi.useFakeTimers();
    const { Ctor, dieuKhien } = dungBoiCanhGia();
    gan(Ctor);

    const engine = new AmbientEngine(0.5, PIECES[0]);
    const lan1 = engine.start();
    engine.stop();
    dieuKhien.ket();
    await lan1;

    const lan2 = engine.start();
    dieuKhien.ket();
    expect(await lan2).toBe(true);
    expect(engine.running).toBe(true);
  });

  it('đã dẹp hẳn thì start() câm lặng từ chối', async () => {
    const { Ctor } = dungBoiCanhGia();
    gan(Ctor);

    const engine = new AmbientEngine(0.5, PIECES[0]);
    engine.dispose();
    expect(await engine.start()).toBe(false);
    expect(engine.running).toBe(false);
  });
});

/*
 * Lịch phát hẹn trước tới bốn giây, nên lúc `stop()` chạy thì phần lớn nốt trong
 * danh sách CHƯA kêu tiếng nào. Nhóm này gác đúng chuyện đó.
 *
 * Lỗi đã có thật: `stop()` xoá đường bao của nốt rồi hạ dần từ `gain.value`, mà
 * giá trị đó với nốt chưa chạy automation là **1** — mặc định của Web Audio. Đo
 * bằng `OfflineAudioContext` trên Chromium: nốt lẽ ra đỉnh 0,34 kêu ra 0,98.
 * Người học nghe thấy nhạc nền rú lên một nhịp đúng giây bấm *Nghe thử*.
 */
describe('AmbientEngine — dừng lúc lịch phát còn hẹn trước', () => {
  async function dungBoPhatDangKeu() {
    vi.useFakeTimers();
    const { Ctor, dieuKhien } = dungBoiCanhGia();
    gan(Ctor);
    const engine = new AmbientEngine(0.5, PIECES[0]);
    const chay = engine.start();
    dieuKhien.ket();
    await chay;
    return { engine, dieuKhien };
  }

  it('nốt chưa kịp kêu thì bị dập ngay, không hạ dần', async () => {
    const { engine, dieuKhien } = await dungBoPhatDangKeu();
    engine.stop();

    const tuongLai = dieuKhien
      .boDaoDong()
      .filter((osc) => (osc.start.mock.calls[0]?.[0] ?? 0) > 0);
    expect(tuongLai.length).toBeGreaterThan(0);

    for (const osc of tuongLai) {
      // Hẹn dừng TRƯỚC giờ bắt đầu: theo chuẩn Web Audio thì nốt không cất tiếng.
      const gioDung = osc.stop.mock.calls.at(-1)?.[0];
      const gioBatDau = osc.start.mock.calls[0]?.[0];
      expect(gioDung).toBeLessThanOrEqual(gioBatDau);
    }
  });

  it('không nốt nào bị kéo lên mức mặc định 1 rồi mới hạ', async () => {
    const { engine, dieuKhien } = await dungBoPhatDangKeu();
    engine.stop();

    /*
     * Dấu vân tay của lỗi cũ: `setValueAtTime(1, now)` — hạ dần từ mức mặc định
     * thay vì từ mức nốt đang có. Đỉnh to nhất engine dùng là 0,55 (nốt trầm),
     * nên một lệnh đặt 1 chỉ có thể tới từ `gain.value` chưa ai đặt.
     */
    for (const gain of dieuKhien.nutGain()) {
      for (const goi of gain.gain.setValueAtTime.mock.calls) {
        expect(goi[0]).toBeLessThan(1);
      }
    }
  });
});

/*
 * **Hai lệnh bật chồng nhau sinh ra bộ phát mồ côi.**
 *
 * Người dùng báo: đang phát bản nhạc mẫu mà nhạc nền vẫn chạy, dù sổ giữ chỗ đã
 * ghi đủ và hiệu ứng đã gọi `stop()`. Đường đi:
 *
 * 1. Trình duyệt chặn tiếng, nhạc nền gắn listener chờ cú chạm đầu tiên.
 * 2. Người học chạm vào một đường dẫn. `pointerdown` gọi `start()` lần một, lệnh
 *    này rơi vào `await ctx.resume()`.
 * 3. Cùng cú chạm đó chuyển trang, hiệu ứng chạy lại. `running` vẫn `false` vì
 *    lần một chưa đặt xong lịch, nên nó gọi `start()` lần hai.
 * 4. Cả hai cùng vượt qua chốt `if (this.running)`, cùng đặt `this.timer`. Cái
 *    đặt sau ĐÈ MẤT cái trước — và `stop()` từ đó về sau chỉ tắt được cái sau.
 *
 * Cái bị bỏ quên cứ thế hẹn nốt tiếp, không đường nào tắt, tới hết phiên. Đây là
 * bẫy 18 quay lại từ một cửa khác.
 */
describe('AmbientEngine — hai lệnh bật chồng nhau', () => {
  it('gọi start() hai lần rồi stop() thì phải im hẳn, không còn bộ nào hẹn nốt', async () => {
    vi.useFakeTimers();
    const { Ctor, dieuKhien } = dungBoiCanhGia();
    gan(Ctor);

    const engine = new AmbientEngine(0.5, PIECES[0]);
    const lan1 = engine.start();
    const lan2 = engine.start();
    dieuKhien.ket();
    await lan1;
    await lan2;

    engine.stop();
    const truocKhiCho = dieuKhien.soLanHenLich();
    // Để đồng hồ chạy tiếp: bộ phát nào còn sống sẽ tự lộ ra bằng nốt mới.
    vi.advanceTimersByTime(3000);

    expect(engine.running).toBe(false);
    expect(dieuKhien.soLanHenLich(), 'có bộ phát mồ côi còn hẹn nốt sau khi đã stop()')
      .toBe(truocKhiCho);
  });
});
