/**
 * Nén ảnh trong public/images cho vừa với khổ hiển thị thật của bài học.
 *
 *   node scripts/optimize-images.mjs            # nén thật, ghi đè file gốc
 *   node scripts/optimize-images.mjs --dry-run  # chỉ xem sẽ tiết kiệm bao nhiêu
 *
 * Vì sao cần: ảnh tải về từ máy sinh ảnh thường là 1400-2000px và ~1 MB mỗi tấm.
 * Khung đọc bài rộng tối đa 850px (xem `.markdown-body` trong globals.css), nên
 * quá nửa số điểm ảnh đó không bao giờ được nhìn thấy — chỉ tốn 4G của người học.
 * Riêng Chương 0 có 8 tấm, chưa nén là gần 6 MB cho đúng trang đầu tiên người mới mở.
 *
 * Chỉ đụng tới JPG/PNG. SVG bỏ qua vì đằng nào cũng chỉ vài KB.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/images';

/**
 * Gấp đôi bề rộng khung đọc (850px) để màn hình Retina vẫn nét.
 * Ảnh nhỏ hơn mức này thì giữ nguyên kích thước, không phóng to.
 */
const MAX_WIDTH = 1700;

/** 82 là ngưỡng mà mắt thường không phân biệt được với ảnh gốc trên ảnh chụp. */
const JPEG_QUALITY = 82;

const dryRun = process.argv.includes('--dry-run');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (/\.(jpe?g|png)$/i.test(entry.name)) files.push(path);
  }
  return files;
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

let before = 0;
let after = 0;

for (const file of walk(ROOT).sort()) {
  const original = statSync(file).size;
  // Đọc sẵn vào bộ nhớ rồi mới đưa cho sharp: trên Windows, để sharp tự mở file
  // thì file còn bị khoá lúc ghi đè, và writeFileSync ném lỗi UNKNOWN.
  const image = sharp(readFileSync(file));
  const meta = await image.metadata();
  const isPng = extname(file).toLowerCase() === '.png';

  // withoutEnlargement: ảnh vốn đã hẹp hơn MAX_WIDTH thì để yên bề rộng.
  const pipeline = image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const buffer = await (isPng
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
  ).toBuffer();

  before += original;

  // Nén xong mà không nhỏ hơn thì giữ bản gốc — thường gặp ở ảnh đã tối ưu sẵn.
  if (buffer.length >= original) {
    after += original;
    console.log(`  giữ nguyên  ${file} (${kb(original)}, nén lại không nhỏ hơn)`);
    continue;
  }

  after += buffer.length;
  const saved = Math.round((1 - buffer.length / original) * 100);
  console.log(
    `  ${dryRun ? 'sẽ nén' : 'đã nén'}      ${file}  ${meta.width}px ${kb(original)} → ${kb(buffer.length)}  (-${saved}%)`
  );
  if (!dryRun) writeFileSync(file, buffer);
}

console.log(
  `\nTổng: ${kb(before)} → ${kb(after)} (giảm ${Math.round((1 - after / before) * 100)}%)` +
    (dryRun ? ' — mới chỉ là thử, chưa ghi file nào.' : '')
);
