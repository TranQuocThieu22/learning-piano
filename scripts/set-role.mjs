/**
 * Đặt vai trò cho một tài khoản.
 *
 *   node scripts/set-role.mjs <email> <role>
 *   node scripts/set-role.mjs chu@piano.vn superadmin
 *
 * LƯU Ý QUAN TRỌNG: vai trò ở đây KHÔNG mở được cửa /admin. Quyền vào khu quản
 * trị đọc từ biến môi trường ADMIN_EMAILS, cố ý không đọc từ database — xem
 * src/lib/admin-allowlist.ts. Đặt role='superadmin' cho một email không nằm
 * trong ADMIN_EMAILS thì người đó vẫn nhận 404 khi vào /admin, và đó là đúng.
 *
 * Cùng lý do với grant-access.mjs: làm dạng script chạy tay thay vì nút bấm
 * trên web, để không phải dựng thêm một cửa có quyền nâng cấp tài khoản.
 */
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const ROLES = ['member', 'admin', 'superadmin'];

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error('Cách dùng: node scripts/set-role.mjs <email> <role>');
  console.error(`Vai trò hợp lệ: ${ROLES.join(', ')}`);
  process.exit(1);
}

if (!ROLES.includes(role)) {
  console.error(`Vai trò "${role}" không hợp lệ. Chọn một trong: ${ROLES.join(', ')}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL trong .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const rows = await sql`
    UPDATE "user" SET role = ${role} WHERE email = ${email}
    RETURNING id, name, email, role
  `;

  if (rows.length === 0) {
    console.error(`Không tìm thấy tài khoản nào với email ${email}.`);
    console.error('Người đó phải đăng nhập bằng Google ít nhất một lần trước đã.');
    process.exit(1);
  }

  const u = rows[0];
  console.log(`Đã đặt vai trò "${u.role}" cho ${u.email}${u.name ? ` (${u.name})` : ''}.`);

  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  if (role !== 'member' && !allowlist.includes(email.trim().toLowerCase())) {
    console.warn('');
    console.warn(`CẢNH BÁO: ${email} không có trong ADMIN_EMAILS.`);
    console.warn('Vai trò này KHÔNG mở cửa /admin — người đó vẫn nhận 404.');
    console.warn('Muốn cho vào /admin thì thêm email vào ADMIN_EMAILS rồi khởi động lại.');
  }
} finally {
  await sql.end();
}
