/**
 * Đọc file ZIP ở mức tối thiểu — đủ cho file MusicXML nén (`.mxl`), không hơn.
 *
 * Vì sao tự viết thay vì thêm thư viện: nút tải "MusicXML" của các trang bản nhạc
 * phổ biến cho ra `.mxl`, mà trên điện thoại — nhất là iPhone — người học gần như
 * không có cách giải nén tay. Phần phải tự đọc chỉ là mục lục ở cuối file và vị trí
 * từng khối dữ liệu; phần giải nén thật (`deflate`) trình duyệt đã có sẵn
 * `DecompressionStream`. Thêm cả một thư viện ZIP vào gói mã là quá tay cho đúng
 * một nút chọn file.
 *
 * Đọc thuần trên `Uint8Array`, không chạm `window` (quy tắc 2 của
 * `.claude/skills/code-standards/SKILL.md`): hàm giải nén nhận qua tham số
 * `InflateRaw` — trình duyệt dùng `inflateRawWeb`, test dùng `node:zlib`.
 *
 * Cố ý KHÔNG hỗ trợ: ZIP64 (file trên 4GB, không bản nhạc nào tới), file đặt mật
 * khẩu, và kiểm CRC — khối deflate hỏng thì bộ giải nén tự ném lỗi, khối lưu thẳng
 * mà hỏng thì bộ đọc MusicXML phía sau báo "không phải file MusicXML".
 */

/** Vì sao không đọc được. Mỗi lý do ứng với một câu cho người học, tra ở `mxl.ts`. */
export type ZipFailure = 'broken' | 'too-large' | 'encrypted' | 'unsupported-method' | 'no-inflate';

export class ZipFormatError extends Error {
  reason: ZipFailure;

  constructor(reason: ZipFailure, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.reason = reason;
  }
}

/**
 * Giải nén một khối deflate thô — không có đầu gói zlib hay gzip, đúng dạng ZIP cất.
 *
 * Phải tự dừng và ném `ZipFormatError('too-large')` ngay khi ra quá `maxBytes`:
 * chờ giải nén xong rồi mới đo thì một "bom nén" vài KB đã kịp nuốt hết bộ nhớ của
 * điện thoại.
 */
export type InflateRaw = (data: Uint8Array, maxBytes: number) => Promise<Uint8Array>;

export interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  /** Cỡ file TỰ KHAI — file cố tình làm hại có thể khai sai, nên chỉ dùng để chặn sớm. */
  uncompressedSize: number;
  localHeaderOffset: number;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
/** Mục lục cuối file dài 22 byte, cộng chú thích tối đa 65535 byte đứng sau nó. */
const EOCD_LENGTH = 22;
const MAX_COMMENT = 0xffff;
const METHOD_STORED = 0;
const METHOD_DEFLATE = 8;
const FLAG_ENCRYPTED = 0x1;

/**
 * File có phải bản nén không, nhìn BỐN BYTE ĐẦU chứ không nhìn đuôi file — đuôi file
 * chỉ là cái tên, người học đổi tên file là chuyện thường.
 *
 * `PK\x05\x06` là file nén rỗng: vẫn tính là nén, để người học nhận câu "không có
 * bản nhạc bên trong" thay vì câu "không phải file MusicXML" dễ hiểu nhầm.
 */
export function isZip(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false;
  return (bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06);
}

function viewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/**
 * Đọc mục lục của file nén.
 *
 * Đi từ CUỐI file (End of Central Directory) chứ không đọc tuần tự từ đầu: cỡ khối
 * ghi ở đầu mỗi khối có thể bằng 0 khi phần mềm nén ghi cỡ ra sau (cờ "data
 * descriptor"), còn mục lục cuối file thì luôn có cỡ thật.
 */
