import { noteAt } from './midi-notes';

/**
 * Bản nhạc **nhập từ ngoài vào**, ở dạng trung gian giữa file gốc và chuỗi ABC.
 *
 * Vì sao có lớp trung gian này thay vì đổi thẳng file sang ABC: file MIDI và file
 * MusicXML khác nhau hoàn toàn ở chỗ đọc (một bên là byte, một bên là chữ) nhưng
 * giống hệt nhau ở chỗ ghi ra. Gộp hai việc vào một hàm là chép cùng một đoạn ghi
 * ABC hai lần — đúng cách repo này từng sinh ra bốn bản sao kho lựa chọn. Nay
 * `midi-file.ts` và `musicxml.ts` mỗi bên chỉ lo đọc, còn `toAbc` ở đây là **cửa
 * duy nhất** ghi ra ABC.
 *
 * Mọi độ dài trong file này tính bằng **phách nốt đen** (nốt đen = 1, trắng = 2,
 * móc đơn = 0,5), không tính bằng tick của MIDI hay `divisions` của MusicXML —
 * hai đơn vị đó là chuyện riêng của từng định dạng và không được rò ra ngoài.
 */

export class ImportedScoreError extends Error {}

/**
 * Một khoảnh khắc trên khuông: không nốt nào (dấu lặng), một nốt, hoặc một chồng
 * nốt bấm cùng lúc.
 */
export interface ImportedEvent {
  midis: number[];
  beats: number;
}

export interface ImportedStaff {
  clef: 'treble' | 'bass';
  events: ImportedEvent[];
}

export interface ImportedScore {
  title: string;
  /** Số phách mỗi ô nhịp, từ số chỉ nhịp của file. */
  beatsPerBar: number;
  /** Mẫu số của số chỉ nhịp (4 = nốt đen). Chỉ dùng để ghi dòng `M:`. */
  beatUnit: number;
  /** Một khuông (một tay) hoặc hai khuông (Sol trên, Pha dưới). */
  staves: ImportedStaff[];
  /** Nhịp mỗi phút nếu file có khai, `null` thì để abcjs tự chọn. */
  bpm: number | null;
}

/**
 * Lưới làm tròn: nốt móc kép.
 *
 * Vì sao phải làm tròn: file MIDI ghi thời điểm bấm phím của người thật nên gần
 * như không nốt nào dài đúng một phách chẵn. Không làm tròn thì mỗi nốt ra một
 * phân số riêng và bản nhạc vẽ ra là một rừng nốt móc tam có chấm — đọc không
 * nổi. Dừng ở móc kép chứ không mịn hơn: mịn hơn thì giữ được đúng cái vụn vặt
 * mà mình đang muốn bỏ đi.
 */
export const GRID = 0.25;

/** Bài dài quá thì chặn ngay lúc nhập, xem `user-sheets.ts`. */
export const MAX_BARS = 400;

export function quantize(beats: number): number {
  return Math.max(GRID, Math.round(beats / GRID) * GRID);
}

/**
 * Độ dài viết theo `L: 1/4`: nốt đen là chuỗi rỗng, trắng là `2`, móc đơn là `/2`.
 *
 * Rút gọn phân số trước khi ghi, vì `2/4` abcjs vẫn đọc được nhưng người mở bản
 * nhạc ra sửa thì thấy ngay là máy ghi ẩu.
 */
export function abcLength(beats: number): string {
  const quarters = quantize(beats);
  let numerator = Math.round(quarters / GRID);
  let denominator = Math.round(1 / GRID);
  while (numerator % 2 === 0 && denominator % 2 === 0) {
    numerator /= 2;
    denominator /= 2;
  }
  if (denominator === 1) return numerator === 1 ? '' : String(numerator);
  return numerator === 1 ? `/${denominator}` : `${numerator}/${denominator}`;
}

/** Một sự kiện thành chữ ABC, chưa kèm độ dài. */
function abcPitches(event: ImportedEvent): string {
  if (event.midis.length === 0) return 'z';
  // Dùng lại bộ đổi nốt của bài luyện nhận nốt: dấu hoá và dấu quãng tám đã có
  // test ở đó, mà đó đúng là hai chỗ sai thì bản nhạc vẽ ra sai không ai báo.
  const spelled = event.midis.map((midi) => noteAt(midi).abc);
  return spelled.length === 1 ? spelled[0] : `[${spelled.join('')}]`;
}

