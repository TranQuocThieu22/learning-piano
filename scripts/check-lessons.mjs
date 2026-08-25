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

/** pitch của abcjs: 0 = Đô giữa (C4), mỗi bậc diatonic là 1. */
const RH_LOW = 0,  RH_HIGH = 4;   // C4..G4 — thế tay phải
const LH_LOW = -7, LH_HIGH = -3;  // C3..G3 — thế tay trái

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
  const text = readFileSync(join(dir, file), 'utf8');

  if (strictNaming) {
    const fm = FILE_PATTERN.exec(file);
    if (!fm) { err(file, 'tên file sai mẫu chuong-XX-bai-YY.md — bài sẽ bị loại khỏi trang Nhật ký'); continue; }
    const first = text.split('\n')[0];
    const tm = TITLE_PATTERN.exec(first);
    if (!tm) err(file, `tiêu đề sai mẫu "# Chương X - Bài Y: ..." (đang là "${first.slice(0, 50)}")`);
    else if (Number(tm[1]) !== Number(fm[1]) || Number(tm[2]) !== Number(fm[2]))
      err(file, `tiêu đề ghi Chương ${tm[1]} Bài ${tm[2]} nhưng tên file là ${fm[1]}/${fm[2]}`);
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

  const outside = allPitches.filter(
    (p) => !((p >= RH_LOW && p <= RH_HIGH) || (p >= LH_LOW && p <= LH_HIGH))
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
