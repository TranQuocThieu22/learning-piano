import { describe, expect, it } from 'vitest';
import {
  canReadLesson,
  canUseDrillPreset,
  chapterOf,
  FREE_DRILL_PRESET_ID,
  FREE_THROUGH_CHAPTER,
  isFreeContent,
  isFreshGrant,
  ACCESS_NOTICE_DAYS,
} from './access';

describe('chapterOf', () => {
  it('đọc được số chương từ slug bài tập và chương lý thuyết', () => {
    expect(chapterOf('chuong-00')).toBe(0);
    expect(chapterOf('chuong-01-bai-02')).toBe(1);
    expect(chapterOf('chuong-07-bai-04')).toBe(7);
  });

  it('trả null với slug không theo mẫu', () => {
    expect(chapterOf('roadmap')).toBeNull();
    expect(chapterOf('khong-lam-piano-ao')).toBeNull();
  });
});

describe('isFreeContent — khoá đặt ở hết Chương 1', () => {
  it('mở Chương 0 và Chương 1', () => {
    expect(isFreeContent('02-chapters', 'chuong-00')).toBe(true);
    expect(isFreeContent('02-chapters', 'chuong-01')).toBe(true);
    expect(isFreeContent('03-exercises', 'chuong-01-bai-01')).toBe(true);
    expect(isFreeContent('03-exercises', 'chuong-01-bai-02')).toBe(true);
  });

  it('khoá từ Chương 2 trở đi', () => {
    expect(isFreeContent('02-chapters', 'chuong-02')).toBe(false);
    expect(isFreeContent('03-exercises', 'chuong-02-bai-01')).toBe(false);
    expect(isFreeContent('03-exercises', 'chuong-07-bai-04')).toBe(false);
  });

  it('không bao giờ khoá Lộ trình và Đọc thêm', () => {
    expect(isFreeContent('01-roadmap', 'roadmap')).toBe(true);
    expect(isFreeContent('07-doc-them', 'khong-lam-piano-ao')).toBe(true);
    expect(isFreeContent('07-doc-them', 'lich-su-piano')).toBe(true);
  });

  it('slug lạ thì MỞ, không khoá — nhầm bên nào ít hại hơn', () => {
    expect(isFreeContent('02-chapters', 'bai-viet-moi')).toBe(true);
  });

  it('khớp với hằng số vị trí khoá đã chốt', () => {
    expect(FREE_THROUGH_CHAPTER).toBe(1);
    expect(isFreeContent('03-exercises', `chuong-0${FREE_THROUGH_CHAPTER}-bai-01`)).toBe(true);
    expect(isFreeContent('03-exercises', `chuong-0${FREE_THROUGH_CHAPTER + 1}-bai-01`)).toBe(false);
  });
});

describe('canReadLesson', () => {
  const paid = { category: '03-exercises', slug: 'chuong-05-bai-01' };
  const free = { category: '03-exercises', slug: 'chuong-01-bai-01' };

  it('chưa mua thì không đọc được bài tính tiền', () => {
    expect(canReadLesson({ ...paid, hasFullAccess: false })).toBe(false);
  });

  it('mua rồi thì đọc được', () => {
    expect(canReadLesson({ ...paid, hasFullAccess: true })).toBe(true);
  });

  it('chưa mua vẫn đọc được bài miễn phí', () => {
    expect(canReadLesson({ ...free, hasFullAccess: false })).toBe(true);
  });

  it('không bao giờ khoá Lộ trình và Đọc thêm dù chưa mua', () => {
    expect(
      canReadLesson({ category: '01-roadmap', slug: 'roadmap', hasFullAccess: false })
    ).toBe(true);
  });
});

describe('canUseDrillPreset', () => {
  it('chưa mua thì chỉ dùng được mức Dễ', () => {
    expect(canUseDrillPreset({ presetId: FREE_DRILL_PRESET_ID, hasFullAccess: false })).toBe(true);
    expect(canUseDrillPreset({ presetId: 'trung-binh', hasFullAccess: false })).toBe(false);
    expect(canUseDrillPreset({ presetId: 'kho', hasFullAccess: false })).toBe(false);
    expect(canUseDrillPreset({ presetId: 'rat-kho', hasFullAccess: false })).toBe(false);
  });

  it('mua rồi thì dùng được mọi mức', () => {
    for (const id of [FREE_DRILL_PRESET_ID, 'trung-binh', 'kho', 'rat-kho']) {
      expect(canUseDrillPreset({ presetId: id, hasFullAccess: true }), id).toBe(true);
    }
  });

  /*
   * Ca quan trọng nhất của cả nhóm này. Bảng *Tuỳ chọn* cho tự chỉnh đủ tám thứ,
   * nên nếu `null` được cho qua thì người chưa mua dựng lại đúng mức Rất khó bằng
   * tay và ba ổ khoá kia thành khoá trang trí.
   */
  it('lựa chọn tự chỉnh (không khớp mức nào) là phần trả phí', () => {
    expect(canUseDrillPreset({ presetId: null, hasFullAccess: false })).toBe(false);
    expect(canUseDrillPreset({ presetId: null, hasFullAccess: true })).toBe(true);
  });

  it('mã mức lạ cũng bị từ chối, không mặc định cho qua', () => {
    expect(canUseDrillPreset({ presetId: 'sieu-de', hasFullAccess: false })).toBe(false);
  });
});

describe('isFreshGrant', () => {
  const now = new Date('2026-09-13T10:00:00Z');
  const ngayTruoc = (n: number) => new Date(now.getTime() - n * 86_400_000);

  it('chưa được cấp gói thì không báo gì', () => {
    expect(isFreshGrant({ grantedAt: null, now })).toBe(false);
  });

  it('vừa được cấp xong thì báo', () => {
    expect(isFreshGrant({ grantedAt: now, now })).toBe(true);
  });

  /*
   * Ca người beta thật: điền form rồi bỏ đó, được cấp quyền lúc không mở máy,
   * hai tuần sau mới quay lại. Lời báo phải còn đó, nếu không thì đúng người
   * cần biết lại là người không được biết.
   */
  it('cấp từ hai tuần trước mà giờ mới mở app thì vẫn báo', () => {
    expect(isFreshGrant({ grantedAt: ngayTruoc(14), now })).toBe(true);
  });

  it('quá hạn thì thôi, vì "vừa được mở" lúc đó là nói sai', () => {
    expect(isFreshGrant({ grantedAt: ngayTruoc(ACCESS_NOTICE_DAYS + 1), now })).toBe(false);
  });

  it('đồng hồ database chạy nhanh hơn máy chủ vài giây vẫn báo', () => {
    expect(isFreshGrant({ grantedAt: new Date(now.getTime() + 5_000), now })).toBe(true);
  });
});
