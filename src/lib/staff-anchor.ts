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
 *
 * **Cái bẫy nằm ở đây:** abcjs cài tuỳ chọn `scale` bằng chính `style.transform`
 * của thẻ SVG. Ghi đè thuộc tính đó là **xoá luôn tỉ lệ của abcjs**, và bản nhạc
 * bị vẽ nhỏ đi đúng bằng ngần ấy lần mà không có lỗi nào báo ra. Nên mọi con số ở
 * đây tính bằng **px đã nhân tỉ lệ**, và chỗ gọi phải ghi lại cả tỉ lệ của abcjs
 * trong cùng một chuỗi `transform`.
 */

export interface StaffBox {
  /** Chiều cao khung, tính bằng px. */
  height: number;
  /** Dòng kẻ trên cùng của khuông đầu tiên luôn nằm ở đây, tính từ mép trên khung. */
  anchor: number;
}

/** Tỉ lệ vẽ của abcjs. Một khuông thì to, khuông đôi phải nhỏ lại cho vừa màn hình. */
export const SINGLE_STAFF_SCALE = 2;
export const GRAND_STAFF_SCALE = 1.25;

/**
 * Khung cho một khuông nhạc.
 *
 * Neo ở 100px và cao 240px, chọn theo số đo thật của abcjs ở tỉ lệ 2: nốt cao
 * nhất trong tầm cho chọn (Si quãng 6) cần 85px dòng kẻ phụ phía trên, nốt trầm
 * nhất (Đô quãng 2) cần 102px phía dưới. Cả hai đều còn dư chỗ, nên **không câu
 * nào phải thu nhỏ** — kích thước chữ nhạc giữ nguyên suốt buổi tập.
 */
export const SINGLE_STAFF_BOX: StaffBox = { height: 240, anchor: 100 };

/**
 * Khung cho khuông đôi — hai khuông nên cao hơn, mà neo lại nông hơn.
 *
 * Đo trên ca chật nhất (hai khuông, hợp âm ba nốt, quãng 2 tới quãng 6): còn thừa
 * khoảng 20px. Hạ xuống nữa là chạm vào chỗ phải thu nhỏ.
 */
export const GRAND_STAFF_BOX: StaffBox = { height: 275, anchor: 72 };

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
