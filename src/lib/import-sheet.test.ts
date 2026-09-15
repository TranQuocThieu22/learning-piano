import { describe, expect, it } from 'vitest';
import { END_OF_TRACK, midiFile, note } from './__fixtures__/midi-bytes';
import { containerXml, inflateRawNode, zipFile } from './__fixtures__/zip-bytes';
import { importSheetFile } from './import-sheet';
import { ImportedScoreError } from './imported-score';

const bonNot = [...note(60, 480), ...note(62, 480), ...note(64, 480), ...note(65, 480), ...END_OF_TRACK];

function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

const XML_MAU = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Bài quen tai</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
  </measure></part>
</score-partwise>`;

describe('nhập một file thành bản nhạc lưu được', () => {
  it('file MIDI ra chuỗi ABC vẽ được, tên lấy từ tên file', async () => {
    const sheet = await importSheetFile('Fur Elise.mid', midiFile([bonNot]));
    expect(sheet.source).toBe('midi');
    expect(sheet.title).toBe('Fur Elise');
    expect(sheet.abc).toContain('K: C');
    expect(sheet.abc).toContain('C D E F');
  });

  it('file khai giọng nào thì bản nhạc mang đúng hoá biểu đó', async () => {
    const hoaBieu = [0x00, 0xff, 0x59, 0x02, 0x02, 0x00]; // hai thăng
    const sheet = await importSheetFile('bai.mid', midiFile([[...hoaBieu, ...bonNot]]));
    expect(sheet.abc).toContain('K: D');
  });

  /*
   * Người soạn bản nhạc đã quyết bài ở giọng nào và mỗi dấu hoá đứng ở đâu, nên
   * app **không có đường nào đặt lại hoá biểu**. File không khai thì giữ `K: C`
   * và ghi dấu cạnh từng nốt: nhiều dấu, nhưng không sai một nốt nào.
   */
  it('file không khai giọng thì giữ Đô trưởng, không đoán hộ', async () => {
    const sheet = await importSheetFile('Fur Elise.mid', midiFile([bonNot]));
    expect(sheet.abc).toContain('K: C');
    expect(Object.keys(sheet)).toEqual(['title', 'abc', 'source']);
  });

  it('file MusicXML giữ tên bài ghi trong file', async () => {
    const sheet = await importSheetFile('untitled-score.musicxml', bytesOf(XML_MAU));
    expect(sheet.source).toBe('musicxml');
    expect(sheet.title).toBe('Bài quen tai');
  });

  it('phần mềm soạn nhạc để tên mặc định thì lấy tên file cho dễ tìm', async () => {
    const xml = XML_MAU.replace('Bài quen tai', 'Untitled score');
    const sheet = await importSheetFile('dong-mien.musicxml', bytesOf(xml));
    expect(sheet.title).toBe('dong mien');
  });

  it('file XML có dấu BOM ở đầu vẫn đọc được', async () => {
    const sheet = await importSheetFile('bai.musicxml', bytesOf(`﻿${XML_MAU}`));
    expect(sheet.abc).toContain('T: Bài quen tai');
  });

  it('định dạng app chưa nhận thì chỉ sang đường chụp ảnh', async () => {
    await expect(importSheetFile('ban-nhac.pdf', bytesOf('%PDF-1.4'))).rejects.toThrow(/chụp ảnh/);
  });

  it('file rỗng thì nói rõ, không dựng ra bản nhạc trống', async () => {
    await expect(importSheetFile('trong.mid', new Uint8Array())).rejects.toThrow(ImportedScoreError);
  });
});

describe('nhập file MusicXML nén (.mxl) mà không phải giải nén tay', () => {
  const nhap = (fileName: string, bytes: Uint8Array) => importSheetFile(fileName, bytes, inflateRawNode);

  it('file .mxl nén deflate như file tải về thật ra bản nhạc giống hệt file .musicxml', async () => {
    const mxl = zipFile([
      { name: 'META-INF/container.xml', data: containerXml('score.xml') },
      { name: 'score.xml', data: XML_MAU },
    ]);
    const tuMxl = await nhap('reze.mxl', mxl);
    const tuXml = await importSheetFile('reze.musicxml', bytesOf(XML_MAU));
    expect(tuMxl).toEqual(tuXml);
    expect(tuMxl.source).toBe('musicxml');
  });

  it('file .mxl lưu thẳng không nén cũng đọc được', async () => {
    const mxl = zipFile([
      { name: 'META-INF/container.xml', data: containerXml('score.xml'), method: 0 },
      { name: 'score.xml', data: XML_MAU, method: 0 },
    ]);
    expect((await nhap('bai.mxl', mxl)).title).toBe('Bài quen tai');
  });

  it('container trỏ tới file khác tên thì lấy đúng file đó, bỏ qua file .xml đứng trước', async () => {
    const mxl = zipFile([
      { name: 'META-INF/container.xml', data: containerXml('nhac/bai-chinh.musicxml') },
      { name: 'ghi-chu.xml', data: '<ghi-chu>không phải bản nhạc</ghi-chu>' },
      { name: 'nhac/bai-chinh.musicxml', data: XML_MAU },
    ]);
    expect((await nhap('bai.mxl', mxl)).title).toBe('Bài quen tai');
  });

  it('không có container thì lấy file MusicXML đầu tiên nằm ngoài META-INF', async () => {
    const mxl = zipFile([
      { name: 'META-INF/khac.xml', data: '<khac/>' },
      { name: 'doc-toi.txt', data: 'xin chào' },
      { name: 'bai.xml', data: XML_MAU },
    ]);
    expect((await nhap('bai.mxl', mxl)).title).toBe('Bài quen tai');
  });

  it('file .xml mà thật ra là bản nén vẫn mở được, vì app nhìn nội dung chứ không nhìn đuôi', async () => {
    const mxl = zipFile([{ name: 'score.xml', data: XML_MAU }]);
    expect((await nhap('doi-ten.xml', mxl)).title).toBe('Bài quen tai');
  });

  it('file đuôi .mxl mà không phải bản nén thì nói thẳng', async () => {
    await expect(nhap('gia.mxl', bytesOf('xin chào'))).rejects.toThrow(ImportedScoreError);
  });

  it('bản nén không có bản nhạc MusicXML bên trong thì nói rõ', async () => {
    const zip = zipFile([{ name: 'doc-toi.txt', data: 'chỉ có chữ' }]);
    await expect(nhap('bai.mxl', zip)).rejects.toThrow(/không có bản nhạc MusicXML/);
  });

  it('bản nén tải về chưa trọn thì bảo tải lại, không ra lỗi lạ', async () => {
    const mxl = zipFile([{ name: 'score.xml', data: XML_MAU }]);
    await expect(nhap('bai.mxl', mxl.slice(0, mxl.length - 30))).rejects.toThrow(/tải lại/);
  });
});
