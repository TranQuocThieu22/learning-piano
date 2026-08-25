/**
 * Mở khoá gói cho một người học bằng tay.
 *
 * Dùng khi đường tự động không xử lý được: khách quên ghi mã chuyển khoản, ghi
 * sai, chuyển thiếu rồi bù sau, hoặc bạn muốn tặng quyền truy cập.
 *
 *   node scripts/grant-access.mjs <email> <packageId> "lý do"
 *   node scripts/grant-access.mjs an@gmail.com nen-tang "CK thieu ma, doi chieu sao ke 25/08"
 *
 * Cố ý làm dạng script chạy tay thay vì trang quản trị: một trang quản trị là
 * thêm một cửa cần bảo vệ, mà cửa đó lại cấp được quyền truy cập trả phí.
 */
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const [email, packageId, note] = process.argv.slice(2);

if (!email || !packageId) {
  console.error('Cách dùng: node scripts/grant-access.mjs <email> <packageId> ["ghi chú"]');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL trong .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const users = await sql`SELECT id, name FROM "user" WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    console.error(`Không tìm thấy tài khoản nào với email ${email}.`);
    console.error('Người học phải đăng nhập bằng Google ít nhất một lần trước đã.');
    process.exit(1);
  }

  const user = users[0];

  const existing = await sql`
    SELECT id FROM entitlement
    WHERE "userId" = ${user.id} AND package_id = ${packageId}
    LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`${email} đã có gói "${packageId}" từ trước, không cần làm gì.`);
    process.exit(0);
  }

  await sql`
    INSERT INTO entitlement (id, "userId", package_id, source, note)
    VALUES (${crypto.randomUUID()}, ${user.id}, ${packageId}, 'manual', ${note ?? null})
  `;

  console.log(`Đã mở khoá "${packageId}" cho ${user.name ?? email} (${email}).`);
  if (note) console.log(`Ghi chú: ${note}`);
} finally {
  await sql.end();
}
