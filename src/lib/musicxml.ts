import {
  ImportedScoreError,
  splitByHand,
  toEvents,
  type ImportedScore,
  type ImportedStaff,
  type TimedNote,
} from './imported-score';
import { keyFromFifths, type KeySignature } from './midi-notes';

/**
 * Đọc file MusicXML (`.musicxml`, `.xml`) thành bản nhạc nhập vào.
 *
 * **Vì sao MusicXML đứng cạnh MIDI:** MusicXML là bản NHẠC, không phải bản ghi
 * cách đánh — nó có sẵn khuông Sol/khuông Pha, có trường độ đúng từng hình nốt,
 * có sẵn hoá biểu, nên nhập vào không phải đoán gì cả. Mọi phần mềm soạn nhạc
 * đều xuất ra được. Đổi lại, file dạng này hiếm hơn `.mid` nhiều, nên app nhận
 * cả hai.
 *
 * **Vì sao tự đọc XML chứ không dùng thư viện:** phần đọc phải chạy được trong
 * `vitest` (`environment: 'node'`, không có `DOMParser`) và trong trình duyệt của
 * người học, mà chỉ cần đúng vài thẻ trong bảng dưới. Thêm một thư viện cho việc
 * đó là thêm một thứ phải theo dõi phiên bản — xem lý do ghim `abcjs 6.7.0` ở mục
 * 1 của `docs/_internal/nhat-ky-quyet-dinh.md`.
 *
 * **Chỉ đọc phần (part) ĐẦU TIÊN.** Bản nhạc piano xuất ra từ phần mềm soạn nhạc
 * là một part hai khuông, đúng thứ mình cần. File nhiều part là tổng phổ nhiều
 * nhạc cụ; ghép tất cả lại thành một khuông đàn piano là dựng ra một bản nhạc
 * không ai chơi được, nên thà lấy part đầu và nói rõ cho người học.
 */

/** Nửa cung của từng chữ cái, so với Đô cùng quãng tám. */
const STEP_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

interface XmlTag {
  name: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
  closing: boolean;
}

type XmlToken = { tag: XmlTag } | { text: string };

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
};

function decodeText(raw: string): string {
  return raw.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith('#')) return String.fromCodePoint(Number(body.slice(1)));
    return ENTITIES[body] ?? whole;
  });
}

const ATTR = /([\w:-]+)\s*=\s*"([^"]*)"|([\w:-]+)\s*=\s*'([^']*)'/g;

/**
 * Cắt chuỗi XML thành thẻ và chữ.
 *
 * Bỏ qua khai báo `<?xml?>`, chú thích, `<!DOCTYPE>` và `<![CDATA[]]>` — bốn thứ
 * duy nhất trong file MusicXML thật không phải thẻ thường. Không kiểm thẻ đóng có
 * khớp thẻ mở không: phần đọc bên dưới chỉ hỏi "đang ở trong thẻ nào", nên file
 * hỏng cùng lắm ra bản nhạc thiếu nốt chứ không làm treo trình duyệt.
 */
function tokenize(xml: string): XmlToken[] {
  const tokens: XmlToken[] = [];
  let at = 0;

  while (at < xml.length) {
    const open = xml.indexOf('<', at);
    if (open === -1) break;

    if (open > at) {
      const text = xml.slice(at, open);
      if (text.trim()) tokens.push({ text: decodeText(text) });
    }

    if (xml.startsWith('<!--', open)) {
      const end = xml.indexOf('-->', open);
      at = end === -1 ? xml.length : end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', open)) {
      const end = xml.indexOf(']]>', open);
      const body = xml.slice(open + 9, end === -1 ? xml.length : end);
      if (body.trim()) tokens.push({ text: body });
      at = end === -1 ? xml.length : end + 3;
      continue;
    }
    if (xml.startsWith('<?', open) || xml.startsWith('<!', open)) {
      const end = xml.indexOf('>', open);
      at = end === -1 ? xml.length : end + 1;
      continue;
    }

    const end = xml.indexOf('>', open);
    if (end === -1) break;
    const body = xml.slice(open + 1, end);
    const closing = body.startsWith('/');
    const selfClosing = body.endsWith('/');
    const inner = body.slice(closing ? 1 : 0, selfClosing ? -1 : undefined);
    const name = (/^[\w:-]+/.exec(inner)?.[0] ?? '').toLowerCase();

    const attrs: Record<string, string> = {};
    ATTR.lastIndex = 0;
    for (let m = ATTR.exec(inner); m !== null; m = ATTR.exec(inner)) {
      attrs[(m[1] ?? m[3]).toLowerCase()] = decodeText(m[2] ?? m[4]);
    }

    if (name) tokens.push({ tag: { name, attrs, selfClosing, closing } });
    at = end + 1;
  }

  return tokens;
}

