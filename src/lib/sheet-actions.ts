'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/db';
import { userSheetPages, userSheets } from '@/db/schema';
import { countSheetPages, countUserSheets } from './user-sheets-server';
import {
  base64Bytes,
  MAX_PAGES_PER_SHEET,
  MAX_SHEETS_PER_USER,
  parseImageDataUrl,
} from './user-sheets';
import {
  idSchema,
  sheetAbcSchema,
  sheetNoteSourceSchema,
  sheetPageDataSchema,
  sheetTitleSchema,
} from './validation';

/**
 * Đường GHI của *Kho nhạc của tôi*.
 *
 * Ba điều mọi hàm ở đây đều làm, và làm theo đúng thứ tự này:
 *
 * 1. **Hỏi `auth()` trước mọi thứ khác.** Server Action là endpoint HTTP thật —
 *    ai biết id của nó đều gọi được mà không cần nhìn thấy nút nào.
 * 2. **Kiểm hình dạng bằng Zod, rồi mới kiểm nội dung.** Tham số từ client chưa
 *    chắc là chuỗi.
 * 3. **Kẹp `userId` vào `where` của mọi lệnh sửa và xoá.** Biết id của một bản
 *    nhạc không đủ để đụng vào nó.
 *
 * Luật sản phẩm — riêng tư, không chia sẻ, gỡ được ngay — ghi ở `user-sheets.ts`.
 */

export interface SheetActionResult {
  ok: boolean;
  /** Id bản nhạc vừa tạo, để trang chuyển thẳng tới nó. */
  id?: string;
  error?: string;
}

/**
 * Lưu bản nhạc vừa đọc từ file `.mid` hoặc `.musicxml`.
 *
 * Máy chủ nhận **chuỗi ABC đã đọc xong**, không nhận file: việc đọc chạy ở trình
 * duyệt của người học (`import-sheet.ts`). Nhờ vậy máy chủ không bao giờ phải mở
 * một file nhị phân lạ, và người học cũng không phải chờ tải lên rồi mới biết file
 * có đọc được không.
 */
export async function saveImportedSheet(input: {
  title: string;
  abc: string;
  source: string;
}): Promise<SheetActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not-signed-in' };

  const title = sheetTitleSchema.safeParse(input?.title);
  const abc = sheetAbcSchema.safeParse(input?.abc);
  const source = sheetNoteSourceSchema.safeParse(input?.source);
  if (!title.success || !abc.success || !source.success) {
    return { ok: false, error: 'bad-input' };
  }

  if ((await countUserSheets(userId)) >= MAX_SHEETS_PER_USER) {
    return { ok: false, error: 'too-many' };
  }

  const id = crypto.randomUUID();
  await db.insert(userSheets).values({
    id,
    userId,
    title: title.data,
    kind: 'notes',
    source: source.data,
    abc: abc.data,
  });

  revalidatePath('/my-sheets');
  return { ok: true, id };
}

/**
 * Mở một bản nhạc chụp ảnh, chưa có trang nào.
 *
 * Tách làm hai bước (mở bản nhạc, rồi gửi từng trang) vì Server Action của Next
 * mặc định chỉ nhận 1MB mỗi lần gọi — gửi cả tập ảnh trong một lần là hỏng ngay ở
 * bản nhạc hai trang. Gửi từng trang còn cho phép người học chụp thêm trang vào
 * bản nhạc cũ, và thấy được tiến độ thay vì ngồi nhìn một vòng quay.
 */
export async function createPhotoSheet(title: string): Promise<SheetActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not-signed-in' };

  const parsed = sheetTitleSchema.safeParse(title);
  if (!parsed.success) return { ok: false, error: 'bad-input' };

  if ((await countUserSheets(userId)) >= MAX_SHEETS_PER_USER) {
    return { ok: false, error: 'too-many' };
  }

  const id = crypto.randomUUID();
  await db.insert(userSheets).values({
    id,
    userId,
    title: parsed.data,
    kind: 'photo',
    source: 'photo',
    abc: null,
  });

  revalidatePath('/my-sheets');
  return { ok: true, id };
}

