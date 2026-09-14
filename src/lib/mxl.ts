import { ImportedScoreError } from './imported-score';
import { rootfilePath } from './musicxml';
import { MAX_UNPACKED_XML_BYTES } from './user-sheets';
import {
  inflateRawWeb,
  listZipEntries,
  readZipEntry,
  ZipFormatError,
  type InflateRaw,
  type ZipEntry,
  type ZipFailure,
} from './zip-read';

/**
 * Lấy file MusicXML ra khỏi bản nén `.mxl`.
 *
 * Theo chuẩn MusicXML, bản nén có `META-INF/container.xml` chỉ tới file bản nhạc
 * chính. File tải từ các trang bản nhạc thật có đúng hai file đó (đã giải nén một
 * bản thật để kiểm: `container.xml` trỏ tới `score.xml`). Không có container thì
 * lấy file `.xml`/`.musicxml` đầu tiên nằm ngoài `META-INF` — phần mềm nén tay hay
 * quên container, mà bản nhạc thì vẫn nằm ngay đó.
 */

/** Câu cho người học ứng với từng lý do file nén không đọc được. */
const FAILURE_MESSAGES: Record<ZipFailure, string> = {
  broken: 'File .mxl này bị hỏng hoặc tải về chưa trọn. Thử tải lại file rồi chọn lại.',
  'too-large': 'File .mxl này giải nén ra quá lớn so với một bản nhạc piano, app không mở.',
  encrypted: 'File .mxl này có đặt mật khẩu, app không mở được.',
  'unsupported-method':
    'File .mxl này nén theo kiểu app chưa đọc được. Xuất lại ra .musicxml từ phần mềm soạn nhạc rồi nhập file đó.',
  'no-inflate':
    'Máy này chưa giải nén được file .mxl. Cập nhật hệ điều hành hoặc trình duyệt rồi thử lại, hoặc dùng file .musicxml.',
};

const CONTAINER = 'META-INF/container.xml';

function findScore(entries: ZipEntry[], path: string | null): ZipEntry | undefined {
  if (path) {
    // Container đôi khi ghi `./score.xml`; tên mục trong file nén thì không có `./`.
    const wanted = path.replace(/^\.?\//, '');
    const hit = entries.find((e) => e.name === wanted);
    if (hit) return hit;
  }
  return entries.find((e) => !e.name.startsWith('META-INF/') && /\.(musicxml|xml)$/i.test(e.name));
}

export async function unpackMxl(
  bytes: Uint8Array,
  inflateRaw: InflateRaw = inflateRawWeb,
): Promise<Uint8Array> {
  try {
    const entries = listZipEntries(bytes);
    const container = entries.find((e) => e.name === CONTAINER);
    const path = container
      ? rootfilePath(new TextDecoder('utf-8').decode(
        await readZipEntry(bytes, container, inflateRaw, MAX_UNPACKED_XML_BYTES),
      ))
      : null;

    const score = findScore(entries, path);
    if (!score) {
      throw new ImportedScoreError('File nén này không có bản nhạc MusicXML nào bên trong.');
    }
    return await readZipEntry(bytes, score, inflateRaw, MAX_UNPACKED_XML_BYTES);
  } catch (e) {
    if (e instanceof ZipFormatError) throw new ImportedScoreError(FAILURE_MESSAGES[e.reason]);
    throw e;
  }
}
