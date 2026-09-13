/**
 * **Thế tay: đặt tay ở đâu, và khi nào phải dời tay đi.**
 *
 * Phần THUẦN — không chạm `window`, không chạm React, nên kiểm thử được hết.
 * Giao diện nằm ở `src/components/HandPositionDrill.tsx`.
 *
 * **Vì sao cần hẳn một file cho chuyện này.** Giáo trình dạy năm nốt Đô–Sol ở
 * Chương 1 và giữ nguyên thế tay đó tới hết Chương 5; Chương 6 mới dạy luồn ngón
 * và vắt ngón. Nhưng giữa hai chỗ đó có một khoảng trống: người học gặp một bản
 * nhạc đi ra ngoài năm nốt và **không biết đặt tay ở đâu cho đúng**. Đó không
 * phải câu hỏi về kỹ thuật ngón, mà là câu hỏi về **đọc trước rồi mới đặt tay** —
 * một việc người chơi lâu năm làm trong một giây và không ai nói ra thành lời.
 *
 * Ba luật dưới đây là toàn bộ nội dung được dạy ở đây, và chúng theo đúng thứ tự
 * mà người chơi thật cân nhắc:
 *
 * 1. **Cả câu có nằm gọn trong một thế tay không?** Nếu có thì không dời tay đi
 *    đâu cả. Người mới hay dời tay theo từng nốt vì không nhìn cả câu trước.
 * 2. **Chỉ lố ra một nốt?** Thì với thêm một ngón, đừng dời cả bàn tay. Dời tay
 *    vì một nốt là mất mốc, và mất mốc thì nốt sau đó cũng sai theo.
 * 3. **Lố nhiều thì phải dời** — và chỗ dời đẹp nhất là **chỗ có dấu lặng hoặc
 *    nốt ngân dài**, vì lúc đó tay rảnh. Không có chỗ nghỉ thì mới phải dùng tới
 *    luồn ngón / vắt ngón của Chương 6.
 *
 * **Vì sao tính bằng phím trắng chứ không bằng nửa cung.** Một thế tay năm ngón
 * là năm phím TRẮNG liền nhau (Đô-Rê-Mi-Pha-Sol), không phải năm nửa cung. Tính
 * bằng nửa cung thì "thế tay Đô" thành Đô tới Mi, sai ngay từ bước đầu.
 */

import { BEATS_PER_BAR, noteAt } from './midi-notes';
import { isBlackPitch, pitchClass } from './pitch';
// Cùng khái niệm với bộ sinh bài tập nên dùng lại đúng kiểu của nó, không đặt
// tên thứ hai cho "tay nào" và cho "một nốt trong câu" — xem quy tắc 5 của
// `.claude/skills/code-standards/SKILL.md`.
import type { ExerciseNote, HandName } from './exercise-gen';

/** Cao độ của bảy phím trắng trong một quãng tám, tính từ Đô. */
const WHITE_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];

/** Số phím trắng trong một thế tay. Năm ngón, năm phím. */
export const KEYS_PER_POSITION = 5;

export class HandPositionError extends Error {}

/**
 * Số thứ tự phím trắng tính từ đầu bàn phím, hoặc `-1` nếu đó là phím đen.
 *
 * Đây là thứ khiến mọi phép đếm phía dưới viết được thành một phép trừ: hai phím
 * trắng cách nhau mấy phím là hiệu của hai số này, không phải hiệu số MIDI.
 */
export function whiteIndex(midi: number): number {
  const i = WHITE_PITCH_CLASSES.indexOf(pitchClass(midi));
  if (i < 0) return -1;
  return Math.floor(midi / 12) * 7 + i;
}

/** Ngược của `whiteIndex`. */
export function midiOfWhiteIndex(index: number): number {
  const octave = Math.floor(index / 7);
  const i = ((index % 7) + 7) % 7;
  return octave * 12 + WHITE_PITCH_CLASSES[i];
}

/**
 * Một thế tay năm ngón, nhận diện bằng phím trắng thấp nhất nó phủ.
 *
 * Chỉ cần `anchor`, mọi thứ còn lại suy ra được — nên không có chỗ nào để hai
 * trường nói ngược nhau.
 */
export interface HandPosition {
  /** Phím trắng thấp nhất, tính bằng số MIDI. */
  anchor: number;
}