/**
 * Cắt chuỗi sự kiện thành từng ô nhịp đủ phách.
 *
 * Nốt vắt qua vạch nhịp bị **cắt đôi và nối bằng dấu luyến** (`C4-` rồi `C2` ở ô
 * sau) chứ không để nguyên: để nguyên thì abcjs vẫn vẽ, nhưng nó tự dồn vạch nhịp
 * theo cách khác và từ chỗ đó trở đi số ô nhịp trên màn hình lệch với bản gốc —
 * mà con trỏ *Tập bài này với đàn* lại đếm theo sự kiện, nên người học thấy máy
 * chờ ở một chỗ mà mắt họ đang đọc chỗ khác.
 */
export function toBars(events: ImportedEvent[], beatsPerBar: number): string[][] {
  const bars: string[][] = [];
  let bar: string[] = [];
  let filled = 0;

  for (const event of events) {
    let left = quantize(event.beats);
    while (left > 0) {
      const room = beatsPerBar - filled;
      const take = Math.min(left, room);
      const tied = take < left && event.midis.length > 0;
      bar.push(`${abcPitches(event)}${abcLength(take)}${tied ? '-' : ''}`);
      filled += take;
      left -= take;
      if (filled >= beatsPerBar - 1e-9) {
        bars.push(bar);
        bar = [];
        filled = 0;
      }
    }
  }

  // Ô cuối thiếu phách thì bù dấu lặng: thiếu phách là abcjs vẽ vạch nhịp cuối
  // vào giữa chừng, trông như bản nhạc bị cụt.
  if (bar.length > 0) {
    const thieu = beatsPerBar - filled;
    if (thieu > 1e-9) bar.push(`z${abcLength(thieu)}`);
    bars.push(bar);
  }

  return bars;
}

/** Mỗi dòng nhạc bốn ô nhịp: đọc trên điện thoại đặt ở giá nhạc thì vừa mắt. */
const BARS_PER_LINE = 4;

function barsToLines(bars: string[][]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < bars.length; i += BARS_PER_LINE) {
    lines.push(bars.slice(i, i + BARS_PER_LINE).map((b) => b.join(' ')).join(' | '));
  }
  return lines;
}

/**
 * Ghi ra chuỗi ABC hoàn chỉnh — thứ mà `SheetViewer` vẽ, phát tiếng và tập được
 * với đàn thật.
 *
 * Luôn ghi `K: C`: file nhập vào có thể ở giọng bất kỳ, nhưng `noteAt` đã viết
 * sẵn dấu hoá cạnh từng nốt nên bản nhạc vẫn kêu đúng. Đoán hoá biểu rồi đoán sai
 * là mọi nốt sau đó lệch nửa cung mà nhìn vẫn hợp lý — thà nhiều dấu hoá còn hơn
 * sai cao độ.
 */
export function toAbc(score: ImportedScore): string {
  if (score.staves.length === 0) {
    throw new ImportedScoreError('File này không có nốt nhạc nào đọc được.');
  }

  const staffBars = score.staves.map((s) => toBars(s.events, score.beatsPerBar));
  const soO = Math.max(...staffBars.map((b) => b.length));
  if (soO === 0) {
    throw new ImportedScoreError('File này không có nốt nhạc nào đọc được.');
  }
  if (soO > MAX_BARS) {
    throw new ImportedScoreError(
      `Bản nhạc này dài ${soO} ô nhịp, quá mức ${MAX_BARS} ô mà app nhận. Cắt bớt rồi nhập lại.`,
    );
  }

  // Hai khuông phải bằng số ô nhịp, nếu không abcjs xếp vạch nhịp của tay phải
  // lệch với tay trái và không ai nhìn ra hai tay đánh cùng lúc chỗ nào.
  const oLang = [`z${abcLength(score.beatsPerBar)}`];
  const deu = staffBars.map((bars) => {
    const bu = Array.from({ length: soO - bars.length }, () => oLang);
    return [...bars, ...bu];
  });

  const dau = [
    'X: 1',
    `T: ${score.title.replace(/[\r\n]+/g, ' ').trim() || 'Bản nhạc của tôi'}`,
    `M: ${score.beatsPerBar * (score.beatUnit / 4)}/${score.beatUnit}`,
    'L: 1/4',
    ...(score.bpm ? [`Q: 1/4=${score.bpm}`] : []),
  ];

  if (deu.length === 1) {
    return [
      ...dau,
      'K: C',
      ...(score.staves[0].clef === 'bass' ? ['V:1 clef=bass'] : []),
      ...barsToLines(deu[0]).map((line, i, all) => (i === all.length - 1 ? `${line} |]` : `${line} |`)),
    ].join('\n');
  }

  const [tren, duoi] = deu;
  const lineTren = barsToLines(tren);
  const lineDuoi = barsToLines(duoi);

  return [
    ...dau,
    '%%score { 1 | 2 }',
    'K: C',
    `V:1 clef=${score.staves[0].clef}`,
    `V:2 clef=${score.staves[1].clef}`,
    ...lineTren.flatMap((line, i) => {
      const cuoi = i === lineTren.length - 1;
      return [
        `[V:1] ${line} ${cuoi ? '|]' : '|'}`,
        `[V:2] ${lineDuoi[i]} ${cuoi ? '|]' : '|'}`,
      ];
    }),
  ].join('\n');
}

