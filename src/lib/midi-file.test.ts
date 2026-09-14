import { describe, expect, it } from 'vitest';
import { ImportedScoreError } from './imported-score';
import { parseMidiFile } from './midi-file';
import { END_OF_TRACK, midiFile as file, note, varint } from './__fixtures__/midi-bytes';

describe('đọc file MIDI thành bản nhạc', () => {
  it('bốn nốt đen ra đúng bốn nốt trên khuông', () => {
    const score = parseMidiFile(file([[...note(60, 480), ...note(62, 480), ...note(64, 480), ...note(65, 480), ...END_OF_TRACK]]));
    expect(score.staves).toHaveLength(1);
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60], [62], [64], [65]]);
    expect(score.staves[0].events.every((e) => e.beats === 1)).toBe(true);
  });

  it('người đánh thật hơi lệch tay thì nốt vẫn về đúng hình nốt', () => {
    // Giữ 470 tick thay vì 480, và bấm nốt sau trễ 9 tick — đúng kiểu bản ghi
    // từ đàn thật. Làm tròn về móc kép phải xoá được chỗ vụn đó.
    const score = parseMidiFile(file([[...note(60, 470), ...note(62, 474, 9), ...END_OF_TRACK]]));
    expect(score.staves[0].events.map((e) => e.beats)).toEqual([1, 1]);
  });

  it('hai nốt bấm cùng lúc thành một chồng nốt', () => {
    const track = [
      0x00, 0x90, 60, 0x40,
      0x00, 0x90, 64, 0x40,
      ...varint(480), 0x80, 60, 0x40,
      0x00, 0x80, 64, 0x40,
      ...END_OF_TRACK,
    ];
    const score = parseMidiFile(file([track]));
    expect(score.staves[0].events[0].midis).toEqual([60, 64]);
  });

  it('bài có nốt cả trên lẫn dưới Đô giữa thì dựng hai khuông', () => {
    const track = [
      0x00, 0x90, 48, 0x40,
      0x00, 0x90, 64, 0x40,
      ...varint(480), 0x80, 48, 0x40,
      0x00, 0x80, 64, 0x40,
      ...END_OF_TRACK,
    ];
    const score = parseMidiFile(file([track]));
    expect(score.staves.map((s) => s.clef)).toEqual(['treble', 'bass']);
  });

  it('khoảng nghỉ giữa hai nốt thành dấu lặng chứ không bị nuốt mất', () => {
    const score = parseMidiFile(file([[...note(60, 480), ...note(62, 480, 480), ...END_OF_TRACK]]));
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60], [], [62]]);
  });

  it('đọc được tốc độ và số chỉ nhịp file khai', () => {
    const tempo = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20]; // 500000us = 120 nhịp/phút
    const nhip = [0x00, 0xff, 0x58, 0x04, 0x03, 0x02, 0x18, 0x08]; // 3/4
    const ten = [0x00, 0xff, 0x03, 0x04, ...[...'Test'].map((c) => c.charCodeAt(0))];
    const score = parseMidiFile(file([[...ten, ...tempo, ...nhip, ...note(60, 480), ...END_OF_TRACK]]));
    expect(score.bpm).toBe(120);
    expect(score.beatsPerBar).toBe(3);
    expect(score.beatUnit).toBe(4);
    expect(score.title).toBe('Test');
  });

  it('file khai hoá biểu thì mở ra sẵn đúng giọng đó', () => {
    // FF 59 02 sf mi — ba giáng, giọng trưởng.
    const hoaBieu = [0x00, 0xff, 0x59, 0x02, 0xfd, 0x00];
    const score = parseMidiFile(file([[...hoaBieu, ...note(60, 480), ...END_OF_TRACK]]));
    expect(score.key?.id).toBe('Eb');
  });

  it('giọng thứ dùng chung hoá biểu với giọng trưởng song song', () => {
    // Hai thăng, giọng thứ: Si thứ, cùng hoá biểu với Rê trưởng.
    const hoaBieu = [0x00, 0xff, 0x59, 0x02, 0x02, 0x01];
    const score = parseMidiFile(file([[...hoaBieu, ...note(60, 480), ...END_OF_TRACK]]));
    expect(score.key?.id).toBe('D');
  });

  it('file không khai hoá biểu thì để trống cho người học tự chọn, không đoán', () => {
    const score = parseMidiFile(file([[...note(61, 480), ...note(63, 480), ...END_OF_TRACK]]));
    expect(score.key).toBeNull();
  });

  it('đọc được file dùng trạng thái chạy tiếp (bỏ byte lệnh lặp lại)', () => {
    const track = [
      0x00, 0x90, 60, 0x40,
      ...varint(480), 60, 0x00, // nhả bằng chính lệnh 0x90 với vận tốc 0
      ...varint(0), 62, 0x40,
      ...varint(480), 62, 0x00,
      ...END_OF_TRACK,
    ];
    const score = parseMidiFile(file([track]));
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60], [62]]);
  });

  it('file có đệm trống thì chỉ còn nốt piano, tiếng trống không thành nốt rác', () => {
    // Trống và piano chung một track, đan xen nhau như file format 0 tải từ mạng.
    // Trống 60 (Hi Bongo) trùng số với nốt piano đang giữ: lệnh nhả của nó không
    // được chốt nốt piano sớm. Trống 36 thì nhả bằng trạng thái chạy tiếp, để chắc
    // bỏ qua kênh trống vẫn đọc đủ byte.
    const track = [
      0x00, 0x90, 60, 0x40, // piano Đô giữa
      0x00, 0x99, 36, 0x40, // trống bass
      ...varint(120), 36, 0x00, // nhả trống bằng trạng thái chạy tiếp
      0x00, 0x99, 60, 0x40,
      ...varint(120), 0x89, 60, 0x40,
      ...varint(240), 0x80, 60, 0x40,
      ...note(38, 240, 0, 9), // trống snare
      ...note(64, 480),
      ...END_OF_TRACK,
    ];
    const score = parseMidiFile(file([track]));
    expect(score.staves).toHaveLength(1);
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60], [], [64]]);
    expect(score.staves[0].events.map((e) => e.beats)).toEqual([1, 0.5, 1]);
  });

  it('file chỉ có tiếng trống thì báo không có nốt nào', () => {
    const track = [...note(36, 240, 0, 9), ...note(38, 240, 0, 9), ...note(42, 240, 0, 9), ...END_OF_TRACK];
    expect(() => parseMidiFile(file([track]))).toThrow(ImportedScoreError);
    expect(() => parseMidiFile(file([track]))).toThrow(/không có nốt nào — có thể nó chỉ chứa tiếng trống hoặc rỗng/);
  });

  it('file không phải MIDI thì nói rõ cho người học, không ném lỗi kỹ thuật', () => {
    expect(() => parseMidiFile(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])))
      .toThrow(ImportedScoreError);
    expect(() => parseMidiFile(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])))
      .toThrow(/không phải file MIDI/);
  });

  it('file MIDI không có nốt nào thì nói rõ vì sao', () => {
    expect(() => parseMidiFile(file([[...END_OF_TRACK]]))).toThrow(/không có nốt nào/);
  });

  it('file cắt dở thì báo một câu đọc được chứ không vỡ', () => {
    const day = file([[...note(60, 480), ...END_OF_TRACK]]);
    expect(() => parseMidiFile(day.slice(0, 12))).toThrow(ImportedScoreError);
  });
});