/** Phím trắng cao nhất của thế tay. */
export function topOf(pos: HandPosition): number {
  return midiOfWhiteIndex(whiteIndex(pos.anchor) + KEYS_PER_POSITION - 1);
}

/** Năm phím trắng của thế tay, thấp lên cao. */
export function keysOf(pos: HandPosition): number[] {
  const base = whiteIndex(pos.anchor);
  return Array.from({ length: KEYS_PER_POSITION }, (_, i) => midiOfWhiteIndex(base + i));
}

/**
 * Tên hiển thị: *Thế tay Đô (Đô–Sol)*.
 *
 * Gọi theo tên nốt thấp nhất kể cả với tay trái, dù ở tay trái nốt đó là ngón 5
 * chứ không phải ngón cái: người học nhìn bàn phím từ trái sang phải, nên mốc dễ
 * nhớ nhất vẫn là phím nằm ngoài cùng bên trái của thế tay.
 */
export function positionName(pos: HandPosition): string {
  return `Thế tay ${noteAt(pos.anchor).name} (${noteAt(pos.anchor).name}–${noteAt(topOf(pos)).name})`;
}

/** Tên ngắn để in lên nút bấm. */
export function positionShortName(pos: HandPosition): string {
  return noteAt(pos.anchor).name;
}

/**
 * Thế tay này với tới nốt đó không?
 *
 * **Phím đen nằm giữa hai phím trắng của thế tay thì tính là với tới.** Chương 4
 * dạy Pha thăng ngay trong thế tay Đô — ngón 4 nhích lên phím đen rồi về chỗ cũ,
 * cả bàn tay không đi đâu. Bỏ luật này thì mọi bài Chương 4 đều bị chấm là "phải
 * chuyển tay", mà đó là lời khuyên sai.
 */
export function covers(pos: HandPosition, midi: number): boolean {
  if (isBlackPitch(midi)) return midi > pos.anchor && midi < topOf(pos);
  const w = whiteIndex(midi);
  const base = whiteIndex(pos.anchor);
  return w >= base && w < base + KEYS_PER_POSITION;
}

/**
 * Ngón nào bấm nốt này, `null` nếu thế tay không với tới.
 *
 * Tay phải đánh số 1 từ nốt thấp lên, tay trái ngược lại — ngón cái của tay trái
 * nằm ở nốt CAO nhất. Đây là chỗ người mới hay dựng ngược, và cũng là lý do hàm
 * này bắt phải truyền tay nào chứ không có giá trị mặc định.
 */
export function fingerFor(pos: HandPosition, midi: number, hand: HandName): number | null {
  if (!covers(pos, midi)) return null;
  // Phím đen mượn ngón của phím trắng ngay dưới nó: đó đúng là cách bấm Pha thăng
  // trong thế tay Đô — ngón 4 nhích lên, không đổi ngón.
  const white = isBlackPitch(midi) ? midi - 1 : midi;
  const step = whiteIndex(white) - whiteIndex(pos.anchor);
  return hand === 'right' ? step + 1 : KEYS_PER_POSITION - step;
}

/** Mọi thế tay phủ trọn danh sách nốt này, thấp tới cao. */
export function positionsCovering(midis: number[]): HandPosition[] {
  if (midis.length === 0) return [];
  const low = Math.min(...midis);
  const high = Math.max(...midis);
  const ket: HandPosition[] = [];
  // Chỉ cần dò quanh vùng nốt đang có: thế tay nào phủ được thì phím trắng thấp
  // nhất của nó không thể nằm xa hơn năm phím so với nốt thấp nhất của câu.
  const from = whiteIndex(low) - KEYS_PER_POSITION;
  const to = whiteIndex(high) + KEYS_PER_POSITION;
  for (let w = from; w <= to; w++) {
    const pos = { anchor: midiOfWhiteIndex(w) };
    if (midis.every((m) => covers(pos, m))) ket.push(pos);
  }
  return ket;
}

export type MoveKind = 'mo-rong' | 'nhay-tay' | 'luon-ngon' | 'vat-ngon';

export interface MoveKindInfo {
  id: MoveKind;
  label: string;
  /** Làm thế nào, viết cho người học đọc lúc đang ngồi ở đàn. */
  how: string;
}

/**
 * Bốn cách xử lý một nốt nằm ngoài thế tay, xếp từ rẻ tới đắt.
 *
 * Thêm cách mới thì thêm một dòng ở đây, đừng thêm một nhánh `if` ở chỗ phân
 * loại — quy tắc 3 của quy ước viết mã.
 */