/**
 * Một nốt đã biết chỗ đứng trên dòng thời gian, tính bằng phách nốt đen.
 *
 * Đây là dạng chung mà cả file MIDI lẫn file MusicXML đều quy về trước khi xếp
 * thành sự kiện: bên MIDI đổi từ tick, bên MusicXML đổi từ `divisions`.
 */
export interface TimedNote {
  midi: number;
  start: number;
  beats: number;
}

/**
 * Xếp các nốt trên dòng thời gian thành chuỗi sự kiện để viết ra khuông nhạc:
 * bấm cùng lúc thì thành một chồng nốt, có khoảng trống thì thành dấu lặng.
 *
 * "Cùng lúc" nghĩa là **cùng ô lưới móc kép** sau khi làm tròn, không phải cùng
 * mili giây: người thật không bao giờ bấm hai tay đúng một thời điểm — cùng lý do
 * khiến `groupPlayedNotes` trong `score-compare.ts` phải gom, chỉ khác là ở đó gom
 * theo mili giây còn ở đây gom theo phách.
 */
export function toEvents(notes: TimedNote[]): ImportedEvent[] {
  const xep = notes
    .map((n) => ({
      midi: n.midi,
      start: Math.round(n.start / GRID) * GRID,
      dai: quantize(n.beats),
    }))
    .sort((a, b) => a.start - b.start || a.midi - b.midi);

  const events: ImportedEvent[] = [];
  let at = 0;

  for (let i = 0; i < xep.length; ) {
    const start = xep[i].start;
    const chord: number[] = [];
    let dai = 0;
    while (i < xep.length && xep[i].start === start) {
      chord.push(xep[i].midi);
      dai = Math.max(dai, xep[i].dai);
      i += 1;
    }

    if (start > at + 1e-9) events.push({ midis: [], beats: quantize(start - at) });

    /*
     * Nốt bị cắt ngắn lại nếu nốt sau đã bắt đầu: mỗi khuông chỉ có MỘT dòng thời
     * gian, nên hai nốt chồng thời gian mà không cùng lúc bấm thì không viết ra
     * được. Giữ nguyên độ dài thật thì tổng số phách vượt ô nhịp và mọi vạch nhịp
     * từ đó trở đi lệch hết.
     */
    const sau = i < xep.length ? xep[i].start : null;
    const cat = sau === null ? dai : Math.min(dai, Math.max(GRID, sau - start));
    events.push({ midis: [...new Set(chord)].sort((a, b) => a - b), beats: cat });
    at = start + cat;
  }

  return events;
}

/**
 * Tách một chuỗi nốt thành hai khuông theo cao độ.
 *
 * Ranh giới ở Đô giữa vì đó là chỗ giáo trình này đặt hai tay ngay từ Chương 1
 * (tay phải Đô4-Sol4, tay trái Đô3-Sol3). Dùng cho file MIDI, nơi không có thông
 * tin khuông nào ra khuông nào; MusicXML có sẵn thẻ `<staff>` nên không cần đoán.
 */
export const SPLIT_MIDI = 60;

export function splitByHand(events: ImportedEvent[]): ImportedStaff[] {
  const tren: ImportedEvent[] = [];
  const duoi: ImportedEvent[] = [];

  for (const event of events) {
    const cao = event.midis.filter((m) => m >= SPLIT_MIDI);
    const thap = event.midis.filter((m) => m < SPLIT_MIDI);
    tren.push({ midis: cao, beats: event.beats });
    duoi.push({ midis: thap, beats: event.beats });
  }

  // Cả bài nằm gọn một bên thì trả về MỘT khuông: dựng khuông đôi với một khuông
  // toàn dấu lặng là bắt người học đọc một nửa trang giấy trống.
  if (duoi.every((e) => e.midis.length === 0)) return [{ clef: 'treble', events: tren }];
  if (tren.every((e) => e.midis.length === 0)) return [{ clef: 'bass', events: duoi }];

  return [
    { clef: 'treble', events: tren },
    { clef: 'bass', events: duoi },
  ];
}
