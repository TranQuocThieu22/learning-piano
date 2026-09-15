/**
 * Phần tính toán của `scripts/post-facebook.mjs`: đọc bài đăng ra khỏi
 * `docs/_internal/bai-dang-facebook.md`, dựng lời văn đúng như sẽ lên Trang, và kiểm giờ hẹn.
 *
 * Tách khỏi script vì script chạm mạng và ổ đĩa, còn chỗ dễ sai nhất lại là phần thuần:
 * đọc nhầm khối chữ là đăng nhầm bài, mà bài đã lên Trang thì không rút lại được với người
 * đã kịp đọc. File này cố ý không import gì, để Node chạy thẳng được từ script `.mjs`.
 */

export interface FacebookPost {
  /** Số bài như ghi trong tiêu đề ("Bài đăng số 4"). */
  number: number;
  heading: string;
  /** Tiêu đề mục đã ghi "đã đăng". */
  alreadyPosted: boolean;
  /** Lời văn đã nối dòng, đúng như sẽ gửi lên Facebook. */
  message: string;
}

const POST_HEADING = /^## .*Bài đăng số (\d+)\b/;
const BULLET = /^[•*-]\s/;

/**
 * Đọc mọi mục "Bài đăng số N" có khối ```text. Khối mẫu ở mục khác (mục 5) không có số
 * nên không bị đọc nhầm thành bài.
 */
export function parseFacebookPosts(markdown: string): FacebookPost[] {
  // NFC: gõ tiêu đề bằng bộ gõ khác có thể ra "đ" + dấu tách rời, lúc đó so "đã đăng" trượt.
  // Bỏ \r: máy Windows checkout ra \r\n (bẫy 42).
  const lines = markdown.normalize('NFC').replace(/\r\n?/g, '\n').split('\n');
  const posts: FacebookPost[] = [];

  let i = 0;
  while (i < lines.length) {
    const match = POST_HEADING.exec(lines[i]);
    if (!match) {
      i++;
      continue;
    }

    const heading = lines[i].slice(3).trim();
    let body: string[] | null = null;
    let j = i + 1;
    // Chỉ tìm khối chữ trong chính mục này: mục chưa soạn lời thì không được mượn lời của mục sau.
    while (j < lines.length && !lines[j].startsWith('## ')) {
      if (body === null && lines[j].trim() === '```text') {
        let end = j + 1;
        while (end < lines.length && lines[end].trim() !== '```') end++;
        body = lines.slice(j + 1, end);
        j = end;
      }
      j++;
    }

    if (body) {
      posts.push({
        number: Number(match[1]),
        heading,
        alreadyPosted: heading.includes('đã đăng'),
        message: joinWrappedLines(body),
      });
    }
    i = j;
  }

  return posts;
}

/**
 * Nối các dòng bị ngắt cứng thành đoạn liền.
 *
 * Lời văn trong file ngắt ở khoảng 80-95 ký tự cho dễ đọc lúc soạn, nhưng Facebook giữ nguyên
 * từng dấu xuống dòng — gửi nguyên thì trên điện thoại câu nào cũng gãy ở giữa màn hình.
 * Giữ lại hai thứ có chủ ý: dòng trống ngăn đoạn, và dòng mở đầu bằng gạch đầu dòng.
 */
export function joinWrappedLines(lines: string[]): string {
  const out: string[] = [];
  let current: string | null = null;
  const flush = () => {
    if (current !== null) out.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flush();
      if (out.length > 0 && out[out.length - 1] !== '') out.push('');
    } else if (current === null || BULLET.test(line)) {
      flush();
      current = line;
    } else {
      current += ` ${line}`;
    }
  }
  flush();

  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

/** Việt Nam không đổi giờ theo mùa, nên cộng thẳng 7 tiếng — khỏi phụ thuộc múi giờ của máy chạy script. */
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const SCHEDULE_INPUT = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

