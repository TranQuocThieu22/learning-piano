import { describe, expect, it, vi } from 'vitest';
import { LivePiano, nearestLoaded, playbackRateFor, velocityGain } from './live-piano';

/**
 * Bộ phát tiếng phải kiểm bằng `AudioContext` giả, cùng lối với `ambient-engine.test.ts`:
 * vitest chạy ở node nên không có Web Audio, mà thứ đáng kiểm ở đây lại là **thứ tự lệnh**
 * (nhả phím có tắt tiếng không, đạp pedal có giữ được không) chứ không phải tiếng nghe ra sao.
 */

function fakeParam(value = 1) {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

function fakeContext() {
  const sources: ReturnType<typeof makeSource>[] = [];
  const gains: ReturnType<typeof makeGain>[] = [];

  function makeSource() {
    return {
      buffer: null as AudioBuffer | null,
      playbackRate: fakeParam(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };
  }
  function makeGain() {
    return { gain: fakeParam(), connect: vi.fn(), disconnect: vi.fn() };
  }

  const ctx = {
    currentTime: 0,
    destination: {},
    createBufferSource: () => {
      const source = makeSource();
      sources.push(source);
      return source;
    },
    createGain: () => {
      const gain = makeGain();
      gains.push(gain);
      return gain;
    },
  };

  return { ctx: ctx as unknown as AudioContext, sources, gains };
}

/** Mẫu âm giả — bộ phát chỉ cần một vật để gán vào `source.buffer`. */
const SAMPLE = { duration: 3 } as AudioBuffer;

/** Bộ phát đã nạp sẵn mẫu âm cho các nốt cho trước. */
async function readyPiano(midis: number[], maxVoices?: number) {
  const { ctx, sources, gains } = fakeContext();
  const loadSample = vi.fn(async (midi: number) => (midis.includes(midi) ? SAMPLE : null));
  const piano = new LivePiano(ctx, { loadSample, maxVoices });
  await piano.preload(midis);
  return { piano, ctx, sources, gains, loadSample };
}

describe('bấm phím trên đàn thì điện thoại kêu', () => {
  it('phát đúng mẫu âm của nốt vừa bấm, không phải chỉnh tốc độ từ nốt khác', async () => {
    const { piano, sources } = await readyPiano([60]);

    expect(piano.noteOn(60, 100)).toBe(true);
    expect(sources).toHaveLength(1);
    expect(sources[0].buffer).toBe(SAMPLE);
    expect(sources[0].playbackRate.value).toBe(1);
    expect(sources[0].start).toHaveBeenCalled();
  });

  it('nốt chưa kịp tải thì mượn mẫu âm nốt gần nhất, không im lặng', async () => {
    const { piano, sources } = await readyPiano([60]);

    expect(piano.noteOn(62)).toBe(true);
    expect(sources[0].playbackRate.value).toBeCloseTo(playbackRateFor(62, 60), 5);
  });

  it('chưa có mẫu âm nào đủ gần thì chịu im, chứ không kêu ra một tiếng lạ', async () => {
    const { piano, sources } = await readyPiano([60]);

    expect(piano.noteOn(90)).toBe(false);
    expect(sources).toHaveLength(0);
  });

  it('đánh nhẹ thì nhỏ hơn đánh mạnh', async () => {
    const { piano, gains } = await readyPiano([60, 64]);

    piano.noteOn(60, 30);
    piano.noteOn(64, 120);

    expect(gains[1].gain.value).toBeLessThan(gains[2].gain.value);
  });

  it('tải mẫu âm mỗi nốt đúng một lần, bấm lại không tải lại', async () => {
    const { piano, loadSample } = await readyPiano([60]);
    loadSample.mockClear();

    piano.noteOn(60);
    piano.noteOn(60);

    expect(loadSample).not.toHaveBeenCalled();
  });
});

describe('nhả phím và pedal', () => {
  it('nhả phím thì tiếng tắt dần chứ không cắt phụt', async () => {
    const { piano, gains } = await readyPiano([60]);
    piano.noteOn(60);
    const voice = gains[1];

    piano.noteOff(60);

    expect(voice.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, expect.any(Number));
    // Giữ mức đang kêu trước khi hạ, nếu không nốt đánh nhẹ sẽ to lên lúc nhả phím.
    expect(voice.gain.setValueAtTime).toHaveBeenCalled();
  });

  it('đang đạp pedal thì nhả phím tiếng vẫn còn, nhả pedal mới tắt', async () => {
    const { piano, gains } = await readyPiano([60]);
    piano.setPedal(true);
    piano.noteOn(60);
    const voice = gains[1];

    piano.noteOff(60);
    expect(voice.gain.setTargetAtTime).not.toHaveBeenCalled();

    piano.setPedal(false);
    expect(voice.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, expect.any(Number));
  });

  it('bấm lại đúng phím đang kêu thì dập tiếng cũ trước', async () => {
    const { piano, gains, sources } = await readyPiano([60]);
    piano.noteOn(60);
    const first = gains[1];

    piano.noteOn(60);

    expect(first.gain.setTargetAtTime).toHaveBeenCalled();
    expect(sources).toHaveLength(2);
  });

  it('rời trang thì mọi tiếng đang kêu đều tắt', async () => {
    const { piano, gains } = await readyPiano([60, 64]);
    piano.noteOn(60);
    piano.noteOn(64);

    piano.dispose();

    expect(gains[1].gain.setTargetAtTime).toHaveBeenCalled();
    expect(gains[2].gain.setTargetAtTime).toHaveBeenCalled();
  });

  it('giữ pedal đánh thật nhiều nốt thì dập nốt cũ nhất, không để máy rè', async () => {
    const { piano, gains } = await readyPiano([60, 62, 64], 2);
    piano.setPedal(true);
    piano.noteOn(60);
    piano.noteOn(62);
    const oldest = gains[1];

    piano.noteOn(64);

    expect(oldest.gain.setTargetAtTime).toHaveBeenCalled();
  });
});

describe('phép tính nền', () => {
  it('lực bấm đổi thành âm lượng, mạnh nhất là hết cỡ', () => {
    expect(velocityGain(127)).toBe(1);
    expect(velocityGain(0)).toBe(0);
    expect(velocityGain(64)).toBeLessThan(0.5);
    expect(velocityGain(200)).toBe(1);
  });

  it('mượn mẫu âm cách một quãng tám thì phát nhanh gấp đôi', () => {
    expect(playbackRateFor(72, 60)).toBeCloseTo(2, 5);
    expect(playbackRateFor(48, 60)).toBeCloseTo(0.5, 5);
  });

  it('không mượn mẫu âm xa quá một quãng tám vì nghe ra méo ngay', () => {
    expect(nearestLoaded([60, 64], 62)).toBe(60);
    expect(nearestLoaded([60], 73)).toBeNull();
    expect(nearestLoaded([], 60)).toBeNull();
  });
});