export const MOVE_KINDS: MoveKindInfo[] = [
  {
    id: 'mo-rong',
    label: 'Với thêm một ngón',
    how: 'Giữ nguyên cả bàn tay, chỉ duỗi một ngón ra lấy nốt đó rồi thu về ngay. Đừng nhấc tay đi — mất mốc là hỏng cả câu sau.',
  },
  {
    id: 'nhay-tay',
    label: 'Nhấc tay sang thế mới',
    how: 'Nhấc cả bàn tay sang, đặt xuống thế mới rồi chơi tiếp. Đây là cách dễ nhất — nên trước khi nghĩ tới luồn ngón, hãy tìm xem có dấu lặng hay nốt ngân dài nào để tay kịp rảnh không.',
  },
  {
    id: 'luon-ngon',
    label: 'Luồn ngón cái xuống dưới',
    how: 'Không có chỗ nghỉ nên tay phải đi liền mạch: ngón cái chui xuống dưới lòng bàn tay và đáp vào nốt tiếp theo, cả bàn tay trượt theo. Kỹ thuật này học ở Chương 6.',
  },
  {
    id: 'vat-ngon',
    label: 'Vắt ngón 3 qua trên',
    how: 'Ngón 3 vắt qua bên trên ngón cái rồi đáp xuống, cả bàn tay theo sau. Dễ hơn luồn ngón vì đi bên trên thì rộng chỗ. Cũng học ở Chương 6.',
  },
];

export function moveKindInfo(id: MoveKind): MoveKindInfo {
  const info = MOVE_KINDS.find((k) => k.id === id);
  if (!info) throw new HandPositionError(`Không có kiểu chuyển tay "${id}"`);
  return info;
}

/** Một đoạn của câu nhạc chơi trọn trong một thế tay. */
export interface PlanSegment {
  /** Chỉ số nốt đầu và nốt cuối trong danh sách gốc, tính cả dấu lặng. */
  from: number;
  to: number;
  position: HandPosition;
  /** Nốt phải với thêm ngón mới tới, tính bằng số MIDI. Rỗng là không phải với. */
  stretched: number[];
}

/** Kiểu chỗ nghỉ ngay trước lúc dời tay. `null` là không có chỗ nghỉ nào. */
export type GapKind = 'lang' | 'ngan-dai' | null;

export interface HandMove {
  /** Chỉ số nốt ĐẦU TIÊN của thế tay mới. */
  atIndex: number;
  kind: MoveKind;
  from: HandPosition;
  to: HandPosition;
  /**
   * Chỗ nghỉ ngay trước lúc dời tay, nếu có.
   *
   * Giao diện phải hỏi trường này trước khi viết "dời ở chỗ nghỉ": một lời khuyên
   * đúng kỹ thuật mà mô tả sai bản nhạc trước mắt thì người học mất lòng tin vào
   * cả công cụ, và họ đúng.
   */
  gap: GapKind;
}

export interface HandPlan {
  segments: PlanSegment[];
  moves: HandMove[];
  /** Ngón bấm cho từng nốt trong danh sách gốc; `null` ở dấu lặng. */
  fingers: (number | null)[];
}

/** Nốt ngân từ chừng này phách trở lên thì coi như tay có chỗ nghỉ để dời đi. */
const PHACH_DU_DE_NHAC_TAY = 2;

/**
 * Chọn thế tay cho đoạn bắt đầu từ `start`, và nó chạy được tới đâu.
 *
 * Ưu tiên theo đúng thứ tự của ba luật ở đầu file: phủ được nhiều nốt nhất
 * trước, rồi mới tới chuyện thế nào cho đỡ phải dời tay. Hoà nhau thì lấy thế
 * tay thấp hơn, để cùng một câu luôn ra cùng một đáp án trên mọi máy.
 */
