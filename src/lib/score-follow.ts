import type { ScoreEvent } from './score-compare';

/**
 * Bám theo người học trên khuông nhạc trong lúc họ đang đánh, để tô xanh nốt
 * vừa đánh đúng.
 *
 * Khác hẳn `compareToScore` ở `score-compare.ts`: chỗ kia so cả bản ghi SAU khi
 * đánh xong; chỗ này chạy ngay từng nốt một. Ràng buộc sản phẩm trong AGENTS.md
 * vẫn được giữ nguyên, và giữ được là nhờ ba điều dưới đây — sửa file này thì
 * đừng phá vỡ điều nào:
 *
 * 1. Bản nhạc **không tự trôi**. Con trỏ chỉ nhích khi người học bấm phím, nên
 *    dừng bao lâu cũng được, không có gì chạy mất.
 * 2. Đánh sai thì nốt đang chờ **nháy đỏ một cái rồi thôi** — báo cho biết chứ
 *    không ghi lại thành vết. Không có tổng số lần sai chạy trên màn hình, và
 *    con trỏ không lùi, không phạt gì cả.
 * 3. Không đụng tới thời gian. Nhanh hay chậm đều không ảnh hưởng gì tới màu.
 */

export interface FollowState {
  /** Sự kiện trên khuông đang chờ người học đánh. */
  cursor: number;
  /** Những nốt của sự kiện đang chờ mà người học đã bấm được — dùng cho hợp âm. */
  collected: number[];
  /** Chỉ số các sự kiện đã đánh đúng trọn vẹn, theo thứ tự đánh. */
  matched: number[];
  /**
   * Số nốt bấm không khớp vào đâu cả.
   *
   * Chỉ dùng để chỗ gọi biết "vừa có một nốt sai" mà cho nháy đỏ. Cố ý KHÔNG
   * đưa con số này lên màn hình trong lúc đang đánh: một cái nháy rồi tắt là
   * báo hiệu, còn một con số cứ tăng dần trước mắt là áp lực (xem AGENTS.md).
   */
  misses: number;
  /**
   * Số lần bấm trượt kể từ lần cuối con trỏ nhích.
   *
   * Đây là thứ mở khoá cho phép nhìn trước: xem `LOOKAHEAD`. Về 0 mỗi khi người
   * học chạm đúng chỗ đang chờ, kể cả khi mới bấm được một nốt của hợp âm —
   * bấm trúng nghĩa là đang đứng đúng chỗ.
   */
  missesAtCursor: number;
}

/**
 * Số sự kiện được phép nhìn trước khi nốt vừa bấm không khớp chỗ đang chờ.
 *
 * Cần có, nếu không thì chỉ một nốt bỏ sót là con trỏ kẹt lại vĩnh viễn và từ
 * đó về sau không còn gì xanh lên nữa — người học sẽ tưởng tính năng hỏng. Để
 * nhỏ thôi: nhìn xa quá thì một nốt đánh nhầm cũng có cơ khớp vu vơ với chỗ nào
 * đó phía trước và kéo con trỏ nhảy lung tung.
 *
 * **Chỉ mở khoá sau khi đã báo sai một lần** (`missesAtCursor > 0`). Trước đây
 * nó chạy ngay từ nốt trượt đầu tiên, và hậu quả là: đang chờ nốt 3, bấm nhầm
 * một nốt trùng cao độ với nốt 4, thế là xanh luôn. Nốt bị bỏ qua thì không
 * xanh, nhưng người học chỉ thấy mỗi việc bấm sai mà vẫn được xanh — đủ để mất
 * lòng tin vào toàn bộ phần tô màu.
 *
 * Nay lần trượt đầu luôn nháy đỏ và con trỏ đứng yên, đúng nghĩa đi tuần tự.
 * Người học bỏ sót thật thì nốt kế tiếp họ bấm sẽ bắt lại được nhịp, nên vẫn
 * không có chuyện kẹt vĩnh viễn — chỉ tốn thêm một cái nháy đỏ.
 */
export const LOOKAHEAD = 2;

export function createFollowState(): FollowState {
  return { cursor: 0, collected: [], matched: [], misses: 0, missesAtCursor: 0 };
}

/** Đã bấm đủ mọi nốt của sự kiện này chưa (hợp âm hai tay thì phải đủ cả). */
function isComplete(event: ScoreEvent, collected: number[]): boolean {
  return event.pitches.every((pitch) => collected.includes(pitch));
}

/**
 * Nhận một nốt vừa bấm, trả về trạng thái mới.
 *
 * Trả về **đúng đối tượng cũ** khi nốt đó không làm gì thay đổi, để chỗ gọi
 * kiểm tra bằng `===` là biết có cần vẽ lại hay không.
 */
export function followNote(
  expected: ScoreEvent[],
  state: FollowState,
  midi: number,
  lookahead: number = LOOKAHEAD,
): FollowState {
  if (state.cursor >= expected.length) return state;

  const current = expected[state.cursor];
  if (current.pitches.includes(midi)) {
    const collected = state.collected.includes(midi)
      ? state.collected
      : [...state.collected, midi];

    // Hợp âm còn thiếu nốt: giữ nguyên con trỏ, chưa xanh vội.
    if (!isComplete(current, collected)) {
      const unchanged = collected === state.collected && state.missesAtCursor === 0;
      return unchanged ? state : { ...state, collected, missesAtCursor: 0 };
    }

    return {
      ...state,
      cursor: state.cursor + 1,
      collected: [],
      matched: [...state.matched, state.cursor],
      missesAtCursor: 0,
    };
  }

  // Không khớp chỗ đang chờ. Lần trượt ĐẦU TIÊN ở chỗ này chỉ nháy đỏ, con trỏ
  // đứng yên — đi tuần tự đúng nghĩa. Chưa dò phía trước vội, vì nốt vừa bấm
  // rất có thể chỉ là bấm nhầm chứ không phải người học đã đi tiếp.
  if (state.missesAtCursor === 0) {
    return { ...state, misses: state.misses + 1, missesAtCursor: 1 };
  }

  // Đã trượt ít nhất một lần ở đây mà vẫn không khớp: nhiều khả năng người học
  // đã bỏ sót nốt và đang đánh phần sau. Lúc này mới nhìn trước để bắt lại nhịp.
  // Những sự kiện bị nhảy qua KHÔNG được tô xanh: chúng đâu có được đánh đúng.
  for (let k = 1; k <= lookahead; k++) {
    const ahead = expected[state.cursor + k];
    if (!ahead || !ahead.pitches.includes(midi)) continue;

    const collected = [midi];
    if (!isComplete(ahead, collected)) {
      return { ...state, cursor: state.cursor + k, collected, missesAtCursor: 0 };
    }
    return {
      ...state,
      cursor: state.cursor + k + 1,
      collected: [],
      matched: [...state.matched, state.cursor + k],
      missesAtCursor: 0,
    };
  }

  // Nốt lạ hoàn toàn. Con trỏ không nhích, không lùi, không mất gì đã xanh —
  // chỉ đếm lên để chỗ gọi cho nốt đang chờ nháy đỏ một cái.
  return { ...state, misses: state.misses + 1, missesAtCursor: state.missesAtCursor + 1 };
}
