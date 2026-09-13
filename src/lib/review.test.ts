import { describe, expect, it } from 'vitest';
import { generateExercise } from './exercise-gen';
import {
  nextSeed,
  parseReviewRequest,
  parseSeed,
  reviewChapters,
  reviewHref,
  reviewKinds,
  SEED_MAX,
} from './review';

describe('kho ôn luyện có những chương nào', () => {
  it('mở đúng các chương đã có luật sinh bài', () => {
    expect(reviewChapters()).toEqual([1, 2, 3, 4, 5]);
  });

  it('chương chưa có luật thì không có kiểu bài nào', () => {
    expect(reviewKinds(6)).toEqual([]);
    expect(reviewKinds(0)).toEqual([]);
  });

  it('mỗi chương mở ra đều có ít nhất một kiểu bài để tập', () => {
    for (const chapter of reviewChapters()) {
      expect(reviewKinds(chapter).length).toBeGreaterThan(0);
    }
  });
});

describe('đọc yêu cầu từ đường dẫn', () => {
  it('chương không có bài thì trang báo không tìm thấy', () => {
    expect(parseReviewRequest({ chapter: '6' })).toBeNull();
    expect(parseReviewRequest({ chapter: 'ba' })).toBeNull();
    expect(parseReviewRequest({ chapter: '3.0' })).toBeNull();
  });

  it('thiếu kiểu bài và hạt giống thì vẫn ra một bài tập tập được', () => {
    const req = parseReviewRequest({ chapter: '2' });
    expect(req).not.toBeNull();
    expect(req!.chapter).toBe(2);
    expect(req!.seed).toBe(1);
    expect(reviewKinds(2).some((k) => k.id === req!.kindId)).toBe(true);
  });

  it('kiểu bài lạ thì lấy kiểu đầu tiên của chương chứ không báo lỗi', () => {
    const req = parseReviewRequest({ chapter: '2', kind: 'khong-co-that' });
    expect(req!.kindId).toBe(reviewKinds(2)[0].id);
  });

  it('kiểu bài của chương khác không lọt vào chương này', () => {
    // Kiểu hai tay chỉ có từ Chương 2; Chương 1 xin nó thì vẫn phải ra bài một tay.
    const haiTay = reviewKinds(2).find((k) => k.hands === 'both');
    expect(haiTay).toBeDefined();
    const req = parseReviewRequest({ chapter: '1', kind: haiTay!.id });
    expect(reviewKinds(1).some((k) => k.id === req!.kindId)).toBe(true);
  });

  it('một khoá lặp lại nhiều lần trên đường dẫn thì lấy giá trị đầu', () => {
    const req = parseReviewRequest({ chapter: '3', seed: ['42', '99'] });
    expect(req!.seed).toBe(42);
  });
});

describe('hạt giống', () => {
  it('giá trị hỏng thì về 1 để bài vẫn dựng được', () => {
    expect(parseSeed(null)).toBe(1);
    expect(parseSeed('0')).toBe(1);
    expect(parseSeed('-5')).toBe(1);
    expect(parseSeed('1e3')).toBe(1);
    expect(parseSeed(String(SEED_MAX))).toBe(1);
  });

  it('giữ nguyên giá trị hợp lệ, để tải lại trang không đổi bài', () => {
    expect(parseSeed('7')).toBe(7);
    expect(parseSeed('999999')).toBe(999_999);
  });

  it('bấm *Bài khác* luôn ra một bài khác bài đang xem', () => {
    for (let seed = 1; seed < 3000; seed += 7) {
      const next = nextSeed(seed);
      expect(next).not.toBe(seed);
      expect(next).toBeGreaterThanOrEqual(1);
      expect(next).toBeLessThan(SEED_MAX);
    }
  });

  it('hạt giống mới vẫn dựng được bản nhạc thật', () => {
    const seed = nextSeed(123);
    const bai = generateExercise({ chapter: 3, seed });
    expect(bai.abc).toContain('K: C');
    expect(bai.midis.length).toBeGreaterThan(0);
  });
});

describe('đường dẫn dựng ra', () => {
  it('đọc lại được chính nó', () => {
    const href = reviewHref({ chapter: 4, kindId: reviewKinds(4)[0].id, seed: 55 });
    const [path, query] = href.split('?');
    expect(path).toBe('/review/4');
    const params = new URLSearchParams(query);
    const lai = parseReviewRequest({
      chapter: '4',
      kind: params.get('kind') ?? undefined,
      seed: params.get('seed') ?? undefined,
    });
    expect(lai).toEqual({ chapter: 4, kindId: reviewKinds(4)[0].id, seed: 55 });
  });
});