function chonTheTay(
  midis: number[],
  start: number,
  hand: HandName,
): { pos: HandPosition; den: number } {
  const ungVien = positionsCovering([midis[start]]).map((pos) => {
    let den = start;
    while (den + 1 < midis.length && covers(pos, midis[den + 1])) den++;
    return { pos, den };
  });

  if (ungVien.length === 0) {
    throw new HandPositionError(`Không thế tay nào với tới nốt ${midis[start]}`);
  }

  const xaNhat = Math.max(...ungVien.map((x) => x.den));
  const hoaNhau = ungVien.filter((x) => x.den === xaNhat);

  /*
   * **Hoà nhau thì đặt ngón cái vào nốt tự nhiên của đoạn**, đừng lấy thế tay
   * thấp nhất cho xong.
   *
   * Bản đầu phá hoà bằng "anchor nhỏ hơn thì thắng" và ra lời khuyên lạ: đoạn
   * Sol–Si–Đô được xếp vào thế tay Pha, thành ngón 2-4-5, trong khi ai cũng đặt
   * ngón cái lên chính nốt Sol. Hai thế tay đều PHỦ được đoạn đó, nên phép đếm
   * không phân biệt nổi — thứ phân biệt được là bàn tay đặt xuống thế nào.
   *
   * Tay phải tính từ nốt thấp nhất vì ngón cái nằm ở đó; tay trái tính từ nốt
   * CAO nhất, vì ngón cái tay trái nằm ở đầu kia. Hai vế này là cùng một luật
   * nhìn từ hai phía, không phải hai luật.
   */
  const doan = midis.slice(start, xaNhat + 1);
  const vuaTay = theTayVuaTay(doan, hand);
  return hoaNhau.find((x) => x.pos.anchor === vuaTay.anchor) ?? hoaNhau[0];
}

/**
 * Trong những thế tay phủ được đúng nhóm nốt này, cái nào **vừa tay nhất**.
 *
 * Tay phải đặt ngón cái vào nốt thấp nhất của đoạn; tay trái đặt ngón cái vào
 * nốt CAO nhất, vì ngón cái tay trái nằm ở đầu kia. Hai vế là một luật nhìn từ
 * hai phía.
 *
 * Phải chọn lại sau khi đã biết đoạn dừng ở đâu, không chọn một lần lúc còn đang
 * dò: thế tay đi xa nhất chưa chắc là thế tay vừa với đoạn cuối cùng được cắt
 * ra. Bản đầu chọn một lần và xếp đoạn Sol–La–Si–Đô vào thế tay Pha — phủ thì
 * đúng, nhưng nốt Pha không hề được đánh, và người học nhận một bảng số ngón
 * 2-3-4-5 ở chỗ lẽ ra là 1-2-3-4.
 */
function theTayVuaTay(doan: number[], hand: HandName): HandPosition {
  const phu = positionsCovering(doan);
  if (phu.length === 0) throw new HandPositionError('Không thế tay nào phủ được đoạn này');

  const trang = doan.filter((m) => !isBlackPitch(m));
  const moc = whiteIndex(trang.length > 0
    ? (hand === 'right' ? Math.min(...trang) : Math.max(...trang))
    : doan[0]);

  return phu.reduce((a, b) => {
    const diem = (pos: HandPosition) => Math.abs(
      whiteIndex(hand === 'right' ? pos.anchor : topOf(pos)) - moc,
    );
    return diem(b) < diem(a) ? b : a;
  });
}

/**
 * Đoạn này có thể kéo dài tới hết câu nếu chấp nhận với thêm một ngón không?
 *
 * Đây là luật 2, và nó cố ý CHẶT: chỉ nhận khi nhờ vậy mà **khỏi phải dời tay
 * lần nào nữa**, và chỉ với đúng một nốt (một cao độ, nhắc lại bao nhiêu lần
 * cũng được). Nới rộng hơn thì hàm này bắt đầu khuyên người ta duỗi tay ra khắp
 * nơi, mà duỗi tay liên tục là đúng thứ làm hỏng form tay của người mới.
 */
function thuVoiThemNgon(
  midis: number[],
  start: number,
  pos: HandPosition,
): { pos: HandPosition; stretched: number[] } | null {
  const conLai = midis.slice(start);
  const ngoai = [...new Set(conLai.filter((m) => !covers(pos, m)))];
  if (ngoai.length !== 1) return null;

  const m = ngoai[0];
  const cach = isBlackPitch(m)
    ? Math.min(Math.abs(m - pos.anchor), Math.abs(m - topOf(pos)))
    : Math.min(
      Math.abs(whiteIndex(m) - whiteIndex(pos.anchor)),
      Math.abs(whiteIndex(m) - whiteIndex(topOf(pos))),
    ) * 2;
  // Lố đúng một phím trắng (hoặc một phím đen ngay sát) thì với được; xa hơn thì
  // phải dời tay thật, đừng khuyên người ta duỗi.
  if (cach > 2) return null;

  return { pos, stretched: [m] };
}

