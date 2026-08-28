/**
 * Đo phễu rơi rụng của đợt beta.
 *
 *   node scripts/beta-metrics.mjs
 *   node scripts/beta-metrics.mjs --cohort "beta dot 2"
 *   node scripts/beta-metrics.mjs --all        # mọi tài khoản, chỉ để dò lỗi
 *
 * Trả lời đúng câu hỏi đã chốt ở mục 8 của docs/_internal/dinh-huong-kinh-doanh.md:
 * trong những người học thật đầu tiên, bao nhiêu người đi hết Chương 1?
 *
 * Nguồn dữ liệu là bảng lesson_completion — cột completed_at chính là dấu thời
 * gian ta cần, không phải cài thêm công cụ phân tích nào.
 *
 * BA ĐIỀU CẦN BIẾT TRƯỚC KHI ĐỌC SỐ
 *
 * 1. Script CHỈ đếm người trong cohort beta, nhận ra bằng ghi chú ở cột
 *    `entitlement.note` mà scripts/grant-access.mjs đã ghi lúc cấp quyền — đúng
 *    công dụng mục 2 của ke-hoach-beta.md đặt ra cho cột đó. Đếm cả bảng `user`
 *    là đếm luôn tài khoản admin và tài khoản thử luồng thanh toán; ở cỡ mẫu
 *    20-30 thì hai ba tài khoản rác đã lệch cả chục phần trăm trên đúng con số
 *    dùng để quyết định.
 *
 * 2. Chỉ số quyết định tính trên nhóm ĐÃ ĐỦ THỜI GIAN. Kế hoạch beta viết "ai
 *    sau hai tuần vẫn chưa xong Chương 1 thì coi như đã rơi" — nghĩa là hai tuần
 *    đếm riêng cho từng người. Người mới bắt đầu ba hôm mà bị xếp chung với
 *    người bắt đầu năm tuần trước thì tỷ lệ bị kéo xuống một cách giả tạo. Tỷ lệ
 *    thô vẫn in ra ngay bên cạnh để đối chiếu, không giấu đi.
 *
 * 3. Tick bài là hành động tự nguyện. Có người tập mà không tick, có người tick
 *    mà chưa tập. Đây là chỉ dấu, không phải sự thật tuyệt đối — nên mục 7 của
 *    kế hoạch beta mới có phần phỏng vấn.
 */
import { config } from 'dotenv';
import postgres from 'postgres';
import { readdirSync } from 'node:fs';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

// --- Tham số dòng lệnh ---

