import { describe, expect, it } from 'vitest';
import { addSlug, createSlugListStore, parseSlugList, withSlug } from './slug-list';
import { fakeHost } from './__fixtures__/fake-store-host';

describe('parseSlugList', () => {
  it('đọc lại đúng danh sách đã lưu', () => {
    expect(parseSlugList('["chuong-01-bai-01","chuong-01-bai-02"]')).toEqual([
      'chuong-01-bai-01',
      'chuong-01-bai-02',
    ]);
  });

  // Một phần tử hỏng không đáng làm mất hết những bài đã được khen.
  it('bỏ phần tử lạ nhưng giữ phần còn lại', () => {
    expect(parseSlugList('["chuong-01-bai-01", 3, null, "", "chuong-01-bai-01"]')).toEqual([
      'chuong-01-bai-01',
    ]);
  });

  it('dữ liệu không phải danh sách thì báo lỗi để kho lùi về rỗng', () => {
    expect(() => parseSlugList('{"a":1}')).toThrow();
    expect(() => parseSlugList('không phải JSON')).toThrow();
  });
});

describe('withSlug', () => {
  it('thêm bài mới vào cuối', () => {
    expect(withSlug(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('bài đã có thì trả về đúng danh sách cũ, không tạo bản mới', () => {
    const list = ['a', 'b'];
    expect(withSlug(list, 'a')).toBe(list);
  });
});

describe('kho danh sách bài', () => {
  it('ghi một bài rồi mở lại vẫn còn', () => {
    const browser = fakeHost();
    addSlug(createSlugListStore('pj-test', browser.host), 'chuong-01-bai-01');
    expect(createSlugListStore('pj-test', browser.host).getSnapshot()).toEqual(['chuong-01-bai-01']);
  });

  it('đánh trọn cùng một bài lần thứ hai thì không ghi thêm dòng trùng', () => {
    const browser = fakeHost();
    const store = createSlugListStore('pj-test', browser.host);
    addSlug(store, 'chuong-01-bai-01');
    addSlug(store, 'chuong-01-bai-01');
    expect(browser.data.get('pj-test')).toBe('["chuong-01-bai-01"]');
  });

  // Chế độ riêng tư: không lưu được thì buổi này vẫn thấy lời khen, chỉ lần sau là mất.
  it('trình duyệt chặn lưu trữ thì vẫn nhớ trong buổi này', () => {
    const browser = fakeHost();
    browser.block(true);
    const store = createSlugListStore('pj-test', browser.host);
    addSlug(store, 'chuong-01-bai-01');
    expect(store.getSnapshot()).toEqual(['chuong-01-bai-01']);
  });
});
