import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { userSheetPages, userSheets } from '@/db/schema';
import type { SheetKind } from './user-sheets';

/**
 * Đường ĐỌC của *Kho nhạc của tôi*.
 *
 * Tách khỏi `user-sheets.ts` vì file này `import 'server-only'` và chạm database,
 * nên vitest không nạp được (bẫy đã ghi ở `bay-ky-thuat.md`) — đúng cặp
 * `access.ts` / `access-server.ts` đang dùng.
 *
 * **Mọi hàm ở đây đều nhận `userId` và kẹp nó vào mệnh đề `where`.** Không có hàm
 * nào "lấy bản nhạc theo id" mà không hỏi của ai: đây là dữ liệu riêng tư nhất
 * trong app, và một hàm như thế chỉ cần được gọi nhầm một lần là người này xem
 * được bản nhạc của người kia.
 */

export interface SheetSummary {
  id: string;
  title: string;
  kind: SheetKind;
  source: string;
  createdAt: Date;
  /** Số trang ảnh; luôn 0 với bản nhạc nhập từ file. */
  pageCount: number;
}

export interface SheetDetail extends SheetSummary {
  abc: string | null;
  pages: { id: string; position: number }[];
}

export async function listUserSheets(userId: string): Promise<SheetSummary[]> {
  const rows = await db
    .select({
      id: userSheets.id,
      title: userSheets.title,
      kind: userSheets.kind,
      source: userSheets.source,
      createdAt: userSheets.createdAt,
    })
    .from(userSheets)
    .where(eq(userSheets.userId, userId))
    .orderBy(desc(userSheets.createdAt));

  // Đếm trang bằng một truy vấn gộp thay vì hỏi từng bản nhạc một: danh sách này
  // mở ra ở mọi lần vào kho, và một vòng lặp truy vấn là thứ chậm dần theo đúng
  // mức người học chăm dùng tính năng.
  const counts = await db
    .select({ sheetId: userSheetPages.sheetId, n: sql<number>`count(*)::int` })
    .from(userSheetPages)
    .where(eq(userSheetPages.userId, userId))
    .groupBy(userSheetPages.sheetId);

  const byId = new Map(counts.map((c) => [c.sheetId, c.n]));

  return rows.map((r) => ({
    ...r,
    kind: r.kind as SheetKind,
    pageCount: byId.get(r.id) ?? 0,
  }));
}

export async function countUserSheets(userId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userSheets)
    .where(eq(userSheets.userId, userId));
  return rows[0]?.n ?? 0;
}

export async function getUserSheet(userId: string, sheetId: string): Promise<SheetDetail | null> {
  const rows = await db
    .select()
    .from(userSheets)
    .where(and(eq(userSheets.userId, userId), eq(userSheets.id, sheetId)))
    .limit(1);

  const sheet = rows[0];
  if (!sheet) return null;

  const pages = await db
    .select({ id: userSheetPages.id, position: userSheetPages.position })
    .from(userSheetPages)
    .where(eq(userSheetPages.sheetId, sheet.id))
    .orderBy(asc(userSheetPages.position));

  return {
    id: sheet.id,
    title: sheet.title,
    kind: sheet.kind as SheetKind,
    source: sheet.source,
    createdAt: sheet.createdAt,
    abc: sheet.abc,
    pageCount: pages.length,
    pages,
  };
}

/** Ảnh một trang, chỉ trả về khi đúng chủ của nó đang hỏi. */
export async function getSheetPageImage(
  userId: string,
  pageId: string
): Promise<{ mimeType: string; dataBase64: string } | null> {
  const rows = await db
    .select({ mimeType: userSheetPages.mimeType, dataBase64: userSheetPages.dataBase64 })
    .from(userSheetPages)
    .where(and(eq(userSheetPages.userId, userId), eq(userSheetPages.id, pageId)))
    .limit(1);

  return rows[0] ?? null;
}

/** Số trang đang có của một bản nhạc, để biết trang mới đứng thứ mấy. */
export async function countSheetPages(userId: string, sheetId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userSheetPages)
    .where(and(eq(userSheetPages.userId, userId), eq(userSheetPages.sheetId, sheetId)));
  return rows[0]?.n ?? 0;
}
