/**
 * Hình học của một bàn phím piano 88 phím, để vẽ ra SVG.
 *
 * Tách khỏi component vì đây là phần dễ sai mà nhìn không ra: phím đen không
 * nằm giữa hai phím trắng theo kiểu chia đều, và một quãng tám có 7 phím trắng
 * nhưng 12 phím. Lệch nửa phím thì bàn phím vẫn "trông như bàn phím", chỉ có
 * điều Đô thăng đứng nhầm chỗ — loại lỗi chỉ người biết đàn mới thấy.
 *
 * Mọi con số ở đây tính theo **bề rộng một phím trắng = 1**. Component chỉ việc
 * đặt `viewBox` theo `width`/`height` rồi cho SVG tự co giãn theo bề ngang màn
 * hình, nên bàn phím vừa khít cả trên điện thoại lẫn trên máy tính.
 */

/** La0 — phím thấp nhất của đàn 88 phím. */
export const FIRST_MIDI = 21;
/** Đô8 — phím cao nhất. */
export const LAST_MIDI = 108;

/*
 * Tỉ lệ lấy từ đàn thật (chuẩn phím piano): phím trắng rộng 23,5mm dài 150mm,
 * phím đen rộng 13,7mm dài 95mm. Vẽ đúng tỉ lệ đó thì hình trên màn hình khớp
 * với cây đàn người học đang ngồi trước mặt, nên nhìn hình là ướm được ra đàn.
 */
export const WHITE_WIDTH = 1;
export const WHITE_HEIGHT = 6.4;
export const BLACK_WIDTH = 0.58;
export const BLACK_HEIGHT = 4;
/** Chỗ chừa dưới phím để ghi tên quãng. */
export const LABEL_HEIGHT = 1.6;

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function isBlackPitch(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(((midi % 12) + 12) % 12);
}

export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export interface PianoKey {
  midi: number;
  black: boolean;
  octave: number;
  x: number;
  width: number;
  height: number;
}

/** Một cụm phím chọn được: trọn một quãng tám, từ Đô tới Si. */
export interface OctaveBlock {
  octave: number;
  /** Nốt thấp nhất và cao nhất của cụm (Đô và Si của quãng đó). */
  midis: [number, number];
  x: number;
  width: number;
}

export interface PianoLayout {
  keys: PianoKey[];
  octaves: OctaveBlock[];
  width: number;
  height: number;
}

/**
 * Dựng toàn bộ bàn phím 88 phím.
 *
 * Phím trắng xếp liền nhau; phím đen **cưỡi lên chỗ giáp ranh** giữa phím trắng
 * vừa vẽ và phím trắng kế tiếp, nên lấy vị trí của phím trắng kế tiếp rồi lùi
 * lại nửa bề rộng phím đen. Đó là lý do phải đếm phím trắng chứ không chia đều
 * 12 phím cho một quãng tám.
 *
 * Chỉ những quãng tám **đủ mười hai phím** mới thành cụm chọn được: đàn 88 phím
 * mở đầu bằng La0–Si0 và kết bằng mỗi nốt Đô8, ba phím đó vẫn vẽ ra cho đúng cây
 * đàn thật nhưng không thuộc cụm nào.
 */
export function pianoLayout(): PianoLayout {
  const keys: PianoKey[] = [];
  let whiteCount = 0;

  for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi++) {
    const black = isBlackPitch(midi);
    const octave = octaveOf(midi);
    if (black) {
      keys.push({
        midi,
        black: true,
        octave,
        x: whiteCount * WHITE_WIDTH - BLACK_WIDTH / 2,
        width: BLACK_WIDTH,
        height: BLACK_HEIGHT,
      });
    } else {
      keys.push({
        midi,
        black: false,
        octave,
        x: whiteCount * WHITE_WIDTH,
        width: WHITE_WIDTH,
        height: WHITE_HEIGHT,
      });
      whiteCount += 1;
    }
  }

  const octaves: OctaveBlock[] = [];
  for (let octave = octaveOf(FIRST_MIDI); octave <= octaveOf(LAST_MIDI); octave++) {
    const first = (octave + 1) * 12;
    const last = first + 11;
    if (first < FIRST_MIDI || last > LAST_MIDI) continue;
    const doKey = keys.find((k) => k.midi === first);
    if (!doKey) continue;
    octaves.push({ octave, midis: [first, last], x: doKey.x, width: 7 * WHITE_WIDTH });
  }

  return {
    keys,
    octaves,
    width: whiteCount * WHITE_WIDTH,
    height: WHITE_HEIGHT + LABEL_HEIGHT,
  };
}
