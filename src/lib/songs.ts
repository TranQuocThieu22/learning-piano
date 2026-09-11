import { getAllMarkdownFiles, type MarkdownFile } from './markdown';

/**
 * **Góc bài hát**: chỗ người học thử đánh những bài quen tai, ngoài giáo trình.
 *
 * Vì sao tách hẳn khỏi đường đi (`learning-path.ts`): đây là chỗ CHƠI, không phải
 * chỗ học. Bài hát **không tick được**, không đếm vào tiến độ, không có bước
 * trước bước sau. Đưa chúng vào đường đi là biến việc nghịch cho vui thành thêm
 * một danh sách phải hoàn thành — đúng thứ `AGENTS.md` cấm.
 *
 * ## Vì sao không có nhạc đang thịnh hành
 *
 * Mọi bài ở đây đều **đã hết hạn bảo hộ bản quyền**, và trường `nguon` của từng
 * file ghi rõ vì sao. Đây không phải chuyện cẩn thận thừa: sản phẩm này CÓ BÁN,
 * mà soạn và phát hành bản nhạc của một tác phẩm còn trong thời hạn bảo hộ là
 * nhân bản tác phẩm được bảo hộ — ở Việt Nam cần giấy phép, VCPMC là nơi quản lý
 * tập thể quyền tác giả âm nhạc.
 *
 * Đây cũng là đường mà dự án đã đi suốt từ đầu: nhạc nền tự sinh bằng Web Audio
 * *chính vì* lý do bản quyền (xem `ambient.ts`), một ảnh anime đã bị gỡ vì bản
 * quyền, và toàn bộ giáo trình chỉ dùng nhạc hết hạn bảo hộ.
 *
 * **Muốn thêm một bài đang thịnh hành thì phải mua giấy phép trước, rồi ghi số
 * giấy phép vào `nguon`.** Đừng thêm bài mới mà bỏ trống trường đó.
 *
 * Cách xin phép — hỏi ai, thư mẫu, chi phí — ghi ở
 * `docs/_internal/ban-quyen-bai-hat.md`. Chỗ dễ sai nhất: quyền in ấn thường
 * KHÔNG nằm ở tổ chức quản lý tập thể mà ở tác giả hoặc nhà xuất bản.
 */

export const SONGS_CATEGORY = '08-bai-hat';

export interface Song {
  slug: string;
  title: string;
  href: string;
  /** 1 = chơi được sớm nhất. Dùng để xếp thứ tự. */
  capDo: number;
  /** Học xong chương này thì đủ sức thử. `null` khi file không khai. */
  sauChuong: number | null;
  /** Xuất xứ và tình trạng bản quyền. Luôn hiện ra cho người học đọc. */
  nguon: string | null;
}

/** Nhãn ngắn cho từng cấp độ, để người học liếc là biết bài nào thử được. */
export const CAP_DO_LABEL: Record<number, string> = {
  1: 'Dễ — trong thế tay 5 ngón',
  2: 'Vừa — rộng một quãng tám',
  3: 'Khó hơn — có phím đen',
};

export function capDoLabel(capDo: number): string {
  return CAP_DO_LABEL[capDo] ?? `Cấp độ ${capDo}`;
}

function toSong(file: MarkdownFile): Song {
  return {
    slug: file.slug,
    title: file.title,
    href: `/${file.category}/${file.slug}`,
    // Thiếu `capDo` thì xếp xuống cuối chứ không đoán: một bài khó mà lọt lên đầu
    // danh sách là người mới thử ngay bài đầu tiên rồi thấy mình kém.
    capDo: typeof file.meta.capDo === 'number' ? file.meta.capDo : 99,
    sauChuong: typeof file.meta.sauChuong === 'number' ? file.meta.sauChuong : null,
    nguon: typeof file.meta.nguon === 'string' ? file.meta.nguon : null,
  };
}

/** Mọi bài hát, dễ trước khó sau; cùng cấp độ thì theo tên file cho ổn định. */
export function getAllSongs(): Song[] {
  return getAllMarkdownFiles()
    .filter((f) => f.category === SONGS_CATEGORY)
    .map(toSong)
    .sort((a, b) => (a.capDo !== b.capDo ? a.capDo - b.capDo : a.slug.localeCompare(b.slug)));
}
