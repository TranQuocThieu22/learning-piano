/**
 * Dựng file MIDI thật bằng byte, cho test của phần nhập bản nhạc từ ngoài vào.
 *
 * Vì sao dựng byte chứ không để sẵn một file `.mid` trong repo: test phải nói rõ
 * nó đang thử cái gì — "nốt này giữ 470 tick thay vì 480" là câu đọc được, còn
 * một file nhị phân thì vài tháng sau không ai biết bên trong có gì. Dựng bằng
 * hàm cũng cho phép thử những ca hiếm (trạng thái chạy tiếp, file cắt dở) mà đi
 * xin một file mẫu thì không bao giờ có.
 */

/** Số nguyên độ dài thay đổi — cách MIDI ghi mọi khoảng chờ. */
export function varint(n: number): number[] {
  const out = [n & 0x7f];
  let left = n >> 7;
  while (left > 0) {
    out.unshift((left & 0x7f) | 0x80);
    left >>= 7;
  }
  return out;
}

export function chunk(kind: string, body: number[]): number[] {
  const len = body.length;
  return [
    ...[...kind].map((c) => c.charCodeAt(0)),
    (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff,
    ...body,
  ];
}

export const END_OF_TRACK = [0x00, 0xff, 0x2f, 0x00];

/** Một nốt: bấm sau `delay` tick, giữ `dai` tick rồi nhả, ở kênh chỉ số `channel`. */
export function note(midi: number, dai: number, delay = 0, channel = 0): number[] {
  return [
    ...varint(delay), 0x90 | channel, midi, 0x40,
    ...varint(dai), 0x80 | channel, midi, 0x40,
  ];
}

/** Ghép các track thành một file MIDI hoàn chỉnh. */
export function midiFile(tracks: number[][], division = 480): Uint8Array {
  // Thân MThd đúng sáu byte: định dạng, số track, số tick mỗi nốt đen.
  const header = chunk('MThd', [0, 1, 0, tracks.length, (division >> 8) & 0xff, division & 0xff]);
  return new Uint8Array([...header, ...tracks.flatMap((t) => chunk('MTrk', t))]);
}
