import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  entitlements,
  lessonCompletions,
  orders,
  payments,
  users,
} from '@/db/schema';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  lessonsDone: number;
  packages: string[];
  /** Ngày tạo tài khoản — mốc để biết một người đã có đủ thời gian hay chưa. */
  createdAt: Date;
  /** Số ngày kể từ lúc đăng ký, do Postgres tính. */
  daysSinceSignup: number;
  /** Lần tick bài gần nhất; `null` nghĩa là chưa tick bài nào bao giờ. */
  lastTickAt: Date | null;
  /** Số ngày kể từ lần tick gần nhất — khoảng lặng, dấu hiệu đã rơi. */
  daysSinceLastTick: number | null;
  /** Chương xa nhất đã chạm tới, suy từ slug `chuong-NN-bai-MM`. */
  farthestChapter: number | null;
  /** Ghi chú lúc cấp quyền, ví dụ "beta dot 1" — dùng để nhận ra cohort. */
  notes: string[];
}

/**
 * Danh sách người học kèm số bài đã tick và các gói đang sở hữu.
 *
 * Gộp bằng hai truy vấn con thay vì join thẳng rồi đếm ở JS: số người học sẽ
 * tăng dần, còn cách này giữ mỗi người đúng một dòng dù họ có bao nhiêu bài.
 *
 * Các cột thời gian phục vụ đúng câu hỏi ở mục 8 của dinh-huong-kinh-doanh.md:
 * *bao nhiêu người đi hết Chương 1?* Muốn trả lời thì nhìn một con số tổng là
 * không đủ, phải phân biệt được **chưa xong** với **đã bỏ**:
 *
 * - `daysSinceSignup` cho biết người đó đã đủ mười bốn ngày mà mục 4 của
 *   ke-hoach-beta.md lấy làm ngưỡng "coi như đã rơi" hay chưa. Người mới vào ba
 *   hôm mà xếp chung với người vào từ năm tuần trước thì tỷ lệ bị kéo xuống oan.
 * - `daysSinceLastTick` là khoảng lặng. Đăng ký lâu rồi mà im hai tuần là đã
 *   rơi; tick hôm qua thì vẫn đang học, dù mới xong hai bài.
 * - `farthestChapter` trả lời thẳng câu hỏi trên, không phải nhẩm từ số bài.
 *
 * Ngày giờ do Postgres trừ chứ không tính ở JS: trang này render cả trên máy
 * chủ lẫn trình duyệt, hai bên lấy "hôm nay" ở hai đồng hồ khác nhau thì React
 * kêu lệch nội dung lúc hydrate.
 *
 * `beta-metrics.mjs` vẫn là chỗ đọc **tỷ lệ** của cả đợt; bảng này để nhìn từng
 * người, thứ mà một con số tổng không nói được.
 */
