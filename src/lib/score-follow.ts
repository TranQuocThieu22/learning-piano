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
}

/**
 * Số sự kiện được phép nhìn trước khi nốt vừa bấm không khớp chỗ đang chờ.
 *
 * Cần có, nếu không thì chỉ một nốt bỏ sót là con trỏ kẹt lại vĩnh viễn và từ
 * đó về sau không còn gì xanh lên nữa — người học sẽ tưởng tính năng hỏng. Để
 * nhỏ thôi: nhìn xa quá thì một nốt đánh nhầm cũng có cơ khớp vu vơ với chỗ nào
 * đó phía trước và kéo con trỏ nhảy lung tung.
 */
export const LOOKAHEAD = 2;

export function createFollowState(): FollowState {
  return { cursor: 0, collected: [], matched: [], misses: 0 };
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
      return collected === state.collected ? state : { ...state, collected };
    }

    return {
      ...state,
      cursor: state.cursor + 1,
      collected: [],
      matched: [...state.matched, state.cursor],
    };
  }

  // Không khớp chỗ đang chờ. Nhìn trước vài sự kiện — người học có thể đã bỏ
  // sót một nốt, hoặc đánh nhầm rồi đi tiếp. Những sự kiện bị nhảy qua KHÔNG
  // được tô xanh: chúng đâu có được đánh đúng.
  for (let k = 1; k <= lookahead; k++) {
    const ahead = expected[state.cursor + k];
    if (!ahead || !ahead.pitches.includes(midi)) continue;

    const collected = [midi];
    if (!isComplete(ahead, collected)) {
      return { ...state, cursor: state.cursor + k, collected };
    }
    return {
      ...state,
      cursor: state.cursor + k + 1,
      collected: [],
      matched: [...state.matched, state.cursor + k],
    };
  }

  // Nốt lạ hoàn toàn. Con trỏ không nhích, không lùi, không mất gì đã xanh —
  // chỉ đếm lên để chỗ gọi cho nốt đang chờ nháy đỏ một cái.
  return { ...state, misses: state.misses + 1 };
}
