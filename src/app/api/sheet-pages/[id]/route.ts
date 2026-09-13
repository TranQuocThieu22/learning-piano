import { auth } from '@/auth';
import { getSheetPageImage } from '@/lib/user-sheets-server';
import { idSchema } from '@/lib/validation';

/**
 * Trả về ảnh một trang bản nhạc chụp, **chỉ cho đúng chủ của nó**.
 *
 * Vì sao ảnh đi qua một route riêng chứ không nhúng thẳng chuỗi base64 vào HTML
 * của trang: nhúng thẳng thì mỗi trang ảnh phình HTML thêm vài trăm KB, trình
 * duyệt không cache được, và mở một bản nhạc năm trang là tải lại cả năm mỗi lần
 * lật. Qua route thì ảnh được cache như mọi ảnh khác.
 *
 * `Cache-Control: private` là bắt buộc, không phải cho nhanh: thiếu chữ `private`
 * thì một proxy chung đường (mạng công ty, mạng quán) được phép giữ lại ảnh rồi
 * đưa cho người tiếp theo hỏi cùng đường dẫn.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return new Response('Chưa đăng nhập', { status: 401 });
  }

  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return new Response('Không tìm thấy', { status: 404 });
  }

  /*
   * Một câu hỏi duy nhất, kẹp cả chủ sở hữu lẫn id (xem `user-sheets-server.ts`).
   * Trang của người khác trả về 404 chứ không phải 403: 403 xác nhận trang đó có
   * thật, mà ở đây chính sự tồn tại cũng là chuyện riêng.
   */
  const page = await getSheetPageImage(userId, parsed.data);
  if (!page) {
    return new Response('Không tìm thấy', { status: 404 });
  }

  const bytes = Uint8Array.from(Buffer.from(page.dataBase64, 'base64'));

  return new Response(bytes, {
    headers: {
      'Content-Type': page.mimeType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
