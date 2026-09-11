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
  const param = () => ({
    value: 0,
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
}

/** Bối cảnh âm thanh giả; `resume()` chỉ xong khi ta gọi `ket()`. */
function dungBoiCanhGia(): { Ctor: unknown; dieuKhien: FakeCtx } {
  let ketThuc: () => void = () => {};
  let daHenLich = 0;

  class Gia {
    state = 'suspended';
    currentTime = 0;
    destination = fakeNode();
    resume() {
      return new Promise<void>((resolve) => {
        ketThuc = () => {
          this.state = 'running';
          resolve();
        };
      });
    }
    close() {
      return Promise.resolve();
    }
    createGain() {
      return fakeNode();
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
      return fakeNode();
    }
  }

  return {
    Ctor: Gia,
    dieuKhien: { ket: () => ketThuc(), soLanHenLich: () => daHenLich },
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
