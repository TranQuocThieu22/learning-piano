import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { ZipFormatError, type InflateRaw } from '../zip-read';

/**
 * Dựng file ZIP thật bằng byte, cho test của phần đọc bản nhạc nén `.mxl`.
 *
 * Cùng lý do với `midi-bytes.ts`: test phải nói rõ bên trong file có gì — "file
 * khai cỡ 10 byte mà giải nén ra 50KB" là câu đọc được, một file nhị phân để sẵn
 * trong repo thì không. CRC để 0 vì bộ đọc cố ý không kiểm CRC.
 */

export interface ZipSpec {
  name: string;
  data: Uint8Array | string;
  /** 0 = lưu thẳng, 8 = deflate. Mặc định deflate, như file `.mxl` thật. */
  method?: 0 | 8;
  /** Cỡ giải nén khai trong file — đặt khác cỡ thật để giả một bom nén. */
  declaredSize?: number;
  encrypted?: boolean;
}

const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
const u32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

export function zipFile(specs: ZipSpec[]): Uint8Array {
  const encoder = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];

  for (const spec of specs) {
    const raw = typeof spec.data === 'string' ? encoder.encode(spec.data) : spec.data;
    const method = spec.method ?? 8;
    const body = method === 8 ? [...deflateRawSync(raw)] : [...raw];
    const name = [...encoder.encode(spec.name)];
    const size = spec.declaredSize ?? raw.length;
    // Bit 11: tên file mã UTF-8.
    const flags = (spec.encrypted ? 1 : 0) | 0x800;
    const offset = local.length;

    local.push(
      ...u32(0x04034b50), ...u16(20), ...u16(flags), ...u16(method), ...u16(0), ...u16(0),
      ...u32(0), ...u32(body.length), ...u32(size), ...u16(name.length), ...u16(0),
      ...name, ...body,
    );
    central.push(
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(flags), ...u16(method), ...u16(0), ...u16(0),
      ...u32(0), ...u32(body.length), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ...name,
    );
  }

  const eocd = [
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(specs.length), ...u16(specs.length),
    ...u32(central.length), ...u32(local.length), ...u16(0),
  ];
  return new Uint8Array([...local, ...central, ...eocd]);
}

/** `container.xml` y như file `.mxl` tải từ một trang bản nhạc thật. */
export function containerXml(fullPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="${fullPath}">
      </rootfile>
    </rootfiles>
  </container>`;
}

/** Bộ giải nén cho test, cùng hợp đồng với `inflateRawWeb`: vượt mức là `too-large`. */
export const inflateRawNode: InflateRaw = async (data, maxBytes) => {
  try {
    return new Uint8Array(inflateRawSync(data, { maxOutputLength: maxBytes }));
  } catch (e) {
    if (e instanceof RangeError) throw new ZipFormatError('too-large');
    throw e;
  }
};