/**
 * Chỗ này có chỗ nghỉ cho tay dời đi không, và là kiểu nghỉ nào.
 *
 * Trả về KIỂU chứ không trả về đúng/sai: giao diện phải nói được "ngay sau dấu
 * lặng" hay "trong lúc nốt còn ngân". Một câu chung chung kiểu "sau dấu lặng
 * hoặc nốt ngân dài" bắt người học tự dò lại bản nhạc xem là cái nào — đúng
 * việc mà công cụ này sinh ra để làm hộ.
 */
function coChoNghi(notes: ExerciseNote[], truoc: number, sau: number): GapKind {
  if (notes.slice(truoc + 1, sau).some((n) => n.midi === null)) return 'lang';
  return notes[truoc].beats >= PHACH_DU_DE_NHAC_TAY ? 'ngan-dai' : null;
}

/**
 * Dời tay kiểu gì: phân loại bằng BẢNG, không bằng chuỗi `if` lồng nhau.
 *
 * Tay trái xếp ngược tay phải nên hai tay đổi vai hai kỹ thuật: tay phải đi lên
 * thì luồn ngón cái, tay trái đi lên thì vắt ngón — đúng như Chương 6 bài 3 đã
 * dạy, và đây là chỗ người học hay nhớ nhầm nhất.
 */
function phanLoaiDoiTay(params: {
  coChoNghi: GapKind;
  len: boolean;
  hand: HandName;
  buocNhay: number;
}): MoveKind {
  const { coChoNghi: ranh, len, hand, buocNhay } = params;
  // Dời xa quá thì luồn hay vắt đều không với nổi, chỉ còn cách nhấc tay —
  // kể cả khi không có chỗ nghỉ, và lúc đó đó là chỗ khó thật của câu.
  if (ranh !== null || buocNhay >= 3) return 'nhay-tay';
  const luon = hand === 'right' ? len : !len;
  return luon ? 'luon-ngon' : 'vat-ngon';
}

/**
 * Lên kế hoạch đặt tay cho cả câu.
 *
 * Trả về cả `fingers` cho từng nốt chứ không bắt phía gọi tự suy: số ngón là thứ
 * người học nhìn nhiều nhất, mà suy lại ở giao diện thì có hai chỗ cùng biết một
 * luật và chúng sẽ lệch nhau vào một ngày nào đó.
 */
