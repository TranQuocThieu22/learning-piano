/**
 * Đo phễu rơi rụng của đợt beta.
 *
 *   node scripts/beta-metrics.mjs
 *
 * Trả lời đúng câu hỏi đã chốt ở mục 8 của docs/_internal/dinh-huong-kinh-doanh.md:
 * trong những người học thật đầu tiên, bao nhiêu người đi hết Chương 1?
 *
 * Nguồn dữ liệu là bảng lesson_completion — cột completed_at chính là dấu thời
 * gian ta cần, không phải cài thêm công cụ phân tích nào.
 *
 * LƯU Ý KHI ĐỌC SỐ: tick bài là hành động tự nguyện. Có người tập mà không tick,
 * có người tick mà chưa tập. Đây là chỉ dấu, không phải sự thật tuyệt đối.
 */
import { config } from 'dotenv';
import postgres from 'postgres';
import { readdirSync } from 'node:fs';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL trong .env.local');
  process.exit(1);
}

/** Slug bài học theo đúng thứ tự chương/bài, đọc thẳng từ giáo trình. */
const lessons = readdirSync('docs/03-exercises')
  .filter((f) => /^chuong-\d+-bai-\d+\.md$/.test(f))
  .map((f) => f.replace('.md', ''))
  .sort();

const chuong1 = lessons.filter((s) => s.startsWith('chuong-01-'));

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const phanTram = (a, b) => (b === 0 ? '—' : `${Math.round((a / b) * 100)}%`);

try {
  const users = await sql`SELECT id, email FROM "user"`;
  const done = await sql`SELECT "userId", lesson_slug, completed_at FROM lesson_completion`;

  const theoNguoi = new Map();
  for (const r of done) {
    const g = theoNguoi.get(r.userId) ?? [];
    g.push(r);
    theoNguoi.set(r.userId, g);
  }

  const coTick = [...theoNguoi.keys()].length;
  const xongChuong1 = [...theoNguoi.values()].filter((rows) => {
    const slugs = new Set(rows.map((r) => r.lesson_slug));
    return chuong1.every((s) => slugs.has(s));
  }).length;

  console.log('=== Quy mô ===');
  console.log(`  Tài khoản đã đăng nhập : ${users.length}`);
  console.log(`  Đã tick ít nhất 1 bài  : ${coTick}  (${phanTram(coTick, users.length)})`);

  console.log('\n=== Phễu rơi rụng theo từng bài ===');
  for (const slug of lessons) {
    const n = done.filter((r) => r.lesson_slug === slug).length;
    const thanh = '█'.repeat(n).padEnd(20, '·');
    console.log(`  ${slug}  ${thanh} ${n}`);
  }

  console.log('\n=== Chỉ số quyết định ===');
  console.log(`  Đi hết Chương 1 (${chuong1.length} bài): ${xongChuong1}/${coTick} người có tick`);
  console.log(`  Tỷ lệ: ${phanTram(xongChuong1, coTick)}`);

  // Thời gian từ bài đầu tới bài cuối Chương 1 — cho biết người ta tập đều hay ngắt quãng.
  const soNgay = [];
  for (const rows of theoNguoi.values()) {
    const c1 = rows.filter((r) => chuong1.includes(r.lesson_slug));
    if (c1.length < chuong1.length) continue;
    const moc = c1.map((r) => new Date(r.completed_at).getTime()).sort((a, b) => a - b);
    soNgay.push((moc.at(-1) - moc[0]) / 86_400_000);
  }
  if (soNgay.length > 0) {
    soNgay.sort((a, b) => a - b);
    const giua = soNgay[Math.floor(soNgay.length / 2)];
    console.log(`  Số ngày trung vị để xong Chương 1: ${giua.toFixed(1)}`);
  }

  console.log('\n=== Kết luận theo tiêu chí mục 8 ===');

  // Chặn cỡ mẫu TRƯỚC khi kết luận. Không có nó, một người tick đủ hai bài là
  // script tuyên bố "ĐẠT 100%" — con số đúng về số học nhưng vô nghĩa về thống
  // kê, và là loại số dễ khiến người ta yên tâm sai chỗ.
  const CO_MAU_TOI_THIEU = 20;

  if (coTick === 0) {
    console.log('  Chưa có dữ liệu.');
  } else if (coTick < CO_MAU_TOI_THIEU) {
    console.log(`  CHƯA KẾT LUẬN ĐƯỢC — mới ${coTick} người có tick, cần ít nhất ${CO_MAU_TOI_THIEU}.`);
    console.log(`  (Tỷ lệ ${phanTram(xongChuong1, coTick)} ở trên chỉ để tham khảo, đừng dựa vào để quyết định.)`);
  } else if (xongChuong1 / coTick >= 0.5) {
    console.log('  ĐẠT (>= 50%) — sản phẩm ổn, viết nốt Chương 8-10 rồi chuẩn bị mở bán.');
  } else {
    console.log('  CHƯA ĐẠT (< 50%) — vấn đề nằm ở SẢN PHẨM, chưa tiêu tiền quảng cáo.');
  }
} finally {
  await sql.end();
}