export async function listUsers(limit = 200): Promise<AdminUserRow[]> {
  const lessonCounts = db
    .select({
      userId: lessonCompletions.userId,
      total: sql<number>`count(*)::int`.as('total'),
      lastAt: sql<Date>`max(${lessonCompletions.completedAt})`.as('last_at'),
      quietDays: sql<number>`
        (now()::date - max(${lessonCompletions.completedAt})::date)::int
      `.as('quiet_days'),
      // Slug luôn có dạng chuong-NN-bai-MM (check-lessons.mjs canh điều đó), nên
      // hai ký tự ở vị trí 8 là số chương. Vẫn lọc bằng biểu thức chính quy để
      // một slug lạ lọt vào không làm cả truy vấn ném lỗi ép kiểu.
      farthestChapter: sql<number>`
        max(
          case when ${lessonCompletions.lessonSlug} ~ '^chuong-[0-9]{2}'
          then substring(${lessonCompletions.lessonSlug} from 8 for 2)::int end
        )
      `.as('farthest_chapter'),
    })
    .from(lessonCompletions)
    .groupBy(lessonCompletions.userId)
    .as('lesson_counts');

  const owned = db
    .select({
      userId: entitlements.userId,
      packages: sql<string[]>`array_agg(${entitlements.packageId})`.as('packages'),
      notes: sql<string[] | null>`
        array_agg(${entitlements.note}) filter (where ${entitlements.note} is not null)
      `.as('notes'),
    })
    .from(entitlements)
    .groupBy(entitlements.userId)
    .as('owned');

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      lessonsDone: sql<number>`coalesce(${lessonCounts.total}, 0)`,
      packages: sql<string[] | null>`${owned.packages}`,
      notes: sql<string[] | null>`${owned.notes}`,
      createdAt: users.createdAt,
      daysSinceSignup: sql<number>`(now()::date - ${users.createdAt}::date)::int`,
      lastTickAt: sql<Date | null>`${lessonCounts.lastAt}`,
      daysSinceLastTick: sql<number | null>`${lessonCounts.quietDays}`,
      farthestChapter: sql<number | null>`${lessonCounts.farthestChapter}`,
    })
    .from(users)
    .leftJoin(lessonCounts, eq(lessonCounts.userId, users.id))
    .leftJoin(owned, eq(owned.userId, users.id))
    // Mới đăng ký lên đầu: đợt beta đọc theo thứ tự người vào, không theo bảng chữ.
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    lessonsDone: Number(r.lessonsDone) || 0,
    packages: r.packages ?? [],
    notes: r.notes ?? [],
    daysSinceSignup: Number(r.daysSinceSignup) || 0,
    lastTickAt: r.lastTickAt ? new Date(r.lastTickAt) : null,
    daysSinceLastTick:
      r.daysSinceLastTick === null ? null : Number(r.daysSinceLastTick),
    farthestChapter:
      r.farthestChapter === null ? null : Number(r.farthestChapter),
  }));
}

export interface AdminPaymentRow {
  id: string;
  providerTxId: string;
  amountVnd: number;
  rawContent: string | null;
  receivedAt: Date;
  orderId: string | null;
  orderStatus: string | null;
  orderAmountVnd: number | null;
  orderTransferCode: string | null;
  buyerEmail: string | null;
}

/**
 * Giao dịch đã nhận, mới nhất trước.
 *
 * Kèm thông tin đơn để nhìn ra ngay ca nào cần xử lý tay — thứ mà hiện chỉ nằm
 * trong log của Vercel.
 */
export async function listPayments(limit = 100): Promise<AdminPaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      providerTxId: payments.providerTxId,
      amountVnd: payments.amountVnd,
      rawContent: payments.rawContent,
      receivedAt: payments.receivedAt,
      orderId: payments.orderId,
      orderStatus: orders.status,
      orderAmountVnd: orders.amountVnd,
      orderTransferCode: orders.transferCode,
      buyerEmail: users.email,
    })
    .from(payments)
    .leftJoin(orders, eq(orders.id, payments.orderId))
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(payments.receivedAt))
    .limit(limit);

  return rows;
}

/** Lý do một giao dịch cần người nhìn tới, hoặc null nếu đã xong xuôi. */
export function needsAttention(row: AdminPaymentRow): string | null {
  if (!row.orderId) {
    return 'Không gắn được vào đơn nào — nhiều khả năng người chuyển quên ghi mã.';
  }
  if (row.orderAmountVnd !== null && row.amountVnd < row.orderAmountVnd) {
    return 'Chuyển thiếu tiền, chưa cấp quyền.';
  }
  if (row.orderStatus === 'paid' && row.orderAmountVnd !== null && row.amountVnd > row.orderAmountVnd) {
    return 'Chuyển dư so với giá đơn — cân nhắc hoàn lại phần thừa.';
  }
  return null;
}

export interface AdminOrderRow {
  id: string;
  transferCode: string;
  packageId: string;
  amountVnd: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  buyerEmail: string | null;
}

export async function listOrders(limit = 100): Promise<AdminOrderRow[]> {
  return db
    .select({
      id: orders.id,
      transferCode: orders.transferCode,
      packageId: orders.packageId,
      amountVnd: orders.amountVnd,
      status: orders.status,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      buyerEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}
