import { describe, expect, it } from 'vitest';
import {
  canReadLesson,
  chapterOf,
  FREE_THROUGH_CHAPTER,
  isFreeContent,
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
