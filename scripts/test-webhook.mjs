/**
 * Thử toàn bộ luồng thanh toán mà không cần chuyển tiền thật.
 *
 *   pnpm dev            # ở một cửa sổ khác
 *   node scripts/test-webhook.mjs <email>
 *
 * Script tạo một đơn giả cho tài khoản đó, giả lập webhook SePay gửi về, rồi
 * kiểm tra quyền truy cập đã được cấp chưa. Dọn sạch dữ liệu giả trước khi thoát.
 *
 * Có chạy thêm hai phép thử mà tiền thật khó dựng lại được:
 *   - gửi lại đúng giao dịch đó (SePay thử lại tối đa 7 lần) — không được cấp hai lần
 *   - gửi sai khoá API — phải bị từ chối
 */
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const email = process.argv[2];
const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const PACKAGE_ID = 'nen-tang';
const AMOUNT = 399_000;
// Hai mã này phải nằm trong bảng chữ của transfer-code.ts — không có 0/1/I/L/O/U/V.
const TRANSFER_CODE = 'PJTEST99';
const SHORT_CODE = 'PJSHRT29';

if (!email) {
  console.error('Cách dùng: node scripts/test-webhook.mjs <email đã đăng nhập ít nhất 1 lần>');
  process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.SEPAY_WEBHOOK_API_KEY) {
  console.error('Thiếu DATABASE_URL hoặc SEPAY_WEBHOOK_API_KEY trong .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const txId = `test-${Date.now()}`;
let orderId = null;
let userId = null;
let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? '  OK  ' : ' SAI  '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

function payload(overrides = {}) {
  return {
    id: txId,
    gateway: 'MBBank',
    transactionDate: new Date().toISOString(),
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? '0000000000',
    transferType: 'in',
    transferAmount: AMOUNT,
    content: `CT DEN:0123456789 ${TRANSFER_CODE} TU NGUOI HOC`,
    referenceCode: 'FT' + Date.now(),
    ...overrides,
  };
}

function post(body, apiKey = process.env.SEPAY_WEBHOOK_API_KEY) {
  return fetch(`${baseUrl}/api/webhooks/sepay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Apikey ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

try {
  const users = await sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    console.error(`Không có tài khoản ${email}. Đăng nhập bằng Google một lần trước đã.`);
    process.exit(1);
  }
  userId = users[0].id;

  // Dọn tàn dư của lần chạy trước, nếu có.
  await sql`DELETE FROM entitlement WHERE "userId" = ${userId} AND package_id = ${PACKAGE_ID} AND source = 'sepay'`;
  await sql`DELETE FROM payment_order WHERE transfer_code = ${TRANSFER_CODE}`;

  orderId = crypto.randomUUID();
  await sql`
    INSERT INTO payment_order (id, "userId", package_id, amount_vnd, transfer_code, status)
    VALUES (${orderId}, ${userId}, ${PACKAGE_ID}, ${AMOUNT}, ${TRANSFER_CODE}, 'pending')
  `;
  console.log(`\nĐã tạo đơn giả ${TRANSFER_CODE} (${AMOUNT}đ) cho ${email}\n`);

  // 1. Khoá sai phải bị từ chối.
  const bad = await post(payload({ id: txId + '-bad' }), 'khoa-sai-hoan-toan');
  check('Từ chối webhook sai khoá API', bad.status === 401, `HTTP ${bad.status}`);

  const noAuth = await fetch(`${baseUrl}/api/webhooks/sepay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload()),
  });
  check('Từ chối webhook không có header', noAuth.status === 401, `HTTP ${noAuth.status}`);

  let granted = await sql`SELECT id FROM entitlement WHERE "userId" = ${userId} AND package_id = ${PACKAGE_ID}`;
  check('Khoá sai KHÔNG cấp được quyền', granted.length === 0);

  // 2. Webhook hợp lệ phải cấp quyền.
  const good = await post(payload());
  const goodBody = await good.json();
  check('Nhận webhook hợp lệ', good.status === 200 && goodBody.success === true,
    `HTTP ${good.status} ${JSON.stringify(goodBody)}`);

  const [order] = await sql`SELECT status, paid_at FROM payment_order WHERE id = ${orderId}`;
  check('Đơn chuyển sang trạng thái paid', order.status === 'paid', `status=${order.status}`);

  granted = await sql`SELECT source FROM entitlement WHERE "userId" = ${userId} AND package_id = ${PACKAGE_ID}`;
  check('Đã cấp quyền truy cập', granted.length === 1, `source=${granted[0]?.source}`);

  // 3. Gửi lại đúng giao dịch đó — không được nhân đôi.
  const replay = await post(payload());
  const replayBody = await replay.json();
  check('Lần gửi lại vẫn trả success (để SePay ngừng thử lại)',
    replay.status === 200 && replayBody.success === true, `HTTP ${replay.status}`);

  const paymentRows = await sql`SELECT id FROM payment_received WHERE provider_tx_id = ${String(txId)}`;
  check('Giao dịch chỉ được ghi một lần', paymentRows.length === 1, `${paymentRows.length} bản ghi`);

  granted = await sql`SELECT id FROM entitlement WHERE "userId" = ${userId} AND package_id = ${PACKAGE_ID}`;
  check('Quyền truy cập chỉ có một bản ghi', granted.length === 1, `${granted.length} bản ghi`);

  // 4. Chuyển thiếu tiền cho một đơn khác — không được cấp.
  const shortOrderId = crypto.randomUUID();
  await sql`DELETE FROM payment_order WHERE transfer_code = ${SHORT_CODE}`;
  await sql`
    INSERT INTO payment_order (id, "userId", package_id, amount_vnd, transfer_code, status)
    VALUES (${shortOrderId}, ${userId}, 'goi-thu-nghiem', ${AMOUNT}, ${SHORT_CODE}, 'pending')
  `;
  const short = await post(payload({
    id: txId + '-short',
    transferAmount: 10_000,
    content: `CT DEN ${SHORT_CODE} TU AI DO`,
  }));
  check('Nhận được webhook chuyển thiếu', short.status === 200, `HTTP ${short.status}`);

  const [shortOrder] = await sql`SELECT status FROM payment_order WHERE id = ${shortOrderId}`;
  check('Chuyển thiếu KHÔNG đổi trạng thái đơn', shortOrder.status === 'pending', `status=${shortOrder.status}`);

  const shortGrant = await sql`SELECT id FROM entitlement WHERE "userId" = ${userId} AND package_id = 'goi-thu-nghiem'`;
  check('Chuyển thiếu KHÔNG cấp quyền', shortGrant.length === 0);

  const shortPayment = await sql`SELECT amount_vnd FROM payment_received WHERE provider_tx_id = ${txId + '-short'}`;
  check('Nhưng vẫn ghi nhật ký để người xử lý tay', shortPayment.length === 1,
    `${shortPayment[0]?.amount_vnd}đ`);

  await sql`DELETE FROM payment_order WHERE id = ${shortOrderId}`;

  console.log(failures === 0
    ? '\nTất cả phép thử đạt.\n'
    : `\n${failures} phép thử KHÔNG đạt.\n`);
} finally {
  // Dọn dữ liệu giả.
  if (userId) {
    await sql`DELETE FROM payment_received WHERE provider_tx_id LIKE ${'test-%'}`;
    await sql`DELETE FROM entitlement WHERE "userId" = ${userId} AND source = 'sepay'`;
    await sql`DELETE FROM payment_order WHERE transfer_code IN (${TRANSFER_CODE}, ${SHORT_CODE})`;
    console.log('Đã dọn dữ liệu thử.');
  }
  await sql.end();
}

process.exit(failures === 0 ? 0 : 1);