export function planHandMoves(notes: ExerciseNote[], hand: HandName): HandPlan {
  const chiSoNot = notes.map((n, i) => (n.midi === null ? -1 : i)).filter((i) => i >= 0);
  const midis = chiSoNot.map((i) => notes[i].midi as number);

  const segments: PlanSegment[] = [];
  const moves: HandMove[] = [];
  const fingers: (number | null)[] = notes.map(() => null);

  let i = 0;
  while (i < midis.length) {
    const { pos, den } = chonTheTay(midis, i, hand);
    /*
     * **Dời tay ở chỗ nghỉ, kể cả khi thế tay cũ còn với được thêm vài nốt.**
     *
     * Đây là luật 3 ở đầu file, và nếu thiếu nó thì thuật toán ra một lời khuyên
     * đúng kỹ thuật mà sai chỗ: có câu chia làm hai nửa ngăn nhau bằng dấu lặng,
     * mà nốt đầu nửa sau tình cờ vẫn nằm trong thế tay cũ — tham lam kéo dài thì
     * điểm dời tay rơi vào GIỮA nửa sau, đúng chỗ không còn chỗ nghỉ nào. Người
     * học đọc lời khuyên ấy sẽ không hiểu vì sao phải nhấc tay ngay giữa câu.
     *
     * Lấy chỗ nghỉ SỚM NHẤT mà thế tay mới vẫn đi được xa bằng cách tham lam:
     * sớm nhất thì tay được rảnh lâu nhất, mà "đi xa bằng" thì không phải trả
     * giá bằng một lần dời tay thừa.
     */
    let catTaiChoNghi: number | null = null;
    if (den + 1 < midis.length) {
      for (let g = i + 1; g <= den + 1; g++) {
        if (coChoNghi(notes, chiSoNot[g - 1], chiSoNot[g]) === null) continue;
        const sauChoNghi = chonTheTay(midis, g, hand);
        // Cùng một thế tay thì có cắt cũng chẳng dời đi đâu — cắt chỗ đó chỉ sinh ra
        // một "lần dời tay" từ thế Pha sang chính thế Pha, và một đoạn cụt một nốt.
        if (sauChoNghi.pos.anchor === pos.anchor) continue;
        if (sauChoNghi.den >= den) {
          catTaiChoNghi = g;
          break;
        }
      }
    }
    /*
     * Thử với thêm ngón TRƯỚC khi chốt đoạn: nếu nhờ vậy mà cả câu còn lại nằm
     * gọn trong một thế tay thì lời khuyên đúng là "với thêm một ngón", chứ
     * không phải "dời tay". Xem luật 2 ở đầu file.
     */
    const voi = den + 1 < midis.length && catTaiChoNghi === null
      ? thuVoiThemNgon(midis, i, pos)
      : null;
    const cuoi = voi ? midis.length - 1 : (catTaiChoNghi !== null ? catTaiChoNghi - 1 : den);
    const theTay = voi ? voi.pos : theTayVuaTay(midis.slice(i, cuoi + 1), hand);

    segments.push({
      from: chiSoNot[i],
      to: chiSoNot[cuoi],
      position: theTay,
      stretched: voi ? voi.stretched : [],
    });

    for (let k = i; k <= cuoi; k++) {
      const ngon = fingerFor(theTay, midis[k], hand);
      /*
       * Nốt phải với thêm ngón thì dùng ngón ngoài cùng về phía nó — ngón 5 của
       * tay phải khi với lên, ngón 1 khi với xuống. `fingerFor` trả `null` cho
       * chính nốt đó vì thế tay không phủ tới, nên phải điền tay ở đây.
       */
      fingers[chiSoNot[k]] = ngon ?? (midis[k] > topOf(theTay)
        ? (hand === 'right' ? KEYS_PER_POSITION : 1)
        : (hand === 'right' ? 1 : KEYS_PER_POSITION));
    }

    if (cuoi + 1 < midis.length) {
      const sau = chonTheTay(midis, cuoi + 1, hand).pos;
      const buocNhay = Math.abs(whiteIndex(sau.anchor) - whiteIndex(theTay.anchor));
      const ranh = coChoNghi(notes, chiSoNot[cuoi], chiSoNot[cuoi + 1]);
      moves.push({
        atIndex: chiSoNot[cuoi + 1],
        kind: phanLoaiDoiTay({ coChoNghi: ranh, len: sau.anchor > theTay.anchor, hand, buocNhay }),
        from: theTay,
        to: sau,
        gap: ranh,
      });
    }
    i = cuoi + 1;
  }

  return { segments, moves, fingers };
}

/**
 * Số thứ tự ô nhịp (đếm từ 1) của từng nốt trong câu.
 *
 * Ở đây chứ không ở giao diện: đây là phép tính thuần, mà quy tắc lint của repo
 * còn cấm hẳn biến chạy tích luỹ trong lúc vẽ — ép đúng vào chỗ nó thuộc về.
 */
export function barNumbers(notes: ExerciseNote[]): number[] {
  let truoc = 0;
  return notes.map((n) => {
    const oNhip = Math.floor(truoc / BEATS_PER_BAR) + 1;
    truoc += n.beats;
    return oNhip;
  });
}

/**
 * Một câu để luyện. Thêm câu mới là thêm một dòng vào `POSITION_DRILLS`.
 *
 * Cố ý soạn tay chứ không sinh ngẫu nhiên: mỗi câu ở đây tồn tại để dạy **đúng
 * một tình huống đặt tay**, mà điều đó thì bốc ngẫu nhiên không ra được. Bộ sinh
 * bài tập (`exercise-gen.ts`) lo phần khác — ôn ngón, không phải ôn quyết định.
 */
export interface PositionDrill {
  id: string;
  title: string;
  /** Tình huống câu này dạy, hiện sau khi người học đã trả lời. */
  point: string;
  hand: HandName;
  /** Học xong chương này thì câu này có nghĩa. Dùng để xếp thứ tự, không để khoá. */
  afterChapter: number;
  notes: ExerciseNote[];
}