/** Thêm một trang ảnh vào cuối bản nhạc chụp ảnh. */
export async function addSheetPage(input: {
  sheetId: string;
  dataUrl: string;
}): Promise<SheetActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not-signed-in' };

  const sheetId = idSchema.safeParse(input?.sheetId);
  const dataUrl = sheetPageDataSchema.safeParse(input?.dataUrl);
  if (!sheetId.success || !dataUrl.success) return { ok: false, error: 'bad-input' };

  // Kiểu ảnh và cỡ ảnh: trình duyệt đã kiểm rồi, máy chủ vẫn kiểm lại bằng đúng
  // hàm đó. Tin lời client ở đây là mở cửa cho mọi thứ đi vào cột `data_base64`.
  const image = parseImageDataUrl(dataUrl.data);
  if (!image) return { ok: false, error: 'bad-image' };

  const rows = await db
    .select({ id: userSheets.id })
    .from(userSheets)
    .where(and(eq(userSheets.userId, userId), eq(userSheets.id, sheetId.data)))
    .limit(1);
  if (rows.length === 0) return { ok: false, error: 'not-found' };

  const dang = await countSheetPages(userId, sheetId.data);
  if (dang >= MAX_PAGES_PER_SHEET) return { ok: false, error: 'too-many-pages' };

  await db.insert(userSheetPages).values({
    sheetId: sheetId.data,
    userId,
    position: dang + 1,
    mimeType: image.mime,
    dataBase64: image.base64,
    byteSize: base64Bytes(image.base64),
  });

  revalidatePath('/my-sheets');
  revalidatePath(`/my-sheets/${sheetId.data}`);
  return { ok: true, id: sheetId.data };
}

/** Đổi tên một bản nhạc trong kho. */
export async function renameSheet(input: {
  sheetId: string;
  title: string;
}): Promise<SheetActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not-signed-in' };

  const sheetId = idSchema.safeParse(input?.sheetId);
  const title = sheetTitleSchema.safeParse(input?.title);
  if (!sheetId.success || !title.success) return { ok: false, error: 'bad-input' };

  const changed = await db
    .update(userSheets)
    .set({ title: title.data })
    .where(and(eq(userSheets.userId, userId), eq(userSheets.id, sheetId.data)))
    .returning({ id: userSheets.id });

  if (changed.length === 0) return { ok: false, error: 'not-found' };

  revalidatePath('/my-sheets');
  revalidatePath(`/my-sheets/${sheetId.data}`);
  return { ok: true, id: sheetId.data };
}

/**
 * Xoá hẳn một bản nhạc khỏi kho, kèm mọi trang ảnh của nó.
 *
 * Đây là điều thứ ba trong bốn điều giữ app ở vị trí nơi chứa (xem
 * `user-sheets.ts`): người học gỡ được ngay thứ họ đưa lên, không phải nhắn hỏi
 * ai. Các trang ảnh đi theo nhờ `onDelete: cascade` khai ở schema, không xoá tay
 * — xoá tay thì chỉ cần một đường xoá mới quên mất là ảnh nằm lại mãi trong
 * database mà không còn ai nhìn thấy để mà xoá.
 */
export async function deleteSheet(sheetId: string): Promise<SheetActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not-signed-in' };

  const parsed = idSchema.safeParse(sheetId);
  if (!parsed.success) return { ok: false, error: 'bad-input' };

  const removed = await db
    .delete(userSheets)
    .where(and(eq(userSheets.userId, userId), eq(userSheets.id, parsed.data)))
    .returning({ id: userSheets.id });

  if (removed.length === 0) return { ok: false, error: 'not-found' };

  revalidatePath('/my-sheets');
  return { ok: true };
}
