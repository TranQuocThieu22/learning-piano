/**
 * Giữ khuông nhạc đứng yên một chỗ giữa các câu hỏi.
 *
 * **Triệu chứng người dùng thấy:** mỗi câu một nốt khác nhau thì khuông nhạc nhảy
 * lên nhảy xuống, mắt phải tìm lại năm dòng kẻ trước khi đọc được nốt.
 *
 * **Vì sao:** abcjs vẽ ảnh cao vừa đúng nội dung. Nốt càng xa khuông thì càng
 * nhiều dòng kẻ phụ, ảnh càng cao, mà khung chứa lại canh giữa — nên năm dòng kẻ
 * trôi đi mỗi câu một chỗ. Đo thật ở tỉ lệ đang dùng: ảnh cao từ 186px (Đô3 khóa
 * Pha) tới 512px (Si7 khóa Sol), và dòng kẻ trên cùng nằm ở 22px hay 162px tính
 * từ mép ảnh, tuỳ nốt.
 *
 * **Cách sửa:** khung cao cố định, rồi dịch ảnh sao cho **dòng kẻ trên cùng luôn
 * rơi đúng một vị trí**. Nốt nào vẽ ra cao quá khung thì thu nhỏ vừa đủ — thà chữ
 * bé đi một chút còn hơn cắt mất cái nốt đang hỏi, mà cũng còn hơn để khuông nhảy.
 */

export interface StaffBox {
  /** Chiều cao khung, tính bằng px. */
  height: number;
  /** Dòng kẻ trên cùng của khuông đầu tiên luôn nằm ở đây, tính từ mép trên khung. */
  anchor: number;
}

/**
 * Khung cho một khuông nhạc, tỉ lệ 2.
 *
 * Neo ở 95px: đủ chỗ cho nốt cao tới quãng 7 ở khóa Sol (cần 93px dòng kẻ phụ
 * phía trên). Còn lại 125px phía dưới, đủ cho nốt trầm tới quãng 2 ở khóa Pha.
 */
export const SINGLE_STAFF_BOX: StaffBox = { height: 220, anchor: 95 };

/** Khung cho khuông đôi, tỉ lệ 1,25 — hai khuông nên cần cao hơn, mà neo lại nông hơn. */
export const GRAND_STAFF_BOX: StaffBox = { height: 250, anchor: 62 };

export interface StaffTransform {
  scale: number;
  translateY: number;
}

/**
 * Tính phép biến hình đặt dòng kẻ trên cùng vào đúng chỗ neo.
 *
 * `topLineY`, `inkTop`, `inkBottom` đều tính từ mép trên ảnh SVG, bằng px.
 *
 * Trả về `scale` ≤ 1 và `translateY`. Chỗ gọi đặt `transform-origin` ở mép trên
 * chính giữa rồi ghi `translateY(...) scale(...)` — thu nhỏ trước, dịch sau.
 */
export function anchorTransform(
  box: StaffBox,
  topLineY: number,
  inkTop: number,
  inkBottom: number,
): StaffTransform {
  const canTren = Math.max(0, topLineY - inkTop);
  const canDuoi = Math.max(0, inkBottom - topLineY);
  const choTren = box.anchor;
  const choDuoi = box.height - box.anchor;

  /*
   * Thu nhỏ theo phía chật hơn, và chỉ thu khi thật sự không vừa. Nốt bình
   * thường (hầu hết các câu) không bị đụng tới, nên kích thước chữ nhạc giữ
   * nguyên — chỉ mấy quãng rìa đàn mới nhỏ đi.
   */
  const scale = Math.min(
    1,
    canTren > 0 ? choTren / canTren : 1,
    canDuoi > 0 ? choDuoi / canDuoi : 1,
  );

  return { scale, translateY: box.anchor - topLineY * scale };
}