const argv = process.argv.slice(2);
const doiSo = (ten) => {
  const i = argv.indexOf(`--${ten}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
};

/** Chuỗi nhận dạng cohort, so khớp kiểu "có chứa" với entitlement.note. */
const COHORT = doiSo('cohort') ?? 'beta';
const MOI_TAI_KHOAN = argv.includes('--all');

/** Ngưỡng "đã đủ thời gian để coi là rơi", theo mục 4 ke-hoach-beta.md. */
const NGAY_COI_LA_ROI = 14;

/** Dưới ngưỡng này thì không kết luận gì cả. */
const CO_MAU_TOI_THIEU = 20;

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

/** Slug bài học theo đúng thứ tự chương/bài, đọc thẳng từ giáo trình. */
const lessons = readdirSync('docs/03-exercises')
  .filter((f) => /^chuong-\d+-bai-\d+\.md$/.test(f))
  .map((f) => f.replace('.md', ''))
  .sort();

const chuong1 = lessons.filter((s) => s.startsWith('chuong-01-'));

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const NGAY = 86_400_000;
const phanTram = (a, b) => (b === 0 ? '—' : `${Math.round((a / b) * 100)}%`);
const soNgayTu = (t) => (Date.now() - new Date(t).getTime()) / NGAY;
const trungVi = (xs) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** In tối đa `toiDa` email, phần còn lại gộp thành một dòng. */
function inDanhSach(nhan, ds, toiDa = 10) {
  if (ds.length === 0) return;
  console.log(`  ${nhan}`);
  for (const email of ds.slice(0, toiDa)) console.log(`    - ${email}`);
  if (ds.length > toiDa) console.log(`    … và ${ds.length - toiDa} người nữa`);
}

try {
  console.log('=== Nguồn dữ liệu ===');
  console.log(`  Database : ${moTaDatabase(process.env.DATABASE_URL)}`);
  console.log('             (đối chiếu endpoint với mục 8 ke-hoach-beta.md — chạy ở');
  console.log('              máy làm việc là đọc nhánh dev, không phải production)');

  // Admin không phải người học. Quyền admin đọc từ ADMIN_EMAILS chứ không từ
  // bảng entitlement, nên lọc theo note thường đã loại họ — đây là lớp thứ hai.
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  const tatCa = await sql`SELECT id, email, created_at FROM "user"`;

  let cohort;
  if (MOI_TAI_KHOAN) {
    cohort = tatCa;
    console.log('  Cohort   : --all — MỌI tài khoản, kể cả admin và tài khoản thử.');
    console.log('             Chỉ để dò lỗi, ĐỪNG dùng số này để quyết định.');
  } else {
    const coNhan = await sql`
      SELECT DISTINCT "userId" FROM entitlement
      WHERE note ILIKE ${'%' + COHORT + '%'}
    `;
    const idBeta = new Set(coNhan.map((r) => r.userId));
    cohort = tatCa.filter(
      (u) => idBeta.has(u.id) && !adminEmails.has((u.email ?? '').toLowerCase())
    );
    console.log(`  Cohort   : entitlement.note chứa "${COHORT}" → ${cohort.length} người`);
  }

  if (cohort.length === 0) {
    console.log('\nKhông có ai trong cohort.');
    console.log('Người học chỉ được đếm khi cấp quyền có kèm ghi chú:');
    console.log(`  node scripts/grant-access.mjs <email> nen-tang "${COHORT} dot 1"`);
    console.log('Muốn xem thô toàn bộ tài khoản thì chạy lại với --all.');
    process.exit(0);
  }

  const done = await sql`
    SELECT "userId", lesson_slug, completed_at
    FROM lesson_completion
    WHERE "userId" IN ${sql(cohort.map((u) => u.id))}
  `;

  const theoNguoi = new Map();
  for (const r of done) {
    const g = theoNguoi.get(r.userId) ?? [];
    g.push(r);
    theoNguoi.set(r.userId, g);
  }

  // --- Phễu ---

  const coTick = cohort.filter((u) => theoNguoi.has(u.id));
  const chuaTick = cohort.filter((u) => !theoNguoi.has(u.id));

  const xongChuong1 = (u) => {
    const slugs = new Set((theoNguoi.get(u.id) ?? []).map((r) => r.lesson_slug));
    return chuong1.every((s) => slugs.has(s));
  };
  const tickDauTien = (u) =>
    Math.min(...theoNguoi.get(u.id).map((r) => new Date(r.completed_at).getTime()));

  const xong = coTick.filter(xongChuong1);

  console.log('\n=== Phễu ===');
  const dongPheu = (nhan, giaTri) => console.log(`  ${nhan.padEnd(30)}: ${giaTri}`);
  dongPheu('T2  Đăng ký (trong cohort)', cohort.length);
  dongPheu(
    'T3  Đã tick ít nhất 1 bài',
    `${coTick.length}  (${phanTram(coTick.length, cohort.length)})`
  );
  dongPheu(
    `T4  Đi hết Chương 1 (${chuong1.length} bài)`,
    `${xong.length}  (${phanTram(xong.length, coTick.length)} của T3)`
  );

  // T2→T3 là tầng trước đây không nhìn thấy được: đăng nhập rồi không bao giờ
  // bắt đầu. Cần cột user.created_at mới tính được, và không backfill được.
  console.log('\n=== T2 → T3: đăng ký rồi có bắt đầu không ===');
  const tvBatDau = trungVi(
    coTick.map((u) => (tickDauTien(u) - new Date(u.created_at).getTime()) / NGAY)
  );
  if (tvBatDau !== null) {
    console.log(`  Số ngày trung vị từ đăng ký tới bài đầu tiên: ${tvBatDau.toFixed(1)}`);
  }
  console.log(`  Chưa bao giờ tick bài nào: ${chuaTick.length}`);
  inDanhSach(
    'Trong đó đã đăng ký quá 7 ngày (nhắc được):',
    chuaTick.filter((u) => soNgayTu(u.created_at) >= 7).map((u) => u.email)
  );

  // --- Phễu theo từng bài ---

  console.log('\n=== Phễu rơi rụng theo từng bài ===');
  const RONG = 20;
  for (const slug of lessons) {
    const n = done.filter((r) => r.lesson_slug === slug).length;
    // Chặn độ dài: cỡ mẫu 40 người thì thanh tràn ra, padEnd không cắt hộ.
    const thanh = '█'.repeat(Math.min(n, RONG)).padEnd(RONG, '·') + (n > RONG ? '▸' : ' ');
    console.log(`  ${slug}  ${thanh} ${n}`);
  }

  // --- Chỉ số quyết định ---

  // Người chưa xong Chương 1 nhưng mới bắt đầu vài hôm thì CHƯA phải người rơi
  // — họ chỉ là chưa tới lúc. Gộp họ vào mẫu số là tự kéo tỷ lệ xuống.
  const soNgayTapCua = (u) => (Date.now() - tickDauTien(u)) / NGAY;
  const chuaXong = coTick.filter((u) => !xongChuong1(u));
  const chuaDuThoiGian = chuaXong.filter((u) => soNgayTapCua(u) < NGAY_COI_LA_ROI);
  const daRoi = chuaXong.filter((u) => soNgayTapCua(u) >= NGAY_COI_LA_ROI);
  const danhGiaDuoc = xong.length + daRoi.length;

  console.log('\n=== Chỉ số quyết định (T3 → T4) ===');
  console.log(
    `  Thô             : ${xong.length}/${coTick.length} = ${phanTram(xong.length, coTick.length)}`
  );
  console.log(
    `  Đã đủ ${NGAY_COI_LA_ROI} ngày  : ${xong.length}/${danhGiaDuoc} = ${phanTram(xong.length, danhGiaDuoc)}   ← con số dùng để quyết định`
  );
  console.log(
    `  Chưa đủ ${NGAY_COI_LA_ROI} ngày kể từ bài đầu, chưa tính: ${chuaDuThoiGian.length}`
  );
  inDanhSach(
    'Quá hạn mà chưa xong Chương 1 (ưu tiên phỏng vấn):',
    daRoi.map((u) => u.email)
  );

  const tvXong = trungVi(
    xong.map((u) => {
      const moc = theoNguoi
        .get(u.id)
        .filter((r) => chuong1.includes(r.lesson_slug))
        .map((r) => new Date(r.completed_at).getTime());
      return (Math.max(...moc) - Math.min(...moc)) / NGAY;
    })
  );
  if (tvXong !== null) {
    console.log(`  Số ngày trung vị để đi hết Chương 1: ${tvXong.toFixed(1)}`);
  }

  // --- Kết luận ---

  console.log('\n=== Kết luận theo tiêu chí mục 8 ===');

  // Chặn cỡ mẫu TRƯỚC khi kết luận. Không có nó, một người tick đủ hai bài là
  // script tuyên bố "ĐẠT 100%" — con số đúng về số học nhưng vô nghĩa về thống
  // kê, và là loại số dễ khiến người ta yên tâm sai chỗ.
  if (danhGiaDuoc === 0) {
    console.log('  Chưa có ai đủ thời gian để đánh giá.');
  } else if (danhGiaDuoc < CO_MAU_TOI_THIEU) {
    console.log(
      `  CHƯA KẾT LUẬN ĐƯỢC — mới ${danhGiaDuoc} người đủ thời gian, cần ít nhất ${CO_MAU_TOI_THIEU}.`
    );
    console.log(
      `  (Tỷ lệ ${phanTram(xong.length, danhGiaDuoc)} ở trên chỉ để tham khảo, đừng dựa vào để quyết định.)`
    );
  } else if (xong.length / danhGiaDuoc >= 0.5) {
    console.log('  ĐẠT (>= 50%) — sản phẩm ổn, chuẩn bị mở bán.');
  } else {
    console.log('  CHƯA ĐẠT (< 50%) — vấn đề nằm ở SẢN PHẨM, chưa tiêu tiền quảng cáo.');
  }

  console.log('\n  Mẫu số chốt trước là "người có tick" (T3), ngưỡng 50%, cỡ mẫu tối thiểu 20.');
  console.log('  Mục 6 ke-hoach-beta.md: đừng đổi tiêu chí sau khi đã thấy kết quả.');
} finally {
  await sql.end();
}
