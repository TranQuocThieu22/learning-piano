/**
 * Soi toàn bộ giáo trình bằng chính parser abcjs mà ứng dụng dùng để vẽ nhạc.
 *
 *   node scripts/check-lessons.mjs
 *   node scripts/check-lessons.mjs --quiet   # chỉ in lỗi và lưu ý
 *
 * Bắt những lỗi mắt người dễ bỏ sót nhưng người học gặp ngay:
 *   - ô nhịp cộng không đủ hoặc thừa phách
 *   - hai bè Grand Staff lệch số ô nhịp
 *   - nốt nằm ngoài thế tay 5 ngón đã dạy
 *   - tên file / tiêu đề sai mẫu, khiến bài bị loại khỏi trang Nhật ký
 *
 * Dùng cùng parser với ứng dụng, nên thứ script này chấp nhận là thứ trình duyệt vẽ được.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import abcjs from 'abcjs';

const EXERCISE_DIR = 'docs/03-exercises';
const CHAPTER_DIR = 'docs/02-chapters';
const FILE_PATTERN = /^chuong-(\d+)-bai-(\d+)\.md$/;
const TITLE_PATTERN = /^#\s+Chương\s+(\d+)\s+-\s+Bài\s+(\d+):\s+.+/;

/**
 * pitch của abcjs: 0 = Đô giữa (C4), mỗi bậc diatonic là 1.
 *
 * Tầm nốt cho phép nới ra ở Chương 6 — đó đúng là chương dạy luồn ngón cái và
 * vắt ngón để đi quá thế tay 5 ngón. Trước đó, một nốt ngoài tầm gần như luôn
 * là lỗi soạn bài; từ Chương 6 trở đi, cả quãng tám Đô-Đô là hợp lệ.
 */
const RANGE_5_FINGER = { rhLow: 0, rhHigh: 4, lhLow: -7, lhHigh: -3 };  // C4..G4 và C3..G3
const RANGE_OCTAVE   = { rhLow: 0, rhHigh: 7, lhLow: -7, lhHigh: 0 };   // C4..C5 và C3..C4
/**
 * Giai đoạn 2: tay trái bấm hợp âm nên phải với lên quá Đô giữa — hợp âm Sol
 * (Sol-Si-Rê) chạm tới nốt Rê, hợp âm La thứ (La-Đô-Mi) chạm tới nốt Mi.
 */
const RANGE_CHORDS   = { rhLow: 0, rhHigh: 7, lhLow: -7, lhHigh: 2 };   // C4..C5 và C3..E4

const FIRST_OCTAVE_CHAPTER = 6;
const FIRST_CHORD_CHAPTER = 7;

const rangeForChapter = (chapter) => {
  if (chapter >= FIRST_CHORD_CHAPTER) return RANGE_CHORDS;
  if (chapter >= FIRST_OCTAVE_CHAPTER) return RANGE_OCTAVE;
  return RANGE_5_FINGER;
};

/**
 * Cụm từ tiếng Việt bị mất dấu. Dò theo CỤM chứ không theo từ đơn, vì từ đơn hay
 * đụng tiếng Anh ("am", "so", "day", "chat"...). Nhờ vậy tên bài hát tiếng Anh
 * như "Jingle Bells" không bị báo nhầm là thiếu dấu.
 */
const MISSING_DIACRITICS = [
  'Bai tap', 'Gia su', 'Khoa Sol', 'Khoa Pha', 'Cac not', 'quang tam',
  'phim den', 'Giai dieu', 'Cam nhan', 'So sanh', 'Ket hop', 'Thang am',
  'Mau sac', 'Tay trai', 'Tay phai', 'Khoi dong', 'Luyen tap', 'Buoc nhay',
  'Ban day du', 'Ban trinh dien',
];

