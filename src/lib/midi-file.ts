import {
  ImportedScoreError,
  splitByHand,
  toEvents,
  type ImportedScore,
} from './imported-score';

/**
 * Đọc file MIDI (`.mid`) thành bản nhạc nhập vào.
 *
 * **Vì sao nhận MIDI chứ không chỉ MusicXML:** người học Việt Nam tìm được file
 * `.mid` của gần như mọi bài, còn file MusicXML thì hiếm hơn nhiều. Đổi lại, MIDI
 * là bản GHI CÁCH ĐÁNH chứ không phải bản nhạc: nó không có hoá biểu, không có
 * khuông Sol/khuông Pha, và độ dài từng nốt là thời gian ngón tay thật giữ phím.
 * Ba chỗ đó phải đoán, và chỗ nào đoán thì ghi rõ ở đây:
 *
 * - **Hoá biểu** — không đoán, luôn ghi `K: C` rồi viết dấu hoá cạnh từng nốt.
 * - **Hai tay** — tách theo Đô giữa (`splitByHand`), đúng chỗ giáo trình này đặt
 *   hai tay từ Chương 1. Kênh MIDI và số track KHÔNG dùng để tách: nhiều file
 *   xuất ra từ đàn điện chỉ có một track cho cả hai tay, nên luật theo track lúc
 *   đúng lúc sai, mà sai kiểu đó thì bản nhạc trông vẫn bình thường.
 * - **Trường độ** — làm tròn về móc kép (`quantize`).
 *
 * Người học phải biết ba điều này, nên trang nhập nói thẳng ra chứ không giấu.
 *
 * Đọc thuần từ `Uint8Array`, không chạm `window`: nhờ vậy chạy được cả trong
 * trình duyệt (nơi thật sự đọc file) lẫn trong vitest.
 */

/** Một nốt đã ghép xong hai đầu bấm–nhả, tính bằng tick của file. */
interface RawNote {
  midi: number;
  start: number;
  end: number;
}

class Reader {
  private at = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get offset(): number {
    return this.at;
  }

  get done(): boolean {
    return this.at >= this.bytes.length;
  }

  /** Mọi lần đọc đều qua đây, nên file cụt thì báo một câu chứ không ném RangeError. */
  private need(n: number): void {
    if (this.at + n > this.bytes.length) {
      throw new ImportedScoreError('File MIDI này bị cắt dở hoặc không đúng định dạng.');
    }
  }

  u8(): number {
    this.need(1);
    return this.bytes[this.at++];
  }

  peek(): number {
    this.need(1);
    return this.bytes[this.at];
  }

  u16(): number {
    return (this.u8() << 8) | this.u8();
  }

  u32(): number {
    return ((this.u8() << 24) >>> 0) + (this.u8() << 16) + (this.u8() << 8) + this.u8();
  }

  text(n: number): string {
    this.need(n);
    let out = '';
    for (let i = 0; i < n; i += 1) out += String.fromCharCode(this.bytes[this.at + i]);
    this.at += n;
    return out;
  }

  skip(n: number): void {
    this.need(n);
    this.at += n;
  }