/** Nốt đen. Viết tắt cho bảng bên dưới đọc được. */
const d = (midi: number | null): ExerciseNote => ({ midi, beats: 1 });
/** Nốt trắng — hai phách, và cũng là chỗ tay rảnh để dời đi. */
const t = (midi: number | null): ExerciseNote => ({ midi, beats: 2 });
/** Nốt tròn, kết câu. */
const tron = (midi: number): ExerciseNote => ({ midi, beats: 4 });

const DO4 = 60;
const RE4 = 62;
const MI4 = 64;
const FA4 = 65;
const SOL4 = 67;
const LA4 = 69;
const SI4 = 71;
const DO5 = 72;
const RE5 = 74;
const DO3 = 48;
const MI3 = 52;
const FA3 = 53;
const SOL3 = 55;
const LA3 = 57;
const SI3 = 59;
const DO4_BASS = 60;

export const POSITION_DRILLS: PositionDrill[] = [
  {
    id: 'gon-mot-the',
    title: 'Cả câu nằm gọn trong một thế tay',
    point: 'Nhìn nốt thấp nhất và nốt cao nhất TRƯỚC khi đặt tay. Câu này chỉ đi từ Đô tới Sol, nên đặt tay một lần rồi không phải dời đi đâu nữa.',
    hand: 'right',
    afterChapter: 1,
    notes: [
      d(DO4), d(MI4), d(SOL4), d(MI4),
      d(FA4), d(RE4), d(MI4), d(DO4),
      d(SOL4), d(FA4), d(MI4), d(RE4),
      tron(DO4),
    ],
  },
  {
    id: 'gon-the-sol',
    title: 'Năm nốt quen, nhưng không phải Đô–Sol',
    point: 'Thế tay không phải lúc nào cũng bắt đầu từ Đô. Cả câu này nằm trong Sol–Rê, nên đặt ngón cái lên nốt Sol là xong — vẫn là năm ngón năm phím, chỉ đứng ở chỗ khác.',
    hand: 'right',
    afterChapter: 5,
    notes: [
      d(SOL4), d(SI4), d(RE5), d(SI4),
      t(SOL4), d(LA4), d(SI4),
      d(DO5), d(LA4), d(SOL4), d(LA4),
      tron(SI4),
    ],
  },
  {
    id: 'lo-mot-not',
    title: 'Lố đúng một nốt',
    point: 'Chỉ một nốt nằm ngoài thế tay. Một nốt thì với thêm ngón, đừng nhấc cả bàn tay — nhấc tay vì một nốt là mất mốc, và nốt sau đó sai theo.',
    hand: 'right',
    afterChapter: 3,
    notes: [
      d(DO4), d(MI4), d(SOL4), d(LA4),
      d(SOL4), d(MI4), d(RE4), d(MI4),
      d(FA4), d(SOL4), d(LA4), d(SOL4),
      tron(MI4),
    ],
  },
  {
    id: 'lo-mot-not-cao',
    title: 'Lố một nốt, ở vùng cao',
    point: 'Cùng một luật với câu trước, nhưng thế tay đứng ở chỗ khác — đừng quen tay bấm Đô. Nốt lố ra vẫn chỉ cần một ngón với tới.',
    hand: 'right',
    afterChapter: 5,
    notes: [
      d(FA4), d(LA4), d(DO5), d(RE5),
      d(DO5), d(LA4), d(SOL4), d(LA4),
      d(SI4), d(DO5), d(RE5), d(DO5),
      tron(LA4),
    ],
  },
  {
    id: 'doi-xuong-o-cho-nghi',
    title: 'Dời tay xuống ở chỗ có dấu lặng',
    point: 'Nửa đầu ở vùng cao, nửa sau đi hẳn xuống. Giữa hai nửa có một dấu lặng — đó chính là lúc tay rảnh để nhấc sang. Luôn tìm chỗ nghỉ trước khi nghĩ tới luồn ngón.',
    hand: 'right',
    afterChapter: 5,
    notes: [
      d(SOL4), d(SI4), d(RE5), d(SI4),
      t(SOL4), d(null), d(null),
      d(MI4), d(DO4), d(MI4), d(FA4),
      tron(MI4),
    ],
  },
  {
    id: 'ngan-dai-roi-doi',
    title: 'Dời tay trong lúc nốt còn ngân',
    point: 'Không có dấu lặng, nhưng có một nốt trắng. Nốt ngân dài cũng là chỗ nghỉ: bấm xong thì tay đã rảnh, dời sang thế mới trong lúc tiếng còn vang.',
    hand: 'right',
    afterChapter: 5,
    notes: [
      d(RE4), d(FA4), d(LA4), d(FA4),
      t(MI4), t(SOL4),
      d(SI4), d(DO5), d(SI4), d(SOL4),
      tron(LA4),
    ],
  },
  {
    id: 'tay-trai-doi-the',
    title: 'Tay trái cũng phải dời',
    point: 'Tay trái xếp ngược: ngón cái ở nốt CAO nhất, ngón 5 ở nốt thấp nhất. Đọc số ngón cho kỹ, đừng đọc theo thói quen tay phải.',
    hand: 'left',
    afterChapter: 6,
    notes: [
      d(FA3), d(LA3), d(DO4_BASS), d(LA3),
      d(SOL3), t(FA3), d(null),
      d(DO3), d(MI3), d(SOL3), d(MI3),
      tron(DO3),
    ],
  },
  {
    id: 'hai-lan-doi',
    title: 'Dời tay hai lần',
    point: 'Câu dài thì chia thành từng mảnh, mỗi mảnh một thế tay, rồi mới nối lại. Đừng đọc từng nốt một — đọc theo mảnh mới là cách người chơi lâu năm nhìn bản nhạc.',
    hand: 'right',
    afterChapter: 6,
    notes: [
      d(DO4), d(RE4), d(MI4), d(FA4),
      t(MI4), t(SOL4),
      d(LA4), d(SI4), d(DO5), d(SI4),
      t(LA4), t(FA4),
      d(MI4), d(RE4), d(DO4), d(RE4),
      tron(DO4),
    ],
  },
];

