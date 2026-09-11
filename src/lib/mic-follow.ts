import type { DetectedNote } from './mic-pitch';
import type { ScoreEvent } from './score-compare';

/**
 * Nối những gì micro nghe được vào hai chỗ dùng nó: bám theo bản nhạc
 * (`score-follow.ts`) và bài luyện nhận nốt.
 *
 * Tách riêng khỏi `score-follow.ts` là có chủ ý: file đó không biết nốt đến từ
 * đâu, và phải giữ như vậy — ba ràng buộc chống áp lực ở đó áp y nguyên cho micro.
 * Ở đây chỉ lo chuyện riêng của micro: nó nghe cả một chùm nốt cùng lúc, có kèm độ
 * chắc chắn, và có những chỗ về lý thuyết không phân biệt được.
 */

/**
 * Nốt lạ (không có trên bản nhạc ở chỗ đang chờ) phải to cỡ này so với nốt mạnh
 * nhất mới được tính là người học đánh sai.
 *
 * Vì sao cần: đánh đúng Mi mà micro nghe thêm một nốt ma nhỏ xíu thì nốt ma đó sẽ
 * làm nốt KẾ TIẾP nháy đỏ oan — người học vừa đánh đúng đã thấy báo sai. Một cái
 * nháy oan tệ hơn nhiều so với một lần sai thật mà máy không bắt được.
 */
export const EXTRA_NOTE_MIN_STRENGTH = 0.6;

/**
 * Chọn và xếp thứ tự những phím sẽ đưa vào `followNote`, từ một lần micro nghe.
 *
 * - Phím khớp chỗ đang chờ đi trước, để một hợp âm đủ nốt xanh lên trước khi xét
 *   tới nốt lạ nào — xếp ngược lại thì nốt lạ đếm là sai ở chỗ đang chờ.
 * - Nốt lạ yếu thì bỏ (xem `EXTRA_NOTE_MIN_STRENGTH`). Không khớp gì cả thì chỉ lấy
 *   nốt mạnh nhất: người học đánh một phím sai, máy báo đúng MỘT lần sai.
 * - **Hai tay cách nhau đúng một quãng tám** (thang âm hai tay ở Chương 6): micro
 *   không tách được nốt cao ra khỏi nốt thấp, vì mọi hoạ âm của nốt cao nằm trọn
 *   trong nốt thấp. Nên nếu chỗ đang chờ có cả hai và micro nghe được một, coi như
 *   đủ cả hai. Cái giá: đánh thiếu một tay ở đúng những chỗ này vẫn được xanh — đã
 *   cân nhắc, và ghi rõ cho người học ở `docs/07-doc-them/`.
 */
export function pitchesForFollow(heard: DetectedNote[], expected: ScoreEvent[], cursor: number): number[] {
  const waiting = new Set(expected[cursor]?.pitches ?? []);
  const matched = heard.filter((n) => waiting.has(n.midi)).map((n) => n.midi);

  for (const p of [...matched]) {
    for (const octave of [p - 12, p + 12]) {
      if (waiting.has(octave) && !matched.includes(octave)) matched.push(octave);
    }
  }

  if (matched.length > 0) {
    const extras = heard
      .filter((n) => !waiting.has(n.midi) && n.strength >= EXTRA_NOTE_MIN_STRENGTH)
      .map((n) => n.midi);
    return [...matched, ...extras];
  }

  /*
   * Không khớp chỗ đang chờ: đưa đúng MỘT nốt — nốt mạnh nhất — để người học
   * đánh một phím sai thì được báo sai một lần, không phải ba.
   *
   * Trước đây chỗ này còn dò xem nốt nghe được có trùng nốt nào ở ngay phía
   * trước không, rồi đưa nốt đó vào để `followNote` bắt nhịp lại. Đã bỏ: bám
   * theo nay đi tuần tự tuyệt đối, người học tự bấm *Bỏ qua nốt này* khi muốn
   * (xem `score-follow.ts`).
   *
   * Và phải chọn nốt mạnh nhất thật, chứ không phải nốt đầu danh sách: micro trả
   * về theo thứ tự dò được, không theo độ mạnh.
   */
  if (heard.length === 0) return [];
  return [heard.reduce((manh, n) => (n.strength > manh.strength ? n : manh)).midi];
}

/**
 * Chọn MỘT phím làm câu trả lời cho bài luyện nhận nốt, từ một lần micro nghe.
 *
 * Nghe thấy đúng nốt đang hỏi thì lấy nó. Không thì ưu tiên nốt cùng tên khác
 * quãng tám — để người học được báo "đúng tên nốt, sai quãng tám" thay vì "sai".
 * Còn lại thì lấy nốt mạnh nhất.
 */
export function answerFromHeard(heard: DetectedNote[], target: number): number | null {
  if (heard.length === 0) return null;
  if (heard.some((n) => n.midi === target)) return target;
  const sameName = heard.find((n) => ((n.midi - target) % 12 + 12) % 12 === 0);
  return sameName ? sameName.midi : heard[0].midi;
}