  /** Số nguyên độ dài thay đổi — cách MIDI ghi mọi khoảng thời gian chờ. */
  varint(): number {
    let value = 0;
    for (let i = 0; i < 4; i += 1) {
      const byte = this.u8();
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new ImportedScoreError('File MIDI này bị cắt dở hoặc không đúng định dạng.');
  }
}

interface TrackResult {
  notes: RawNote[];
  name: string | null;
  usPerQuarter: number | null;
  timeSignature: { beatsPerBar: number; beatUnit: number } | null;
}

function readTrack(reader: Reader, length: number): TrackResult {
  const end = reader.offset + length;
  const notes: RawNote[] = [];
  /** Phím đang giữ: một phím bấm lại khi chưa nhả thì nốt cũ chốt tại đó. */
  const dangGiu = new Map<number, number>();
  const result: TrackResult = { notes, name: null, usPerQuarter: null, timeSignature: null };

  let tick = 0;
  let running = 0;

  while (reader.offset < end && !reader.done) {
    tick += reader.varint();

    let status = reader.peek();
    if (status & 0x80) {
      reader.u8();
      running = status;
    } else {
      // Trạng thái chạy tiếp: nhiều file bỏ hẳn byte lệnh khi lệnh lặp lại.
      status = running;
      if (!(status & 0x80)) {
        throw new ImportedScoreError('File MIDI này không đúng định dạng.');
      }
    }

    if (status === 0xff) {
      const type = reader.u8();
      const len = reader.varint();
      if (type === 0x03 && result.name === null) {
        result.name = reader.text(len).trim() || null;
      } else if (type === 0x51 && len === 3) {
        result.usPerQuarter = (reader.u8() << 16) | (reader.u8() << 8) | reader.u8();
      } else if (type === 0x58 && len >= 2) {
        const nn = reader.u8();
        const dd = reader.u8();
        reader.skip(len - 2);
        const unit = 2 ** dd;
        if (nn > 0 && unit > 0) {
          result.timeSignature = { beatsPerBar: (nn * 4) / unit, beatUnit: unit };
        }
      } else {
        reader.skip(len);
      }
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      reader.skip(reader.varint());
      continue;
    }

    const command = status & 0xf0;
    if (command === 0x90 || command === 0x80) {
      const midi = reader.u8();
      const velocity = reader.u8();
      const bam = command === 0x90 && velocity > 0;
      const batDau = dangGiu.get(midi);
      if (batDau !== undefined) {
        if (tick > batDau) notes.push({ midi, start: batDau, end: tick });
        dangGiu.delete(midi);
      }
      if (bam) dangGiu.set(midi, tick);
    } else if (command === 0xc0 || command === 0xd0) {
      reader.skip(1);
    } else {
      reader.skip(2);
    }
  }

  // Nốt chưa thấy lệnh nhả (file cắt dở, hoặc đàn ngắt điện lúc đang giữ): cho nó
  // dài một phách rồi thôi. Bỏ hẳn thì bản nhạc thiếu đúng nốt cuối, mà nốt cuối
  // là chỗ người học nghe ra "hết bài".
  for (const [midi, start] of dangGiu) notes.push({ midi, start, end: start + 1 });

  return result;
}

export function parseMidiFile(bytes: Uint8Array): ImportedScore {
  const reader = new Reader(bytes);

  if (reader.text(4) !== 'MThd') {
    throw new ImportedScoreError('Đây không phải file MIDI (.mid).');
  }
  const headerLength = reader.u32();
  reader.u16(); // format 0/1/2 — không dùng: cách đọc track giống nhau cả ba
  const trackCount = reader.u16();
  const division = reader.u16();
  reader.skip(Math.max(0, headerLength - 6));

  if (division & 0x8000) {
    throw new ImportedScoreError(
      'File MIDI này ghi thời gian theo khung hình (SMPTE), app chưa đọc được. Thử xuất lại từ phần mềm soạn nhạc.',
    );
  }
  const ticksPerQuarter = division;
  if (ticksPerQuarter <= 0) {
    throw new ImportedScoreError('File MIDI này không đúng định dạng.');
  }

  const notes: RawNote[] = [];
  let title: string | null = null;
  let usPerQuarter: number | null = null;
  let timeSignature: { beatsPerBar: number; beatUnit: number } | null = null;

  for (let i = 0; i < trackCount && !reader.done; i += 1) {
    const kind = reader.text(4);
    const length = reader.u32();
    if (kind !== 'MTrk') {
      reader.skip(length);
      continue;
    }
    const track = readTrack(reader, length);
    notes.push(...track.notes);
    title ??= track.name;
    usPerQuarter ??= track.usPerQuarter;
    timeSignature ??= track.timeSignature;
  }

  if (notes.length === 0) {
    throw new ImportedScoreError('File MIDI này không có nốt nào — có thể nó chỉ chứa tiếng trống hoặc rỗng.');
  }

  const staves = splitByHand(toEvents(notes.map((n) => ({
    midi: n.midi,
    start: n.start / ticksPerQuarter,
    beats: (n.end - n.start) / ticksPerQuarter,
  }))));

  return {
    title: title ?? 'Bản nhạc của tôi',
    beatsPerBar: timeSignature?.beatsPerBar ?? 4,
    beatUnit: timeSignature?.beatUnit ?? 4,
    staves,
    bpm: usPerQuarter ? Math.round(60_000_000 / usPerQuarter) : null,
  };
}