export function drillById(id: string): PositionDrill {
  const drill = POSITION_DRILLS.find((x) => x.id === id);
  if (!drill) throw new HandPositionError(`Không có câu luyện "${id}"`);
  return drill;
}

/**
 * Bốn lựa chọn cho câu hỏi "đặt tay ở đâu", và đáp án luôn nằm trong đó.
 *
 * Ba lựa chọn sai lấy quanh đáp án chứ không bốc ở đâu xa: chọn nhầm thế tay
 * cách đúng một phím là cái nhầm có thật khi đọc vội, còn một thế tay cách ba
 * quãng tám thì nhìn là loại, không dạy được gì.
 */
export function positionChoices(dung: HandPosition, soLuong = 4): HandPosition[] {
  const base = whiteIndex(dung.anchor);
  const quanh = [0, -1, 1, -2, 2, -3, 3].map((d) => base + d);
  return quanh.slice(0, soLuong)
    .sort((a, b) => a - b)
    .map((w) => ({ anchor: midiOfWhiteIndex(w) }));
}

/**
 * Chuỗi ABC của một câu luyện, kèm số ngón viết trên đầu nốt.
 *
 * Dùng `noteAt().abc` — cùng một cửa duy nhất đổi số MIDI ra ký hiệu ABC mà bộ
 * sinh bài tập đang dùng, nên không có hai chỗ cùng biết cách viết nốt.
 *
 * Số ngón viết bằng chú thích `"^1"` chứ không bằng ký hiệu ngón `!1!` của abcjs:
 * ký hiệu ngón vẽ chữ rất bé và nằm sát đầu nốt, đọc không ra từ khoảng cách đặt
 * máy trên giá nhạc — mà đó là khoảng cách người học thật sự ngồi.
 */
export function drillAbc(drill: PositionDrill, fingers?: (number | null)[]): string {
  const bars: string[][] = [];
  let bar: string[] = [];
  let beats = 0;

  drill.notes.forEach((note, i) => {
    const dai = note.beats === 1 ? '' : String(note.beats);
    const ngon = fingers?.[i];
    const than = note.midi === null
      ? `z${dai}`
      : `${ngon ? `"^${ngon}"` : ''}${noteAt(note.midi).abc}${dai}`;
    bar.push(than);
    beats += note.beats;
    if (beats >= BEATS_PER_BAR) {
      bars.push(bar);
      bar = [];
      beats = 0;
    }
  });
  if (bar.length > 0) bars.push(bar);

  return [
    'X:1',
    'L:1/4',
    'M:4/4',
    ...(drill.hand === 'left' ? ['V:1 clef=bass'] : []),
    'K:C',
    `${bars.map((b) => b.join(' ')).join(' | ')} |]`,
  ].join('\n');
}
