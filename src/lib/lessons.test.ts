import { describe, expect, it } from 'vitest';
import { neighborsOf } from './lessons';

const chuoi = [
  { slug: 'chuong-01-bai-01' },
  { slug: 'chuong-01-bai-02' },
  { slug: 'chuong-02-bai-01' },
];

describe('neighborsOf', () => {
  it('trả về bài kề trước và kề sau', () => {
    expect(neighborsOf(chuoi, 'chuong-01-bai-02')).toEqual({
      prev: { slug: 'chuong-01-bai-01' },
      next: { slug: 'chuong-02-bai-01' },
    });
  });

  it('bài đầu chuỗi thì không có bài trước', () => {
    const { prev, next } = neighborsOf(chuoi, 'chuong-01-bai-01');
    expect(prev).toBeNull();
    expect(next).toEqual({ slug: 'chuong-01-bai-02' });
  });

  it('bài cuối chuỗi thì không có bài sau', () => {
    const { prev, next } = neighborsOf(chuoi, 'chuong-02-bai-01');
    expect(prev).toEqual({ slug: 'chuong-01-bai-02' });
    expect(next).toBeNull();
  });

  // Bài không nằm trong chuỗi phải trả về hai null chứ không đoán vị trí:
  // findIndex trả -1, mà -1 dùng thẳng làm chỉ số thì `ordered[-2]` là undefined
  // còn `ordered[0]` lại thành "bài tiếp theo" của một bài không hề có thật.
  it('bài lạ thì không có bài nào kề', () => {
    expect(neighborsOf(chuoi, 'khong-co-that')).toEqual({ prev: null, next: null });
  });

  it('chuỗi rỗng và chuỗi một bài đều không có bài kề', () => {
    expect(neighborsOf([], 'chuong-01-bai-01')).toEqual({ prev: null, next: null });
    expect(neighborsOf([{ slug: 'a' }], 'a')).toEqual({ prev: null, next: null });
  });
});
