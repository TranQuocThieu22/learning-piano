import { describe, expect, it } from 'vitest';
import { inflateRawNode, zipFile } from './__fixtures__/zip-bytes';
import {
  inflateRawWeb,
  isZip,
  listZipEntries,
  readZipEntry,
  ZipFormatError,
  type ZipFailure,
} from './zip-read';

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

/** Lời hứa phải hỏng đúng lý do — hỏng vì lý do khác là người học nhận sai câu. */
async function hongVi(promise: Promise<unknown>, reason: ZipFailure) {
  const loi = await promise.then(() => null, (e: unknown) => e);
  expect(loi).toBeInstanceOf(ZipFormatError);
  expect((loi as ZipFormatError).reason).toBe(reason);
}

function hongNgay(run: () => unknown, reason: ZipFailure) {
  try {
    run();
  } catch (e) {
    expect(e).toBeInstanceOf(ZipFormatError);
    expect((e as ZipFormatError).reason).toBe(reason);
    return;
  }
  throw new Error(`đáng lẽ phải hỏng vì ${reason}`);
}

describe('nhận ra file nén', () => {
  it('nhìn byte đầu chứ không nhìn đuôi file', () => {
    expect(isZip(zipFile([{ name: 'a.xml', data: '<a/>' }]))).toBe(true);
    expect(isZip(zipFile([]))).toBe(true);
    expect(isZip(new TextEncoder().encode('<?xml version="1.0"?>'))).toBe(false);
    expect(isZip(new Uint8Array([0x50]))).toBe(false);
  });
});

describe('đọc mục lục và nội dung file nén', () => {
  it('đọc được cả mục lưu thẳng lẫn mục nén deflate', async () => {
    const bytes = zipFile([
      { name: 'thang.xml', data: 'lưu thẳng', method: 0 },
      { name: 'thu-muc/nen.xml', data: 'nén deflate '.repeat(50), method: 8 },
    ]);
    const entries = listZipEntries(bytes);
    expect(entries.map((e) => e.name)).toEqual(['thang.xml', 'thu-muc/nen.xml']);
    expect(text(await readZipEntry(bytes, entries[0], inflateRawNode, 1_000_000))).toBe('lưu thẳng');
    expect(text(await readZipEntry(bytes, entries[1], inflateRawNode, 1_000_000))).toBe('nén deflate '.repeat(50));
  });

  it('bộ giải nén của trình duyệt ra đúng như zlib', async () => {
    const bytes = zipFile([{ name: 'bai.xml', data: 'Đô Rê Mi '.repeat(2000) }]);
    const [entry] = listZipEntries(bytes);
    expect(text(await readZipEntry(bytes, entry, inflateRawWeb, 1_000_000))).toBe('Đô Rê Mi '.repeat(2000));
  });

  it('file không phải file nén, hay file nén bị cắt dở, thì báo hỏng', async () => {
    hongNgay(() => listZipEntries(new TextEncoder().encode('xin chào, đây không phải file nén')), 'broken');

    const bytes = zipFile([{ name: 'bai.xml', data: 'nội dung '.repeat(100) }]);
    // Mục lục vẫn còn nhưng khối dữ liệu bị xén: giống file tải về chưa trọn.
    const [entry] = listZipEntries(bytes);
    const xen = bytes.slice(0, 20);
    await hongVi(readZipEntry(xen, entry, inflateRawNode, 1_000_000), 'broken');
    hongNgay(() => listZipEntries(bytes.slice(0, bytes.length - 5)), 'broken');
  });

  it('khối deflate hỏng thì báo hỏng, không để lỗi lạ lọt ra', async () => {
    const bytes = zipFile([{ name: 'bai.xml', data: 'nội dung '.repeat(100) }]);
    const [entry] = listZipEntries(bytes);
    const hong = bytes.slice();
    hong.fill(0xff, 40, 60);
    await hongVi(readZipEntry(hong, entry, inflateRawNode, 1_000_000), 'broken');
  });

  it('file có đặt mật khẩu thì nói rõ là mật khẩu', () => {
    hongNgay(() => listZipEntries(zipFile([{ name: 'bai.xml', data: 'x', encrypted: true }])), 'encrypted');
  });
});

describe('chặn bom nén', () => {
  it('khai cỡ giải nén vượt mức thì từ chối trước khi giải nén', async () => {
    const bytes = zipFile([{ name: 'bai.xml', data: 'x', declaredSize: 5000 }]);
    const [entry] = listZipEntries(bytes);
    await hongVi(readZipEntry(bytes, entry, inflateRawNode, 1000), 'too-large');
  });

  it('khai cỡ nhỏ mà giải nén ra lớn thì dừng giữa chừng, ở cả zlib lẫn trình duyệt', async () => {
    const bytes = zipFile([{ name: 'bai.xml', data: new Uint8Array(200_000), declaredSize: 10 }]);
    const [entry] = listZipEntries(bytes);
    await hongVi(readZipEntry(bytes, entry, inflateRawNode, 1000), 'too-large');
    await hongVi(readZipEntry(bytes, entry, inflateRawWeb, 1000), 'too-large');
  });

  it('mục lưu thẳng lớn hơn mức cũng bị chặn', async () => {
    const bytes = zipFile([{ name: 'bai.xml', data: new Uint8Array(5000), method: 0, declaredSize: 10 }]);
    const [entry] = listZipEntries(bytes);
    await hongVi(readZipEntry(bytes, entry, inflateRawNode, 1000), 'too-large');
  });
});
