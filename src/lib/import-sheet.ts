import { ImportedScoreError, toAbc } from './imported-score';
import { parseMidiFile } from './midi-file';
import { parseMusicXml } from './musicxml';
import { detectSource, titleFromFileName, MAX_ABC_CHARS, type SheetSource } from './user-sheets';

/**
 * Cửa **duy nhất** biến một file người học chọn thành bản nhạc lưu được.
 *
 * Gộp ở đây chứ không để mỗi trang tự gọi `parseMidiFile` hay `parseMusicXml`:
 * trang nhập, phần thử trước khi lưu và (về sau) mọi chỗ khác đều cần đúng chuỗi
 * việc này — nhận ra định dạng, đọc, ghi ra ABC, đặt tên, kiểm độ dài. Chép chuỗi
 * đó sang chỗ thứ hai là chỗ thứ hai quên một bước, thường là bước kiểm.
 *
 * Chạy được cả trong trình duyệt lẫn trong vitest: nhận thẳng `Uint8Array` và
 * không chạm `window` (quy tắc 2 của `.claude/skills/code-standards/SKILL.md`).
 * Thật sự thì nó CHẠY ở trình duyệt — máy của người học đọc file rồi chỉ gửi lên
 * chuỗi ABC, nên máy chủ không bao giờ phải nhận một file nhị phân lạ.
 */

export interface ImportedSheet {
  title: string;
  abc: string;
  source: SheetSource;
}

/** Bỏ dấu BOM: phần mềm soạn nhạc trên Windows hay để nó ở đầu file XML. */
function decodeUtf8(bytes: Uint8Array): string {
  const text = new TextDecoder('utf-8').decode(bytes);
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function importSheetFile(fileName: string, bytes: Uint8Array): ImportedSheet {
  const source = detectSource(fileName);
  if (source === null || source === 'photo') {
    throw new ImportedScoreError(
      'App nhận file .mid, .midi, .musicxml hoặc .xml. Bản nhạc giấy thì dùng phần chụp ảnh bên dưới.',
    );
  }

  if (bytes.length === 0) {
    throw new ImportedScoreError('File này rỗng.');
  }

  const score = source === 'midi' ? parseMidiFile(bytes) : parseMusicXml(decodeUtf8(bytes));
  const abc = toAbc(score);

  if (abc.length > MAX_ABC_CHARS) {
    throw new ImportedScoreError(
      'Bản nhạc này dài quá mức app giữ được. Cắt bớt trong phần mềm soạn nhạc rồi nhập lại từng đoạn.',
    );
  }

  /*
   * Tên file thắng tên ghi trong file khi file khai một cái tên vô nghĩa: phần
   * mềm soạn nhạc hay để nguyên "Untitled score", còn người học thì đặt tên file
   * theo đúng bài họ đang tìm.
   */
  const trongFile = score.title.trim();
  const voNghia = /^(untitled|unnamed|score|bản nhạc của tôi)/i.test(trongFile);
  const title = !trongFile || voNghia ? titleFromFileName(fileName) : trongFile.slice(0, 120);

  return { title, abc, source };
}
