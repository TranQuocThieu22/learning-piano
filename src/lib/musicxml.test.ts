import { describe, expect, it } from 'vitest';
import { ImportedScoreError, toAbc } from './imported-score';
import { parseMusicXml } from './musicxml';

/** Khung file MusicXML thật, chỉ thay phần ô nhịp. */
function file(measures: string, header = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  ${header}
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">${measures}</part>
</score-partwise>`;
}

function note(step: string, octave: number, duration = 1, extra = ''): string {
  return `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${duration}</duration>${extra}</note>`;
}

const ATTRS = '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>';

describe('đọc file MusicXML', () => {
  it('bốn nốt đen ra đúng bốn nốt', () => {
    const score = parseMusicXml(file(`<measure number="1">${ATTRS}${note('C', 4)}${note('D', 4)}${note('E', 4)}${note('F', 4)}</measure>`));
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60], [62], [64], [65]]);
    expect(score.beatsPerBar).toBe(4);
  });

  it('dấu thăng giáng trong file ra đúng cao độ', () => {
    const xml = file(`<measure number="1">${ATTRS}<note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>4</duration></note></measure>`);
    expect(parseMusicXml(xml).staves[0].events[0].midis).toEqual([70]);
  });

  it('nốt bấm cùng lúc trong cùng thẻ chord thành một chồng nốt', () => {
    const chord = `${note('C', 4, 4)}${note('E', 4, 4, '<chord/>')}${note('G', 4, 4, '<chord/>')}`;
    const score = parseMusicXml(file(`<measure number="1">${ATTRS}${chord}</measure>`));
    expect(score.staves[0].events[0].midis).toEqual([60, 64, 67]);
    expect(toAbc(score)).toContain('[CEG]4');
  });

  it('hai khuông viết bằng backup thì ra hai tay chứ không nối đuôi nhau', () => {
    const measure = '<measure number="1">'
      + '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves></attributes>'
      + `${note('C', 5, 4, '<staff>1</staff>')}`
      + '<backup><duration>4</duration></backup>'
      + `${note('C', 3, 4, '<staff>2</staff>')}`
      + '</measure>';
    const score = parseMusicXml(file(measure));
    expect(score.staves.map((s) => s.clef)).toEqual(['treble', 'bass']);
    // Cùng bắt đầu từ phách 1: tay trái không được đẩy ra sau tay phải.
    expect(score.staves[0].events[0].midis).toEqual([72]);
    expect(score.staves[1].events[0].midis).toEqual([48]);
    expect(score.staves[1].events[0].beats).toBe(4);
  });

  it('nốt luyến sang ô sau là MỘT nốt dài, không phải hai lần bấm', () => {
    const m1 = `<measure number="1">${ATTRS}${note('C', 4, 4, '<tie type="start"/>')}</measure>`;
    const m2 = `<measure number="2">${note('C', 4, 4, '<tie type="stop"/>')}</measure>`;
    const score = parseMusicXml(file(m1 + m2));
    expect(score.staves[0].events).toHaveLength(1);
    expect(score.staves[0].events[0].beats).toBe(8);
  });

  it('dấu lặng thành khoảng trống, không thành nốt', () => {
    const measure = `<measure number="1">${ATTRS}<note><rest/><duration>2</duration></note>${note('C', 4, 2)}</measure>`;
    const score = parseMusicXml(file(measure));
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[], [60]]);
  });

  it('nốt hoa mỹ bị bỏ qua để con trỏ không lệch', () => {
    const measure = `<measure number="1">${ATTRS}<note><grace/><pitch><step>B</step><octave>3</octave></pitch></note>${note('C', 4, 4)}</measure>`;
    const score = parseMusicXml(file(measure));
    expect(score.staves[0].events.map((e) => e.midis)).toEqual([[60]]);
  });

  it('lấy được tên bài và tốc độ file khai', () => {
    const header = '<work><work-title>B&#224;i t&#7853;p &amp; ôn</work-title></work>';
    const measure = `<measure number="1">${ATTRS}<direction><sound tempo="88"/></direction>${note('C', 4, 4)}</measure>`;
    const score = parseMusicXml(file(measure, header));
    expect(score.title).toBe('Bài tập & ôn');
    expect(score.bpm).toBe(88);
  });

  it('số chỉ nhịp 3/4 giữ nguyên khi vẽ ra bản nhạc', () => {
    const attrs = '<attributes><divisions>1</divisions><time><beats>3</beats><beat-type>4</beat-type></time></attributes>';
    const score = parseMusicXml(file(`<measure number="1">${attrs}${note('C', 4)}${note('D', 4)}${note('E', 4)}</measure>`));
    expect(score.beatsPerBar).toBe(3);
    expect(toAbc(score)).toContain('M: 3/4');
  });

  it('chú thích trong file không làm hỏng phần đọc', () => {
    const measure = `<measure number="1">${ATTRS}<!-- ô nhịp đầu --> ${note('C', 4, 4)}</measure>`;
    expect(parseMusicXml(file(measure)).staves[0].events[0].midis).toEqual([60]);
  });

  it('file nén lọt vào tới bộ đọc thì nói rõ là file nén, không bảo "không phải MusicXML"', () => {
    expect(() => parseMusicXml('PKnén-zip')).toThrow(/file nén/);
  });

  it('file không phải MusicXML thì nói thẳng', () => {
    expect(() => parseMusicXml('<html><body>xin chào</body></html>')).toThrow(ImportedScoreError);
  });

  it('file không có nốt nào thì nói thẳng', () => {
    expect(() => parseMusicXml(file(`<measure number="1">${ATTRS}</measure>`))).toThrow(/không có nốt/);
  });
});