/** "2026-09-17 20:00" theo giờ Việt Nam. Ngày không có thật (30/02, 24:00) thì ném lỗi. */
export function parseVietnamTime(input: string): Date {
  const m = SCHEDULE_INPUT.exec(input.trim());
  if (!m) {
    throw new Error(`Giờ hẹn phải viết dạng "2026-09-17 20:00" (giờ Việt Nam), nhận được "${input}".`);
  }
  const [, y, mo, d, h, mi] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi) - VIETNAM_UTC_OFFSET_MS);
  // Date.UTC lặng lẽ đẩy 30/02 thành 02/03, nên đọc ngược lại để bắt.
  if (formatVietnamTime(date) !== `${d}/${mo}/${y} ${h}:${mi}`) {
    throw new Error(`Không có ngày giờ "${input}".`);
  }
  return date;
}

export function formatVietnamTime(date: Date): string {
  const t = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(t.getUTCDate())}/${pad(t.getUTCMonth() + 1)}/${t.getUTCFullYear()} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

/**
 * Meta nhận giờ hẹn từ 10 phút tới 30 ngày sau lúc gọi. Tài liệu `/feed` ghi 75 ngày, hướng dẫn
 * Pages API ghi 30 — lấy số chặt hơn. Tối thiểu 15 phút chứ không phải 10 vì ảnh tải lên trước
 * lời gọi đăng: mạng chậm vài phút là trượt mốc ngay ở bước cuối, sau khi ảnh đã lên hết.
 */
export const SCHEDULE_MIN_MINUTES = 15;
export const SCHEDULE_MAX_DAYS = 30;

/** Câu báo lỗi nếu giờ hẹn nằm ngoài khoảng Meta nhận, `null` nếu hợp lệ. */
export function scheduleProblem(at: Date, now: Date): string | null {
  const minutes = (at.getTime() - now.getTime()) / 60_000;
  if (minutes < SCHEDULE_MIN_MINUTES) {
    return `Giờ hẹn phải sau lúc này ít nhất ${SCHEDULE_MIN_MINUTES} phút (${formatVietnamTime(at)} là quá sớm).`;
  }
  if (minutes > SCHEDULE_MAX_DAYS * 24 * 60) {
    return `Facebook chỉ nhận hẹn trong vòng ${SCHEDULE_MAX_DAYS} ngày (${formatVietnamTime(at)} là quá xa).`;
  }
  return null;
}

/**
 * Số ký tự đầu bài đem ra so. Đủ dài để hai bài khác nhau không trùng, đủ ngắn để bài đã sửa
 * một chữ ở đoạn cuối vẫn bị nhận ra là cùng một bài.
 */
const DUPLICATE_PREFIX = 80;

/** Hai lời văn có phải cùng một bài không, bỏ qua khác biệt ngắt dòng và hoa thường. */
export function looksLikeSamePost(a: string, b: string): boolean {
  const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const x = norm(a).slice(0, DUPLICATE_PREFIX);
  const y = norm(b).slice(0, DUPLICATE_PREFIX);
  return x !== '' && x === y;
}

/** Mã lỗi Graph API hay gặp → việc cần làm, viết cho người không đọc tài liệu Meta. */
export const GRAPH_ERROR_HINTS: { code: number; hint: string }[] = [
  {
    code: 190,
    hint: 'Mã truy cập sai, hết hạn hoặc đã bị thu hồi (đổi mật khẩu Facebook cũng làm mất mã). Làm lại bước lấy mã ở mục 6 của bai-dang-facebook.md.',
  },
  {
    code: 200,
    hint: 'Mã truy cập thiếu quyền. Lúc lấy mã phải tick đủ pages_show_list, pages_read_engagement, pages_manage_posts.',
  },
  {
    code: 10,
    hint: 'Mã truy cập thiếu quyền. Lúc lấy mã phải tick đủ pages_show_list, pages_read_engagement, pages_manage_posts.',
  },
  { code: 368, hint: 'Facebook tạm chặn đăng bài vì nghi spam. Đợi vài giờ rồi thử lại, đừng đăng dồn nhiều bài một lúc.' },
  { code: 4, hint: 'Gọi Facebook quá nhiều lần trong thời gian ngắn. Đợi khoảng một giờ.' },
  { code: 32, hint: 'Trang bị gọi quá nhiều lần trong thời gian ngắn. Đợi khoảng một giờ.' },
];

export function graphErrorHint(code: number | undefined): string | null {
  return GRAPH_ERROR_HINTS.find((h) => h.code === code)?.hint ?? null;
}
