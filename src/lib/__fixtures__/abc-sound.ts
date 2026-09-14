import abcjs from 'abcjs';

/*
 * Đo cao độ abcjs THẬT SỰ phát ra từ một chuỗi ABC.
 *
 * Để ở đây cho mọi test đo cùng một cách: thứ gì sinh ra nhạc thì phải có ca so
 * cao độ vang ra với cao độ tự khai (bẫy 25, bẫy 36). Dùng ở `exercise-gen.test.ts`
 * (bài tập tự sinh) và `imported-score.test.ts` (bản nhạc nhập từ file).
 */

/**
 * Đọc VarInt của chuẩn MIDI: mỗi byte mang 7 bit, bit cao là cờ "còn nữa".
 * Trả về [giá trị, vị trí byte kế tiếp].
 */
function docVarInt(b: Uint8Array, i: number): [number, number] {
  let v = 0;
  let p = i;
  for (;;) {
    const c = b[p];
    p += 1;
    v = (v << 7) | (c & 0x7f);
    if (!(c & 0x80)) break;
  }
  return [v, p];
}

/**
 * Rút mọi **cao độ vang ra thật** từ file MIDI mà abcjs tạo từ bản nhạc.
 *
 * Vì sao phải đi đường vòng qua file MIDI: `parseOnly` chỉ cho biết nốt được
 * VIẾT thế nào (bậc diatonic + dấu hoá ghi trên mặt giấy), còn "nốt này vang ra
 * cao độ nào" thì chỉ bộ dựng MIDI của abcjs trả lời — nó là chỗ duy nhất áp
 * luật dấu hoá ăn tới hết ô nhịp, luật hoá biểu và luật khóa nhạc. Lỗi tệ nhất
 * của bộ sinh này là bản nhạc nói một đằng tiếng ra một nẻo (bẫy 25), và chỉ
 * con đường này bắt được nó.
 */
export function caoDoVangRa(abc: string): number[] {
  const [bytes] = abcjs.synth.getMidiFile(abc, { midiOutputType: 'binary' }) as Uint8Array[];
  const out: number[] = [];
  let i = 14;  // bỏ qua khối MThd dài đúng 14 byte
  while (i < bytes.length) {
    const len = (bytes[i + 4] << 24) | (bytes[i + 5] << 16) | (bytes[i + 6] << 8) | bytes[i + 7];
    const het = i + 8 + len;
    let p = i + 8;
    let status = 0;
    while (p < het) {
      [, p] = docVarInt(bytes, p);  // mốc thời gian, không cần
      // Byte < 0x80 nghĩa là dùng lại status trước đó (running status).
      if (bytes[p] >= 0x80) { status = bytes[p]; p += 1; }
      const loai = status & 0xf0;
      if (status === 0xff) {
        p += 1;
        const [l, q] = docVarInt(bytes, p);
        p = q + l;
      } else if (status === 0xf0 || status === 0xf7) {
        const [l, q] = docVarInt(bytes, p);
        p = q + l;
      } else if (loai === 0xc0 || loai === 0xd0) {
        p += 1;
      } else {
        const cao = bytes[p];
        const luc = bytes[p + 1];
        p += 2;
        // Note-on lực 0 là note-off, không tính là một nốt vang ra.
        if (loai === 0x90 && luc > 0) out.push(cao);
      }
    }
    i = het;
  }
  // Giữ nguyên THỨ TỰ vang ra — ca soi "một cách viết một phím" cần nó để gióng
  // từng nốt với từng chữ trên bản nhạc. Ca nào cần so theo tập hợp thì tự sắp.
  return out;
}
