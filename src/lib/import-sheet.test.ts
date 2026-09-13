import { describe, expect, it } from 'vitest';
import { END_OF_TRACK, midiFile, note } from './__fixtures__/midi-bytes';
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
  it('file MIDI ra chuỗi ABC vẽ được, tên lấy từ tên file', () => {
    const sheet = importSheetFile('Fur Elise.mid', midiFile([bonNot]));
    expect(sheet.source).toBe('midi');
    expect(sheet.title).toBe('Fur Elise');
    expect(sheet.abc).toContain('K: C');
    expect(sheet.abc).toContain('C D E F');
  });

  it('file MusicXML giữ tên bài ghi trong file', () => {
    const sheet = importSheetFile('untitled-score.musicxml', bytesOf(XML_MAU));
    expect(sheet.source).toBe('musicxml');
    expect(sheet.title).toBe('Bài quen tai');
  });

  it('phần mềm soạn nhạc để tên mặc định thì lấy tên file cho dễ tìm', () => {
    const xml = XML_MAU.replace('Bài quen tai', 'Untitled score');
    const sheet = importSheetFile('dong-mien.musicxml', bytesOf(xml));
    expect(sheet.title).toBe('dong mien');
  });

  it('file XML có dấu BOM ở đầu vẫn đọc được', () => {
    const sheet = importSheetFile('bai.musicxml', bytesOf(`﻿${XML_MAU}`));
    expect(sheet.abc).toContain('T: Bài quen tai');
  });

  it('định dạng app chưa nhận thì chỉ sang đường chụp ảnh', () => {
    expect(() => importSheetFile('ban-nhac.pdf', bytesOf('%PDF-1.4')))
      .toThrow(/chụp ảnh/);
  });

  it('file rỗng thì nói rõ, không dựng ra bản nhạc trống', () => {
    expect(() => importSheetFile('trong.mid', new Uint8Array())).toThrow(ImportedScoreError);
  });
});
