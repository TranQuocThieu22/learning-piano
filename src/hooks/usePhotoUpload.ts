'use client';

import { useCallback, useRef, useState } from 'react';
import { addSheetPage, createPhotoSheet } from '@/lib/sheet-actions';
import {
  fitWithin,
  IMAGE_QUALITY,
  MAX_PAGE_BASE64,
  sheetErrorMessage,
} from '@/lib/user-sheets';

/**
 * Đưa ảnh chụp bản nhạc giấy lên kho: thu nhỏ ở máy người học rồi gửi từng trang.
 *
 * Đây là chỗ duy nhất trong app chạm vào `canvas` và `createImageBitmap`, nên mọi
 * thứ thuộc về trình duyệt gom hết ở đây; phép tính cỡ ảnh nằm ở `fitWithin`
 * (`src/lib/user-sheets.ts`) để test được — quy tắc 2 của
 * `.claude/skills/code-standards/SKILL.md`.
 *
 * **Vì sao thu nhỏ trước khi gửi:** ảnh gốc của điện thoại 3-5MB, mà Server Action
 * của Next mặc định chỉ nhận 1MB mỗi lần gọi. Ngoài ra người học phần lớn dùng 4G
 * ngay cạnh cây đàn, nên mỗi megabyte tiết kiệm được là tiền của họ.
 *
 * **Gửi LẦN LƯỢT từng trang, không gửi song song:** một bản nhạc bốn trang gửi
 * song song là bốn lần ghi database cùng lúc tranh nhau chỗ đứng của trang (cột
 * `position` đếm theo số trang đang có), và thứ tự trang là thứ duy nhất người học
 * không sửa lại được sau đó.
 */

export interface PhotoUploadState {
  /** Đang gửi hay không — để khoá nút và không ai bấm hai lần. */
  busy: boolean;
  /** Đã gửi xong mấy trang trong tổng số, để hiện "2/5". */
  done: number;
  total: number;
  error: string | null;
}

const KHONG_GUI: PhotoUploadState = { busy: false, done: 0, total: 0, error: null };

/**
 * Đọc một file ảnh ra `data:` đã thu nhỏ.
 *
 * `imageOrientation: 'from-image'` là bắt buộc: ảnh chụp bằng điện thoại cầm dọc
 * mang thẻ EXIF xoay, mà `canvas` thì không tự xoay theo. Thiếu nó là bản nhạc
 * nằm ngang trên màn hình đúng lúc người học đặt máy lên giá nhạc.
 */
async function toDataUrl(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  if (width === 0 || height === 0) {
    bitmap.close();
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  /*
   * Hạ chất lượng dần nếu vẫn quá nặng. Ảnh chụp sát trang giấy trắng đen thường
   * nhẹ, nhưng ảnh chụp cả bàn phím đàn và tấm rèm phía sau thì nặng gấp mấy lần
   * — mà đó mới là ảnh người học chụp thật.
   */
  for (const quality of [IMAGE_QUALITY, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    const base64 = url.slice(url.indexOf(',') + 1);
    if (base64.length <= MAX_PAGE_BASE64) return url;
  }
  return null;
}

export function usePhotoUpload() {
  const [state, setState] = useState<PhotoUploadState>(KHONG_GUI);
  /** Chặn lần bấm thứ hai trong lúc lần thứ nhất chưa xong. */
  const dangGui = useRef(false);

  const reset = useCallback(() => {
    setState(KHONG_GUI);
  }, []);

  /**
   * Gửi cả tập ảnh. Trả về id bản nhạc khi xong, `null` khi hỏng.
   *
   * `sheetId` có sẵn nghĩa là đang **chụp thêm trang** cho bản nhạc cũ; bỏ trống
   * thì mở một bản nhạc mới.
   */
  const upload = useCallback(async (
    files: File[],
    options: { title: string; sheetId?: string },
  ): Promise<string | null> => {
    if (dangGui.current || files.length === 0) return null;
    dangGui.current = true;
    setState({ busy: true, done: 0, total: files.length, error: null });

    try {
      let sheetId = options.sheetId ?? null;
      if (sheetId === null) {
        const created = await createPhotoSheet(options.title);
        if (!created.ok || !created.id) {
          setState({ busy: false, done: 0, total: files.length, error: sheetErrorMessage(created.error) });
          return null;
        }
        sheetId = created.id;
      }

      for (let i = 0; i < files.length; i += 1) {
        const dataUrl = await toDataUrl(files[i]);
        if (dataUrl === null) {
          setState({
            busy: false,
            done: i,
            total: files.length,
            error: 'Có ảnh app không đọc được hoặc nặng quá. Thử chụp lại trang đó.',
          });
          return sheetId;
        }

        const result = await addSheetPage({ sheetId, dataUrl });
        if (!result.ok) {
          setState({ busy: false, done: i, total: files.length, error: sheetErrorMessage(result.error) });
          return sheetId;
        }
        setState({ busy: true, done: i + 1, total: files.length, error: null });
      }

      setState({ busy: false, done: files.length, total: files.length, error: null });
      return sheetId;
    } catch {
      /*
       * Bắt cả cụm: `createImageBitmap` ném lỗi với file ảnh hỏng, và lời gọi
       * Server Action ném lỗi khi mất mạng giữa chừng — cả hai đều là chuyện
       * thường khi ngồi tập cạnh cây đàn với sóng 4G yếu, và cả hai đều chỉ cần
       * một câu bảo người học thử lại.
       */
      setState({ busy: false, done: 0, total: files.length, error: 'Gửi ảnh chưa xong. Kiểm tra mạng rồi thử lại.' });
      return null;
    } finally {
      dangGui.current = false;
    }
  }, []);

  return { ...state, upload, reset };
}