/**
 * Khuôn "ít chữ, tập liên tục" (chốt 14/09/2026, lý do ở nhat-ky-quyet-dinh.md).
 *
 * Chủ sản phẩm chốt: chữ trong bài chỉ để dẫn vào việc tập, còn phần chính là bản
 * nhạc, hình và công cụ thực hành. Trước khi chốt, bài tập đo được khoảng 70% là
 * chữ. Luật trên giấy thì trôi dần mỗi lần soạn bài mới, nên gác bằng máy.
 *
 * Từ 14/09/2026 cả 25 bài đã theo khuôn này, nên **mọi bài tập đều phải có** mục
 * cuối bài *Tập thấy khó? Đọc ở đây* — thiếu là lỗi, không phải được miễn. Trước
 * đó luật chỉ áp cho bài có tiêu đề ấy, để Chương 3-7 chưa viết lại không đỏ oan.
 *
 * Các ngưỡng đặt ngay trên bài dài nhất của Chương 1-2 lúc chốt, tính bằng ký tự
 * chữ (không tính bản nhạc, hình, dòng trống):
 *   - đoạn mở bài 450 — Chương 2 - Bài 1 là 420;
 *   - chữ dẫn của một phần tập 350 — "Đặt tay lên phím" ở Chương 1 - Bài 1 là 336;
 *   - một đoạn trong mục cuối bài 300 — dài nhất là 272.
 * Vượt ngưỡng thì cắt chữ hoặc đổi thành hình, đừng nâng ngưỡng cho vừa.
 */
