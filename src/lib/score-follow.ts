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
 * 4. **Đi từng nốt tuần tự, tuyệt đối không nhảy cóc.** Con trỏ chỉ nhích khi
 *    người học bấm đúng chỗ đang chờ. Bấm nhầm nốt nào — kể cả nốt có thật ở
 *    phía sau — thì chỉ nháy đỏ, con trỏ đứng nguyên.
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
   * Không dùng để tự động làm gì cả — chỉ để giao diện biết người học đang mắc
   * kẹt ở một chỗ mà mời họ bấm *Bỏ qua nốt này*. Về 0 mỗi khi người học chạm
   * đúng chỗ đang chờ, kể cả khi mới bấm được một nốt của hợp âm.
   */
  missesAtCursor: number;
  /**
   * Những sự kiện người học **tự bấm bỏ qua**.
   *
   * Không tô xanh — chúng có được đánh đúng đâu. Giữ lại để chỗ gọi phân biệt
   * được "con trỏ nhích vì đánh đúng" với "con trỏ nhích vì người học cho qua".
   */
  skipped: number[];
}

/**
 * **Cố ý không có cơ chế nhìn trước.** Đừng thêm lại.
 *
 * Đã có một bản nhìn trước hai sự kiện, mở khoá sau lần trượt đầu tiên, và chủ
 * sản phẩm báo lỗi ngay khi dùng thật: *"chưa kịp gõ nốt thứ nhất mà gõ nhầm nốt
 * thứ 3 thì nhảy sang nốt 3 luôn"*. Đúng như thế — bấm nhầm một phím rồi bấm lại
 * chính phím đó (phản xạ tự nhiên khi thấy màn hình không phản ứng) là đủ để con
 * trỏ nhảy qua hai nốt chưa ai đánh.
 *
 * Chỗ sai nằm ở giả định: máy đoán hộ rằng người học "chắc đã bỏ sót nốt và đang
 * đi tiếp". Đoán sai thì người học mất niềm tin vào toàn bộ phần tô màu, mà tô
 * màu là thứ duy nhất tính năng này làm. Thà đứng yên chờ còn hơn đoán.
 *
 * Vấn đề mà nhìn trước từng sinh ra để giải — con trỏ kẹt vĩnh viễn khi micro bỏ
 * sót một nốt — nay giải bằng **nút *Bỏ qua nốt này*** trong `ScorePractice`:
 * người học tự quyết khi nào cho qua, đúng tinh thần của `AGENTS.md`, thay vì để
 * máy quyết hộ.
 */

export function createFollowState(): FollowState {
  return { cursor: 0, collected: [], matched: [], misses: 0, missesAtCursor: 0, skipped: [] };
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
): FollowState {
  if (state.cursor >= expected.length) return state;

  const current = expected[state.cursor];

  // Không khớp chỗ đang chờ: nháy đỏ, hết. Con trỏ đứng yên dù nốt vừa bấm có
  // trùng cao độ với nốt nào phía sau đi nữa — xem khối chú thích ở trên.
  if (!current.pitches.includes(midi)) {
    return { ...state, misses: state.misses + 1, missesAtCursor: state.missesAtCursor + 1 };
  }

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

/**
 * Người học tự cho qua nốt đang chờ.
 *
 * Đây là đường thoát duy nhất khi con trỏ đứng mãi ở một chỗ — micro không nghe
 * được nốt đó, hoặc đàn thiếu phím, hoặc người học chỉ muốn bỏ qua. **Do người
 * học bấm, không phải máy tự quyết.**
 *
 * Sự kiện bị bỏ qua KHÔNG được tô xanh: nó có được đánh đâu. Cũng không tính là
 * đánh sai — bỏ qua là một lựa chọn, không phải một lỗi.
 */
export function skipCurrent(expected: ScoreEvent[], state: FollowState): FollowState {
  if (state.cursor >= expected.length) return state;
  return {
    ...state,
    cursor: state.cursor + 1,
    collected: [],
    skipped: [...state.skipped, state.cursor],
    missesAtCursor: 0,
  };
}
