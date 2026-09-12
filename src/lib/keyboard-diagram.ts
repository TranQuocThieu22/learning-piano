import { shortNoteName } from './midi-notes';
import { isBlackPitch, octaveOf, pitchClass } from './pitch';
import { BLACK_HEIGHT, BLACK_WIDTH, WHITE_HEIGHT, WHITE_WIDTH } from './piano-keyboard';


/**
 * Hình bàn phím nhỏ để **minh hoạ một thế bấm** trong bài lý thuyết.
 *
 * Vì sao cần: các bài lý thuyết gần như toàn chữ, mà thứ chúng đang tả lại là
 * **hình dạng bàn tay trên phím** — "lấy một nốt, bỏ một phím trắng, lấy nốt
 * tiếp". Người học phải tự dựng hình đó trong đầu từ một câu văn, trong khi vẽ
 * ra thì hiểu ngay trong một giây.
 *
 * Vì sao vẽ bằng mã chứ không chụp ảnh: hình sinh từ số MIDI thì **không thể sai
 * lệch với nội dung** (đổi nốt trong bài là hình đổi theo), không tốn băng thông
 * của người học đang dùng 4G, nét ở mọi cỡ màn hình, và không vướng bản quyền.
 *
 * Khác `OctaveKeyboard` ở chỗ nó vẽ **cả 88 phím** để bôi vùng đang tập; ở đây
 * chỉ vẽ một hai quãng tám cho đủ to mà đọc được trên điện thoại đặt trên giá
 * nhạc. Hình học thì dùng chung `piano-keyboard.ts`, không dựng lại tỉ lệ.
 */

/**
 * Bề rộng tối đa, tính bằng quãng tám. Rộng hơn nữa thì trên điện thoại phím bé
 * như que tăm và tên nốt chồng lên nhau.
 *
 * Vượt quá thì **ném lỗi**, tuyệt đối không cắt bớt cho vừa: cắt là có nốt người
 * soạn đã ghi mà hình không vẽ, và không ai phát hiện ra. Cần rộng hơn thì tách
 * thành hai hình — hai hình nhỏ đọc được vẫn hơn một hình to không đọc nổi.
 */
const MAX_OCTAVE_SPAN = 3;

/**
 * Phím vẽ ngắn hơn phím thật.
 *
 * Tỉ lệ thật (dài 150mm trên rộng 23,5mm) là để hình cây đàn 88 phím trông đúng
 * như cây đàn trước mặt. Ở đây thì ngược lại: một quãng tám dài đúng tỉ lệ chiếm
 * gần nửa màn hình điện thoại cho đúng bảy phím. Rút ngắn lại, **giữ nguyên tỉ lệ
 * đen/trắng** nên cụm hai và cụm ba phím đen vẫn đúng chỗ — đó mới là thứ người
 * học dùng để mò trên đàn thật.
 */
const KEY_LENGTH_FACTOR = 0.55;

/** Đáy phím trắng trên hình — chỗ hàng chữ tên nốt bắt đầu. */
export const DIAGRAM_KEY_BOTTOM = WHITE_HEIGHT * KEY_LENGTH_FACTOR;

const LETTER_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Chỗ chừa dưới phím để ghi tên nốt đang bấm. */
export const DIAGRAM_LABEL_HEIGHT = 1.1;

/**
 * Cỡ chữ tên nốt, tính theo bề rộng một phím trắng.
 *
 * Đặt theo bề rộng PHÍM chứ không theo chiều cao dải chữ: chữ bị cắt là do nó
 * rộng quá phím chứ không phải cao quá dải. Con số này đo trên hình chật nhất —
 * tám phím liền nhau, phím nào cũng có nhãn — chứ không đo trên hình ba nốt.
 */
export const DIAGRAM_LABEL_SIZE = 0.42;


export class KeyboardDiagramError extends Error {}

/**
 * Đọc một dòng tên nốt kiểu `C4 E4 G4` thành số MIDI.
 *
 * Dùng tên quốc tế (C, D, E…) chứ không phải Đô, Rê, Mi: đây là **mã trong file
 * nội dung**, cùng lối với chuỗi ABC ngay bên cạnh nó, nên viết sao cho khớp với
 * thứ người soạn đang gõ ở khối nhạc. Chữ hiện cho người học vẫn là tiếng Việt —
 * `shortNoteName` lo phần đó.
 *
 * Sai thì **ném lỗi kèm đúng chữ sai**, không lặng lẽ bỏ qua: một hình biến mất
 * không dấu vết là thứ người soạn bài không bao giờ phát hiện ra.
 */
export function parseNoteList(line: string): number[] {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) throw new KeyboardDiagramError('chưa có nốt nào');

  return tokens.map((token) => {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(token);
    if (!m) {
      throw new KeyboardDiagramError(`"${token}" không phải tên nốt — phải dạng C4, F#3, Bb4`);
    }
    const [, letter, accidental, octave] = m;
    const alter = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
    const midi = (Number(octave) + 1) * 12 + LETTER_SEMITONE[letter] + alter;
    if (midi < 0 || midi > 127) {
      throw new KeyboardDiagramError(`"${token}" nằm ngoài đàn`);
    }
    return midi;
  });
}