const READ_MORE_HEADING = '## Tập thấy khó? Đọc ở đây';
const MAX_INTRO_CHARS = 450;
const MAX_CUE_CHARS = 350;
const MAX_READ_MORE_PARAGRAPH_CHARS = 300;
/** Thứ người học nhìn vào để tập: bản nhạc, hình bàn phím, ảnh, bản nhạc nhúng từ bài khác. */
const VISUAL = /^(```abc|```keys|!\[|\{\{sheet:)/;

function checkPracticeFirst(file, text) {
  if (!text.includes(READ_MORE_HEADING)) {
    err(file, `thiếu mục "${READ_MORE_HEADING.slice(3)}" — bài tập phải theo khuôn tập trước, xem skill daily-practice-structure`);
    return;
  }
  const lines = text.split(/\r?\n/);
  const isProse = (l) => l.trim() !== '' && !VISUAL.test(l) && !l.startsWith('```');

  const firstH2 = lines.findIndex((l, i) => i > 0 && l.startsWith('## '));
  const intro = lines.slice(1, firstH2).filter(isProse).join(' ').trim();
  if (intro.length > MAX_INTRO_CHARS)
    err(file, `đoạn mở bài dài ${intro.length} ký tự (tối đa ${MAX_INTRO_CHARS}) — cắt bớt, phần giải thích dời xuống mục cuối bài`);

  const readMoreAt = lines.indexOf(READ_MORE_HEADING);
  for (let i = firstH2; i < readMoreAt; i++) {
    const heading = lines[i];
    if (!heading.startsWith('## ') || heading === '## Xong bài khi') continue;
    let end = i + 1;
    while (end < lines.length && !lines[end].startsWith('## ') && lines[end] !== '---') end++;
    const section = lines.slice(i + 1, end);

    let inFence = false;
    const cue = section.filter((l) => {
      if (l.startsWith('```')) { inFence = !inFence; return false; }
      return !inFence && isProse(l);
    }).join(' ').trim();
    if (cue.length > MAX_CUE_CHARS)
      err(file, `"${heading.slice(3, 50)}" có ${cue.length} ký tự chữ (tối đa ${MAX_CUE_CHARS}) — một hai dòng dẫn là đủ, còn lại đổi thành hình hoặc dời xuống mục cuối bài`);

    if (heading.startsWith('## Bài tập ') && !section.some((l) => VISUAL.test(l)))
      err(file, `"${heading.slice(3, 50)}" không có bản nhạc hay hình nào — bài tập phải có thứ để nhìn vào mà tập`);
    i = end - 1;
  }

  // Bỏ khối nhạc và hình trước khi đo: chúng là thứ để nhìn, không phải chữ phải đọc.
  const readMoreText = lines.slice(readMoreAt + 1).join('\n')
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/^!\[.*$/gm, '');
  const paragraphs = readMoreText.split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (p.length > MAX_READ_MORE_PARAGRAPH_CHARS)
      err(file, `mục cuối bài có đoạn dài ${p.length} ký tự (tối đa ${MAX_READ_MORE_PARAGRAPH_CHARS}): "${p.slice(0, 50)}…"`);
  }
}

const quiet = process.argv.includes('--quiet');
let errors = 0, warnings = 0;

const err  = (f, m) => { errors++;   console.log(`  LỖI   ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`  Lưu ý ${f}: ${m}`); };

function extractAbcBlocks(md) {
  const blocks = [];
  const re = /```abc\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) blocks.push(m[1]);
  return blocks;
}

/** Gom phần tử của cùng một khuông nhạc qua mọi dòng nhạc. */
function collectStaves(tune) {
  const staves = [];
  for (const line of tune.lines ?? []) {
    if (!line.staff) continue;
    line.staff.forEach((staff, i) => {
      staves[i] ??= [];
      for (const voice of staff.voices ?? []) staves[i].push(...voice);
    });
  }
  return staves;
}

/** Cắt thành từng ô nhịp, trả về tổng trường độ mỗi ô. */
function splitBars(elements) {
  const bars = [];
  let total = 0, sawNote = false;
  for (const el of elements) {
    if (el.el_type === 'note') { total += el.duration ?? 0; sawNote = true; }
    else if (el.el_type === 'bar') { if (sawNote) bars.push(total); total = 0; sawNote = false; }
  }
  if (sawNote) bars.push(total);
  return bars;
}

/**
 * Dò bẫy 25: **dấu hoá có hiệu lực tới hết ô nhịp**.
 *
 * Viết `F ^F F ^F` thì nốt Pha thứ ba KHÔNG quay về phím trắng — nó vẫn vang
 * Pha thăng, vì dấu thăng ở nốt trước còn hiệu lực tới hết ô. Bản nhạc nhìn thì
 * xen kẽ trắng/đen, tiếng ra lại ba nốt đen liền nhau, và **không có lỗi nào báo**:
 * ô vẫn đủ phách, nốt vẫn trong tầm, abcjs vẫn vẽ đẹp. Muốn nốt sau trở về phím
 * trắng thì phải ghi dấu bình (`=F`).
 *
 * Chỉ tính dấu hoá ghi TAY cạnh nốt, không tính hoá biểu: trong giọng Sol trưởng
 * thì nốt Pha trơn vốn đã là Pha thăng, đó là đúng chứ không phải bẫy.
 *
 * Đã cắn thật hai lần: Für Elise (11/09/2026) và bốn ô nhịp trong Chương 4 —
 * đúng chương dạy dấu hoá.
 */
function accidentalBleeds(els) {
  const hits = [];
  let seen = new Map();
  for (const el of els) {
    if (el.el_type === 'bar') { seen = new Map(); continue; }
    if (el.el_type !== 'note' || el.rest) continue;
    for (const p of el.pitches ?? []) {
      if (p.accidental) { seen.set(p.pitch, p.accidental); continue; }
      const truoc = seen.get(p.pitch);
      if (truoc) hits.push({ name: p.name ?? `pitch ${p.pitch}`, truoc });
    }
  }
  return hits;
}

const pitchesOf = (els) =>
  els.filter((e) => e.el_type === 'note' && !e.rest)
     .flatMap((e) => (e.pitches ?? []).map((p) => p.pitch));

const targets = [
  // Bài tập: bắt buộc đúng mẫu tên, vì src/lib/lessons.ts dùng regex gom vào Nhật ký.
  ...readdirSync(EXERCISE_DIR).filter((f) => f.endsWith('.md')).sort()
    .map((file) => ({ dir: EXERCISE_DIR, file, strictNaming: true })),
  // Chương lý thuyết: không ràng buộc tên, nhưng khối ABC bên trong vẫn phải đúng nhạc.
  ...readdirSync(CHAPTER_DIR).filter((f) => f.endsWith('.md')).sort()
    .map((file) => ({ dir: CHAPTER_DIR, file, strictNaming: false })),
];

console.log(`Soi ${targets.length} file trong ${EXERCISE_DIR} và ${CHAPTER_DIR}\n`);

for (const { dir, file, strictNaming } of targets) {
  // Quy xuống dòng về `\n` ngay khi đọc, cùng lối `readDocFile` bên src/lib — máy
  // Windows checkout ra `\r\n`, regex nào viết theo `\n` là lặng lẽ trượt (bẫy 42).
  const text = readFileSync(join(dir, file), 'utf8').replace(/\r\n?/g, '\n');

  if (strictNaming) {
    const fm = FILE_PATTERN.exec(file);
    if (!fm) { err(file, 'tên file sai mẫu chuong-XX-bai-YY.md — bài sẽ bị loại khỏi trang Nhật ký'); continue; }
    const first = text.split('\n')[0];
    const tm = TITLE_PATTERN.exec(first);
    if (!tm) err(file, `tiêu đề sai mẫu "# Chương X - Bài Y: ..." (đang là "${first.slice(0, 50)}")`);
    else if (Number(tm[1]) !== Number(fm[1]) || Number(tm[2]) !== Number(fm[2]))
      err(file, `tiêu đề ghi Chương ${tm[1]} Bài ${tm[2]} nhưng tên file là ${fm[1]}/${fm[2]}`);
    checkPracticeFirst(file, text);
  }

  const blocks = extractAbcBlocks(text);
  if (blocks.length === 0) continue;

  const allPitches = [];

  blocks.forEach((abc, i) => {
    const label = `${file} khối ${i + 1}`;

    for (const header of abc.match(/^[TC]:.*$/gm) ?? []) {
      const hit = MISSING_DIACRITICS.find((phrase) => header.includes(phrase));
      if (hit) warn(label, 'tiêu đề ABC thiếu dấu tiếng Việt ("' + hit + '"): ' + header.trim());
    }

    const meter = /^M:\s*(\d+)\/(\d+)/m.exec(abc);
    if (!meter) { warn(label, 'không khai báo M:'); return; }
    const expected = Number(meter[1]) / Number(meter[2]);

    let tune;
    try { tune = abcjs.parseOnly(abc)[0]; }
    catch (e) { err(label, `abcjs không phân tích được: ${e.message}`); return; }
    if (!tune) { err(label, 'abcjs trả về rỗng'); return; }

    const staves = collectStaves(tune);
    if (staves.length === 0) { err(label, 'không tìm thấy khuông nhạc nào'); return; }

    const barCounts = [];
    staves.forEach((els, si) => {
      const bars = splitBars(els);
      barCounts.push(bars.length);
      allPitches.push(...pitchesOf(els));

      for (const { name, truoc } of accidentalBleeds(els)) {
        err(label, `khuông ${si + 1}: nốt ${name} viết trơn nhưng dấu ${truoc} ở nốt cùng tên phía trước `
          + 'trong cùng ô nhịp vẫn còn hiệu lực — nó sẽ vang ra nốt hoá. Ghi dấu bình (=) nếu muốn phím trắng.');
      }

      bars.forEach((total, bi) => {
        if (Math.abs(total - expected) < 1e-9) return;
        if (bi === 0 && total < expected) { warn(label, `khuông ${si + 1} ô 1 chỉ ${total} (nhịp lấy đà?)`); return; }
        err(label, `khuông ${si + 1} ô ${bi + 1} cộng ra ${total} nhưng M: ${meter[1]}/${meter[2]} cần ${expected}`);
      });
    });

    if (barCounts.length > 1 && new Set(barCounts).size > 1)
      err(label, `hai bè Grand Staff lệch số ô nhịp: ${barCounts.join(' vs ')}`);
  });

  if (allPitches.length === 0) continue;

  const chapter = Number(/^chuong-(\d+)/.exec(file)?.[1] ?? 0);
  const { rhLow, rhHigh, lhLow, lhHigh } = rangeForChapter(chapter);
  const outside = allPitches.filter(
    (p) => !((p >= rhLow && p <= rhHigh) || (p >= lhLow && p <= lhHigh))
  );
  // Chỉ soi thế tay với bài tập. Chương lý thuyết dạy đọc khuông nhạc nên các
  // bảng minh hoạ trong đó BẮT BUỘC trải rộng ngoài thế tay 5 ngón.
  if (strictNaming && outside.length > 0) {
    const uniq = [...new Set(outside)].sort((a, b) => a - b);
    warn(file, `dùng ${outside.length} nốt ngoài thế tay 5 ngón (pitch ${uniq.join(', ')}) — kiểm tra chương này đã dạy chưa`);
  }
  if (!quiet)
    console.log(`  ok    ${file}: ${blocks.length} khối, quãng pitch ${Math.min(...allPitches)}..${Math.max(...allPitches)}`);
}


console.log(`\n${errors} lỗi, ${warnings} lưu ý.`);
process.exit(errors > 0 ? 1 : 0);
