import { describe, expect, it } from 'vitest';
import {
  anchorTransform, GRAND_STAFF_BOX, GRAND_STAFF_SCALE, SINGLE_STAFF_BOX, SINGLE_STAFF_SCALE,
  type StaffBox,
} from './staff-anchor';

/** Vị trí dòng kẻ trên cùng sau khi áp phép biến hình — phải luôn bằng chỗ neo. */
const sauKhiDich = (box: StaffBox, topLineY: number, inkTop: number, inkBottom: number) => {
  const t = anchorTransform(box, topLineY, inkTop, inkBottom);
  return { ...t, viTri: topLineY * t.scale + t.translateY };
};

describe('anchorTransform — neo dòng kẻ trên cùng', () => {
  /*
   * Ca quan trọng nhất: dù ảnh cao thấp thế nào, dòng kẻ trên cùng cũng phải rơi
   * đúng chỗ neo. Đây chính là thứ người dùng thấy — khuông nhạc hết nhảy.
   */
  it('mọi ảnh đều đưa được dòng kẻ trên cùng về đúng chỗ neo', () => {
    // Số đo thật, lấy từ abcjs ở tỉ lệ 2: Đô3 khóa Pha, Đô giữa, Đô6, Si7.
    const doThat: [number, number, number][] = [
      [22, 22, 86],
      [51, 24, 138],
      [62, 23, 148],
      [162, 23, 249],
    ];
    for (const [topLine, inkTop, inkBottom] of doThat) {
      const { viTri } = sauKhiDich(SINGLE_STAFF_BOX, topLine, inkTop, inkBottom);
      expect(viTri).toBeCloseTo(SINGLE_STAFF_BOX.anchor);
    }
  });

  it('nốt bình thường thì không thu nhỏ gì cả', () => {
    // Đô giữa khóa Sol: cần 27px phía trên, 87px phía dưới — thừa chỗ.
    expect(anchorTransform(SINGLE_STAFF_BOX, 51, 24, 138).scale).toBe(1);
    // Đô3 khóa Pha: không có gì phía trên.
    expect(anchorTransform(SINGLE_STAFF_BOX, 22, 22, 86).scale).toBe(1);
  });

  /*
   * Hai quãng rìa đàn đã bỏ khỏi danh sách chọn được, nên đường thu nhỏ gần như
   * không bao giờ chạy. Vẫn phải gác nó: nó là thứ giữ cho nốt không bị cắt nếu
   * sau này có ai mở lại mấy quãng đó.
   */
  it('nốt quá cao thì thu nhỏ vừa khung chứ không bị cắt', () => {
    // Si7 khóa Sol: cần 139px dòng kẻ phụ phía trên, mà chỗ neo chỉ có 100px.
    const t = anchorTransform(SINGLE_STAFF_BOX, 162, 23, 249);
    expect(t.scale).toBeLessThan(1);
    expect((162 - 23) * t.scale).toBeLessThanOrEqual(SINGLE_STAFF_BOX.anchor + 0.001);
  });

  it('nốt quá trầm cũng thu nhỏ, tính theo phía dưới', () => {
    // Đô1 khóa Pha: dòng kẻ phụ kéo xuống 156px, chỗ dưới neo chỉ có 140px.
    const t = anchorTransform(SINGLE_STAFF_BOX, 22, 22, 178);
    expect(t.scale).toBeLessThan(1);
    expect((178 - 22) * t.scale).toBeLessThanOrEqual(SINGLE_STAFF_BOX.height - SINGLE_STAFF_BOX.anchor + 0.001);
  });

  /*
   * **Ca test sinh ra từ một lỗi thật.** abcjs cài tỉ lệ vẽ bằng chính
   * `style.transform` của thẻ SVG, nên bản neo đầu tiên ghi đè lên đó và xoá mất
   * tỉ lệ — bản nhạc bị vẽ nhỏ một nửa mà không lỗi nào báo ra. Số đo đưa vào hàm
   * này vì thế phải là **px đã nhân tỉ lệ**, và chỗ gọi phải nhân lại tỉ lệ ấy vào
   * chuỗi transform.
   */
  it('tầm nốt cho chọn được không câu nào phải thu nhỏ, ở cả hai tỉ lệ', () => {
    // Số đo thật ở tỉ lệ 2, quãng cao nhất và trầm nhất còn chọn được.
    const siQuang6: [number, number, number] = [108, 23, 194];
    const doQuang2: [number, number, number] = [22, 22, 124];
    expect(anchorTransform(SINGLE_STAFF_BOX, ...siQuang6).scale).toBe(1);
    expect(anchorTransform(SINGLE_STAFF_BOX, ...doQuang2).scale).toBe(1);
    // Khuông đôi ở tỉ lệ 1,25: Si quãng 6 trên, Đô quãng 2 dưới.
    expect(anchorTransform(GRAND_STAFF_BOX, 71, 17, 233).scale).toBe(1);
    expect(SINGLE_STAFF_SCALE).toBe(2);
    expect(GRAND_STAFF_SCALE).toBe(1.25);
  });

  it('thu theo phía chật hơn khi cả hai phía đều tràn', () => {
    const t = anchorTransform({ height: 100, anchor: 50 }, 100, 0, 300);
    expect(t.scale).toBeCloseTo(50 / 200);
  });

  it('ảnh không có gì ngoài khuông thì vẫn chạy, không chia cho 0', () => {
    const t = anchorTransform(SINGLE_STAFF_BOX, 40, 40, 40);
    expect(t.scale).toBe(1);
    expect(t.translateY).toBe(SINGLE_STAFF_BOX.anchor - 40);
  });

  it('khuông đôi dùng khung cao hơn và neo nông hơn', () => {
    expect(GRAND_STAFF_BOX.height).toBeGreaterThan(SINGLE_STAFF_BOX.height);
    expect(GRAND_STAFF_BOX.anchor).toBeLessThan(SINGLE_STAFF_BOX.anchor);
    // Số đo thật của khuông đôi ở tỉ lệ 1,25: bình thường, và Si6 + Đô2.
    expect(anchorTransform(GRAND_STAFF_BOX, 35, 18, 173).scale).toBe(1);
    expect(sauKhiDich(GRAND_STAFF_BOX, 71, 17, 233).viTri).toBeCloseTo(GRAND_STAFF_BOX.anchor);
  });
});