/** Một thẻ cùng với chữ bên trong nó, đủ dùng cho những thẻ lá của MusicXML. */
interface Element {
  name: string;
  attrs: Record<string, string>;
  text: string;
  children: Element[];
}

/** Dựng cây từ chuỗi thẻ. Thẻ đóng thừa bị bỏ qua thay vì làm hỏng cả cây. */
function buildTree(tokens: XmlToken[]): Element {
  const root: Element = { name: '#root', attrs: {}, text: '', children: [] };
  const stack: Element[] = [root];

  for (const token of tokens) {
    const top = stack[stack.length - 1];
    if ('text' in token) {
      top.text += token.text;
      continue;
    }
    const { tag } = token;
    if (tag.closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const element: Element = { name: tag.name, attrs: tag.attrs, text: '', children: [] };
    top.children.push(element);
    if (!tag.selfClosing) stack.push(element);
  }

  return root;
}

function find(element: Element, name: string): Element | null {
  return element.children.find((c) => c.name === name) ?? null;
}

function findDeep(element: Element, name: string): Element | null {
  for (const child of element.children) {
    if (child.name === name) return child;
    const sau = findDeep(child, name);
    if (sau) return sau;
  }
  return null;
}

function numberIn(element: Element | null, name: string): number | null {
  const found = element ? find(element, name) : null;
  if (!found) return null;
  const n = Number(found.text.trim());
  return Number.isFinite(n) ? n : null;
}

/** Cao độ MIDI của một thẻ `<pitch>`, hoặc `null` nếu thẻ thiếu chữ cái nốt. */
function pitchToMidi(pitch: Element): number | null {
  const step = find(pitch, 'step')?.text.trim().toUpperCase() ?? '';
  const semitone = STEP_SEMITONE[step];
  const octave = numberIn(pitch, 'octave');
  if (semitone === undefined || octave === null) return null;
  const alter = Math.round(numberIn(pitch, 'alter') ?? 0);
  return (octave + 1) * 12 + semitone + alter;
}

function tieuDe(root: Element): string | null {
  const work = findDeep(root, 'work-title')?.text.trim();
  if (work) return work;
  const movement = findDeep(root, 'movement-title')?.text.trim();
  if (movement) return movement;
  const credit = findDeep(root, 'credit-words')?.text.trim();
  return credit || null;
}

/**
 * Đọc một part thành các nốt đã biết chỗ đứng, tách sẵn theo khuông.
 *
 * Ba thứ phải làm đúng, và cả ba đều là chỗ file thật khác với file mẫu trong
 * đầu:
 *
 * - **`<backup>`** — cách MusicXML quay con trỏ ngược lại để ghi khuông thứ hai
 *   của cùng ô nhịp. Bỏ qua nó là tay trái bị nối đuôi vào sau tay phải, và bản
 *   nhạc dài gấp đôi mà nghe như hai người đánh lần lượt.
 * - **`<chord/>`** — nốt này bấm cùng lúc với nốt ngay trước, con trỏ KHÔNG nhích.
 * - **`<tie type="stop">`** — nốt luyến sang ô sau là một nốt dài, không phải hai
 *   nốt. Cộng dồn vào nốt trước thay vì thêm một lần bấm nữa.
 */
function readPart(part: Element, divisionsBanDau: number): {
  notes: Map<string, TimedNote[]>;
  divisions: number;
  time: { beatsPerBar: number; beatUnit: number } | null;
  hoaBieu: KeySignature | null;
  bpm: number | null;
} {
  const notes = new Map<string, TimedNote[]>();
  let divisions = divisionsBanDau;
  let time: { beatsPerBar: number; beatUnit: number } | null = null;
  let hoaBieu: KeySignature | null = null;
  let bpm: number | null = null;

  let measureStart = 0;
  /*
   * Nốt vừa ghi của TỪNG khuông, giữ qua cả vạch nhịp: dấu luyến nối hai ô nhịp
   * là ca thường gặp nhất, nên quên nó sau mỗi ô là nốt dài nào cũng thành hai
   * lần bấm. Theo từng khuông vì tay phải và tay trái luyến độc lập nhau.
   */
  const lastNoteByStaff = new Map<string, TimedNote | null>();

  for (const measure of part.children.filter((c) => c.name === 'measure')) {
    let cursor = measureStart;
    let measureEnd = measureStart;
    let lastStart = measureStart;

    for (const node of measure.children) {
      if (node.name === 'attributes') {
        divisions = numberIn(node, 'divisions') ?? divisions;
        const timeTag = find(node, 'time');
        const beats = numberIn(timeTag, 'beats');
        const beatType = numberIn(timeTag, 'beat-type');
        if (beats && beatType) {
          time ??= { beatsPerBar: (beats * 4) / beatType, beatUnit: beatType };
        }
        /*
         * Chỉ lấy hoá biểu KHAI ĐẦU TIÊN. Bài chuyển giọng giữa chừng thì hoá biểu
         * sau vẫn hiện thành dấu hoá cạnh nốt, đọc được; ghi đè theo thẻ cuối cùng
         * mới là hỏng, vì cả bản nhạc sẽ mang hoá biểu của mấy ô nhịp cuối.
         */
        const fifths = numberIn(find(node, 'key'), 'fifths');
        if (fifths !== null) hoaBieu ??= keyFromFifths(Math.round(fifths));
        continue;
      }

      if (node.name === 'direction') {
        const sound = findDeep(node, 'sound');
        const tempo = Number(sound?.attrs.tempo ?? '');
        if (Number.isFinite(tempo) && tempo > 0) bpm ??= Math.round(tempo);
        continue;
      }

      if (node.name === 'sound') {
        const tempo = Number(node.attrs.tempo ?? '');
        if (Number.isFinite(tempo) && tempo > 0) bpm ??= Math.round(tempo);
        continue;
      }

      if (node.name === 'backup' || node.name === 'forward') {
        const duration = numberIn(node, 'duration') ?? 0;
        cursor += node.name === 'backup' ? -duration : duration;
        cursor = Math.max(measureStart, cursor);
        continue;
      }

      if (node.name !== 'note') continue;

      // Nốt hoa mỹ không có trường độ: giữ lại là con trỏ lệch, mà bỏ đi thì chỉ
      // mất một nốt trang trí.
      if (find(node, 'grace')) continue;

      const duration = numberIn(node, 'duration') ?? 0;
      const isChord = Boolean(find(node, 'chord'));
      const staff = find(node, 'staff')?.text.trim() || '1';
      const start = isChord ? lastStart : cursor;

      const pitch = find(node, 'pitch');
      const midi = pitch ? pitchToMidi(pitch) : null;

      if (midi !== null) {
        const tieStop = node.children.some((c) => c.name === 'tie' && c.attrs.type === 'stop');
        const truoc = lastNoteByStaff.get(staff) ?? null;
        if (tieStop && truoc !== null && truoc.midi === midi) {
          truoc.beats += duration / divisions;
        } else {
          const note: TimedNote = { midi, start: start / divisions, beats: duration / divisions };
          const cho = notes.get(staff) ?? [];
          cho.push(note);
          notes.set(staff, cho);
          lastNoteByStaff.set(staff, note);
        }
      } else {
        // Dấu lặng: không ghi gì cả, khoảng trống tự thành dấu lặng khi xếp sự
        // kiện. Ghi lại thành nốt rỗng là có hai nguồn sự thật cho cùng một chỗ.
        lastNoteByStaff.set(staff, null);
      }

      if (!isChord) {
        lastStart = cursor;
        cursor += duration;
      }
      measureEnd = Math.max(measureEnd, cursor);
    }

    measureStart = Math.max(measureEnd, measureStart + 1);
  }

  return { notes, divisions, time, hoaBieu, bpm };
}

/**
 * Đường dẫn bản nhạc chính ghi trong `META-INF/container.xml` của file `.mxl`.
 *
 * Để ở đây để dùng chung bộ đọc XML với phần đọc bản nhạc, thay vì viết thêm một
 * biểu thức chính quy đọc thuộc tính thứ hai (quy tắc 1 của code-standards). Theo
 * chuẩn MusicXML, `rootfile` ĐẦU TIÊN là bản nhạc; các `rootfile` sau nếu có là bản
 * PDF hay ảnh đi kèm.
 */
export function rootfilePath(containerXml: string): string | null {
  const rootfile = findDeep(buildTree(tokenize(containerXml)), 'rootfile');
  const path = rootfile?.attrs['full-path']?.trim();
  return path || null;
}

export function parseMusicXml(xml: string): ImportedScore {
  // `import-sheet.ts` đã giải nén `.mxl` trước khi gọi tới đây, nên còn gặp `PK` là
  // file nén lồng trong file nén — nói thẳng thay vì báo "không phải MusicXML".
  if (xml.startsWith('PK')) {
    throw new ImportedScoreError(
      'Bên trong file này lại là một file nén khác, app không đọc được. Xuất lại ra .musicxml từ phần mềm soạn nhạc rồi nhập file đó.',
    );
  }

  const root = buildTree(tokenize(xml));
  const score = findDeep(root, 'score-partwise');
  if (!score) {
    if (findDeep(root, 'score-timewise')) {
      throw new ImportedScoreError(
        'File MusicXML này viết theo kiểu score-timewise, app chưa đọc được. Mở bằng phần mềm soạn nhạc rồi xuất lại là ra kiểu thường dùng.',
      );
    }
    throw new ImportedScoreError('Đây không phải file MusicXML.');
  }

  const part = score.children.find((c) => c.name === 'part');
  if (!part) {
    throw new ImportedScoreError('File MusicXML này không có phần nhạc nào.');
  }

  const { notes, time, hoaBieu, bpm } = readPart(part, 1);
  if (notes.size === 0) {
    throw new ImportedScoreError('File MusicXML này không có nốt nhạc nào.');
  }

  /*
   * Khuông lấy thẳng từ thẻ `<staff>` khi file có khai — đó là chỗ MusicXML hơn
   * hẳn MIDI, không phải đoán theo cao độ. File một khuông (bài một tay, hoặc
   * phần mềm không ghi `<staff>`) thì mới tách theo Đô giữa.
   */
  const keys = [...notes.keys()].sort();
  if (keys.length === 1) {
    return {
      title: tieuDe(root) ?? 'Bản nhạc của tôi',
      beatsPerBar: time?.beatsPerBar ?? 4,
      beatUnit: time?.beatUnit ?? 4,
      staves: splitByHand(toEvents(notes.get(keys[0]) ?? [])),
      key: hoaBieu,
      bpm,
    };
  }

  const staves: ImportedStaff[] = keys.slice(0, 2).map((key, i) => ({
    clef: i === 0 ? 'treble' : 'bass',
    events: toEvents(notes.get(key) ?? []),
  }));

  return {
    title: tieuDe(root) ?? 'Bản nhạc của tôi',
    beatsPerBar: time?.beatsPerBar ?? 4,
    beatUnit: time?.beatUnit ?? 4,
    staves,
    key: hoaBieu,
    bpm,
  };
}