export interface DiagramKey {
  midi: number;
  black: boolean;
  /** Đang được bấm — tô màu và ghi tên. */
  pressed: boolean;
  x: number;
  width: number;
  height: number;
  /** Tâm phím, để đặt tên nốt thẳng hàng bên dưới. */
  centerX: number;
  /** Chữ ghi dưới phím. `null` ở phím không bấm. */
  label: string | null;
}

export interface KeyboardDiagram {
  keys: DiagramKey[];
  width: number;
  height: number;
  /** Nốt thấp nhất và cao nhất được vẽ. */
  range: [number, number];
}

/**
 * Chọn khoảng phím sẽ vẽ: **luôn trọn quãng tám**, từ Đô tới Si.
 *
 * Cắt đúng vừa các nốt đang bấm thì mỗi hình một hình dạng khác nhau, người học
 * mất luôn cái mốc để so. Trọn quãng tám thì cụm hai phím đen và cụm ba phím đen
 * luôn nằm đúng chỗ quen thuộc — mà đó chính là thứ họ dùng để mò trên đàn thật.
 */
export function diagramRange(midis: number[]): [number, number] {
  const low = Math.min(...midis);
  const high = Math.max(...midis);
  const from = (octaveOf(low) + 1) * 12;

  if (high - from >= MAX_OCTAVE_SPAN * 12) {
    throw new KeyboardDiagramError(
      `khoảng nốt rộng quá ${MAX_OCTAVE_SPAN} quãng tám — tách thành nhiều hình cho dễ nhìn`,
    );
  }

  /*
   * Cắt bỏ phần đuôi không ai bấm tới — nhưng không bao giờ ngắn hơn một quãng
   * tám. Thế tay Đô–Đô cao chỉ vượt sang quãng sau đúng một phím; vẽ trọn quãng
   * đó là mười một phím thừa, phím nào cũng bé lại vì phải chia bề ngang.
   */
  return [from, Math.max(high, from + 11)];
}

/**
 * Những tên nốt bị lặp trong cùng một hình — chỉ riêng chúng mới cần số quãng.
 *
 * Gắn số cho mọi nốt thì chữ dài ra, và hình tám phím có tám nhãn là chúng chồng
 * lên nhau (đã thử, đã hỏng). Gắn đúng chỗ có hai phím cùng tên thì vừa đủ để
 * phân biệt mà không làm rối phần còn lại.
 */
function pitchClassesCanSo(midis: number[]): Set<number> {
  const dem = new Map<number, number>();
  for (const midi of midis) {
    const pc = pitchClass(midi);
    dem.set(pc, (dem.get(pc) ?? 0) + 1);
  }
  return new Set([...dem].filter(([, n]) => n > 1).map(([pc]) => pc));
}

function keyLabel(midi: number, canSo: Set<number>): string {
  const ten = shortNoteName(midi);
  return canSo.has(pitchClass(midi)) ? `${ten}${octaveOf(midi)}` : ten;
}

/** Dựng hình: phím nào, ở đâu, phím nào đang bấm. */
export function keyboardDiagram(midis: number[]): KeyboardDiagram {
  const [from, to] = diagramRange(midis);
  const canSo = pitchClassesCanSo(midis);
  const pressed = new Set(midis);
  const keys: DiagramKey[] = [];
  let whiteCount = 0;

  for (let midi = from; midi <= to; midi++) {
    const black = isBlackPitch(midi);
    const isPressed = pressed.has(midi);
    // Cùng luật với `pianoLayout`: phím đen cưỡi lên chỗ giáp ranh giữa hai phím
    // trắng, nên lấy vị trí phím trắng kế tiếp rồi lùi nửa bề rộng phím đen.
    const x = black
      ? whiteCount * WHITE_WIDTH - BLACK_WIDTH / 2
      : whiteCount * WHITE_WIDTH;
    const width = black ? BLACK_WIDTH : WHITE_WIDTH;
    keys.push({
      midi,
      black,
      pressed: isPressed,
      x,
      width,
      height: (black ? BLACK_HEIGHT : WHITE_HEIGHT) * KEY_LENGTH_FACTOR,
      centerX: x + width / 2,
      label: isPressed ? keyLabel(midi, canSo) : null,
    });
    if (!black) whiteCount += 1;
  }

  return {
    keys,
    width: whiteCount * WHITE_WIDTH,
    height: WHITE_HEIGHT * KEY_LENGTH_FACTOR + DIAGRAM_LABEL_HEIGHT,
    range: [from, to],
  };
}

export interface KeysBlock {
  midis: number[];
  /** Một dòng chú thích dưới hình. Không bắt buộc. */
  caption: string | null;
}

/**
 * Đọc nội dung một khối ```keys trong file bài học.
 *
 * Dòng đầu là các nốt, những dòng sau (nếu có) là chú thích. Cố tình không có
 * cú pháp gì thêm: người soạn bài đang viết văn, không phải đang lập trình.
 */
export function parseKeysBlock(text: string): KeysBlock {
  const lines = text.trim().split('\n');
  const midis = parseNoteList(lines[0] ?? '');
  const caption = lines.slice(1).join(' ').trim();
  return { midis, caption: caption.length > 0 ? caption : null };
}
