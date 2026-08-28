/**
 * Đánh dấu migration là "đã áp" mà KHÔNG chạy nội dung của nó.
 *
 *   node scripts/baseline-migrations.mjs --through 0000_little_cassandra_nova
 *
 * Dùng đúng MỘT LẦN cho mỗi database, lúc chuyển từ `drizzle-kit push` sang
 * `drizzle-kit migrate`.
 *
 * VÌ SAO CẦN. Database đã có sẵn bảng từ thời dùng `push`, nhưng bảng theo dõi
 * migration thì trống. Chạy `migrate` lúc đó là nó áp lại từ 0000 — mà 0000 chứa
 * `CREATE TABLE` trần, gặp bảng đã tồn tại là lỗi. Baseline nói với drizzle:
 * "những migration này coi như đã chạy rồi, bắt đầu từ cái tiếp theo".
 *
 * CƠ CHẾ. drizzle-orm bỏ qua migration bằng cách so `created_at` lớn nhất trong
 * `drizzle.__drizzle_migrations` với trường `when` của từng mục trong
 * `drizzle/meta/_journal.json`; cái nào có `when` lớn hơn thì áp. Nên baseline
 * chỉ là chèn đúng những dòng đó vào bảng, kèm hash sha256 của file .sql cho
 * khớp với thứ drizzle tự ghi.
 *
 * PHẢI CHỌN ĐÚNG MỐC. Baseline quá tay (đánh dấu cả migration mà database chưa
 * thật sự có) thì thay đổi đó bị bỏ qua vĩnh viễn và không ai báo gì cả.
 */
import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const argv = process.argv.slice(2);
const doiSo = (ten) => {
  const i = argv.indexOf(`--${ten}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
};

const THROUGH = doiSo('through');
const FORCE = argv.includes('--force');

if (!THROUGH) {
  console.error('Thiếu --through <tag>. Ví dụ:');
  console.error('  node scripts/baseline-migrations.mjs --through 0000_little_cassandra_nova');
  console.error('\nCác tag có trong drizzle/meta/_journal.json:');
  for (const e of JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')).entries) {
    console.error(`  ${e.tag}`);
  }
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL trong .env.local');
  process.exit(1);
}

/** Host + tên database, KHÔNG kèm tài khoản mật khẩu. */
function moTaDatabase(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(không phân tích được DATABASE_URL)';
  }
}

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
const moc = journal.entries.findIndex((e) => e.tag === THROUGH);
if (moc === -1) {
  console.error(`Không có migration nào tên "${THROUGH}" trong _journal.json.`);
  process.exit(1);
}

const canhDau = journal.entries.slice(0, moc + 1).map((e) => ({
  tag: e.tag,
  when: e.when,
  hash: createHash('sha256')
    .update(readFileSync(`drizzle/${e.tag}.sql`, 'utf8'))
    .digest('hex'),
}));

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  console.log(`Database : ${moTaDatabase(process.env.DATABASE_URL)}`);
  console.log(`Baseline : tới hết "${THROUGH}" (${canhDau.length} migration)\n`);

  await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const daCo = await sql`SELECT hash, created_at FROM "drizzle"."__drizzle_migrations"`;
  if (daCo.length > 0 && !FORCE) {
    console.log(`Bảng theo dõi đã có ${daCo.length} dòng — database này baseline rồi.`);
    console.log('Không làm gì cả. Muốn ghi đè thì thêm --force (hiếm khi đúng).');
    process.exit(0);
  }
  if (daCo.length > 0) {
    await sql`TRUNCATE "drizzle"."__drizzle_migrations"`;
    console.log(`--force: đã xoá ${daCo.length} dòng cũ.\n`);
  }

  for (const m of canhDau) {
    await sql`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${m.hash}, ${m.when})
    `;
    console.log(`  đánh dấu đã áp  ${m.tag}`);
  }

  const conLai = journal.entries.slice(moc + 1);
  console.log(`\nXong. ${canhDau.length} migration được coi là đã chạy.`);
  if (conLai.length > 0) {
    console.log(`Còn ${conLai.length} migration sẽ được áp ở lần "pnpm db:migrate" tới:`);
    for (const e of conLai) console.log(`  ${e.tag}`);
  } else {
    console.log('Không còn migration nào chờ áp.');
  }
} finally {
  await sql.end();
}