export function listZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = viewOf(bytes);

  let eocd = -1;
  const lowest = Math.max(0, bytes.length - EOCD_LENGTH - MAX_COMMENT);
  for (let i = bytes.length - EOCD_LENGTH; i >= lowest; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipFormatError('broken', 'không thấy mục lục cuối file');

  const count = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (count === 0xffff || centralOffset === 0xffffffff) {
    throw new ZipFormatError('unsupported-method', 'ZIP64');
  }
  if (centralOffset + centralSize > eocd) {
    throw new ZipFormatError('broken', 'mục lục vượt ra ngoài file');
  }

  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];
  let at = centralOffset;
  for (let k = 0; k < count; k += 1) {
    if (at + 46 > eocd || view.getUint32(at, true) !== CENTRAL_SIGNATURE) {
      throw new ZipFormatError('broken', `mục thứ ${k + 1} hỏng`);
    }
    const flags = view.getUint16(at + 8, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const nameEnd = at + 46 + nameLength;
    if (nameEnd > eocd) throw new ZipFormatError('broken', `tên mục thứ ${k + 1} hỏng`);
    if (flags & FLAG_ENCRYPTED) throw new ZipFormatError('encrypted');

    entries.push({
      name: decoder.decode(bytes.subarray(at + 46, nameEnd)),
      method: view.getUint16(at + 10, true),
      compressedSize: view.getUint32(at + 20, true),
      uncompressedSize: view.getUint32(at + 24, true),
      localHeaderOffset: view.getUint32(at + 42, true),
    });
    at = nameEnd + extraLength + commentLength;
  }

  return entries;
}

/** Nội dung của một mục trong file nén, đã giải nén, không quá `maxBytes`. */
export async function readZipEntry(
  bytes: Uint8Array,
  entry: ZipEntry,
  inflateRaw: InflateRaw,
  maxBytes: number,
): Promise<Uint8Array> {
  // Chặn sớm theo cỡ tự khai — rẻ, và đủ cho mọi file không cố tình khai sai.
  if (entry.uncompressedSize > maxBytes) throw new ZipFormatError('too-large');

  const view = viewOf(bytes);
  const at = entry.localHeaderOffset;
  if (at + 30 > bytes.length || view.getUint32(at, true) !== LOCAL_SIGNATURE) {
    throw new ZipFormatError('broken', `không thấy đầu khối của ${entry.name}`);
  }
  // Tên và phần phụ ở đầu khối có thể dài khác ở mục lục, nên đọc lại độ dài tại đây.
  const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
  const end = start + entry.compressedSize;
  if (end > bytes.length) throw new ZipFormatError('broken', `${entry.name} bị cắt dở`);
  const data = bytes.subarray(start, end);

  if (entry.method === METHOD_STORED) {
    if (data.length > maxBytes) throw new ZipFormatError('too-large');
    return data;
  }
  if (entry.method !== METHOD_DEFLATE) {
    throw new ZipFormatError('unsupported-method', `kiểu nén ${entry.method}`);
  }

  let out: Uint8Array;
  try {
    out = await inflateRaw(data, maxBytes);
  } catch (e) {
    if (e instanceof ZipFormatError) throw e;
    throw new ZipFormatError('broken', e instanceof Error ? e.message : undefined);
  }
  // Đo lại kể cả khi bộ giải nén đã hứa tự chặn: một bộ giải nén quên chặn thì
  // cũng chỉ tốn bộ nhớ một lần, không đi tiếp vào bộ đọc MusicXML.
  if (out.length > maxBytes) throw new ZipFormatError('too-large');
  return out;
}

/**
 * Bộ giải nén của trình duyệt, qua `DecompressionStream('deflate-raw')`.
 *
 * Kiểu `deflate-raw` có trên Chrome và Edge đời mới, Firefox, và Safari từ iOS 16.4.
 * Máy cũ hơn thì ném `no-inflate` để người học nhận câu "cập nhật máy", không phải
 * câu "file hỏng" khiến họ đi tải lại mãi.
 *
 * Đọc từng mảnh và dừng ngay khi vượt `maxBytes` — không gom hết rồi mới đo.
 */
export const inflateRawWeb: InflateRaw = async (data, maxBytes) => {
  let stream: DecompressionStream;
  try {
    stream = new DecompressionStream('deflate-raw');
  } catch {
    throw new ZipFormatError('no-inflate');
  }

  const writer = stream.writable.getWriter();
  // KHÔNG chờ ghi xong rồi mới đọc: luồng có sức ép ngược, dữ liệu lớn hơn bộ đệm
  // thì lời hứa ghi không bao giờ xong khi chưa ai đọc — chờ ở đây là treo. Lỗi ghi
  // (khối hỏng) vẫn lộ ra ở phía đọc bên dưới.
  writer.write(new Uint8Array(data)).then(() => writer.close()).catch(() => {});

  const reader = stream.readable.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new ZipFormatError('too-large');
    }
    parts.push(value);
  }

  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};
