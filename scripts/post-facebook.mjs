/**
 * Đăng một bài trong docs/_internal/bai-dang-facebook.md lên Trang Facebook Piano Journey.
 *
 *   pnpm fb list             # các bài trong file, bài nào đã đăng
 *   pnpm fb show 4           # lời văn bài số 4, đúng như sẽ lên Trang
 *   pnpm fb check            # mã truy cập còn dùng được không, trỏ vào trang nào
 *   pnpm fb publish 4 --image a.png --image b.png [--at "2026-09-17 20:00"]
 *   pnpm fb publish 4 ... --confirm
 *
 * Chạy qua `pnpm fb` chứ không gọi thẳng `node`: script nạp phần tính toán viết bằng TypeScript,
 * mà Node kêu một cảnh báo dài về chuyện đó — cảnh báo nằm lẫn vào bản xem trước thì dễ đọc nhầm.
 *
 * `publish` thiếu `--confirm` thì chỉ in ra thứ sẽ đăng rồi dừng. Bài lên Trang là công khai và
 * không rút lại được với người đã kịp đọc, nên gõ nhầm số bài, hay AI chạy thử, không được đăng luôn.
 *
 * Đi qua Graph API chứ không điều khiển trình duyệt: giao diện Facebook đổi liên tục, còn API có
 * phiên bản và báo lỗi rõ ràng. Cách lấy mã truy cập ở mục 6 của bai-dang-facebook.md.
 */
import { config } from 'dotenv';
import { existsSync, openAsBlob, readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import {
  formatVietnamTime,
  graphErrorHint,
  looksLikeSamePost,
  parseFacebookPosts,
  parseVietnamTime,
  scheduleProblem,
} from '../src/lib/facebook-posts.ts';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

// Phiên bản dùng trong hướng dẫn Pages API, Meta giữ tới 02/2028. Đổi thì đọc changelog trước.
const GRAPH = 'https://graph.facebook.com/v25.0';
const DOC = 'docs/_internal/bai-dang-facebook.md';
const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(args) {
  const out = { positional: [], images: [], at: null, confirm: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--image' || arg === '--at') {
      const value = args[++i];
      if (!value) fail(`Thiếu giá trị sau ${arg}.`);
      if (arg === '--image') out.images.push(value);
      else out.at = value;
    } else if (arg === '--confirm') {
      out.confirm = true;
    } else if (arg.startsWith('--')) {
      fail(`Không hiểu tuỳ chọn ${arg}.`);
    } else {
      out.positional.push(arg);
    }
  }
  return out;
}

function loadPosts() {
  return parseFacebookPosts(readFileSync(new URL(`../${DOC}`, import.meta.url), 'utf8'));
}

function findPost(numberArg) {
  const number = Number(numberArg);
  if (!Number.isInteger(number)) fail('Cần số bài, ví dụ: pnpm fb show 4');
  const matches = loadPosts().filter((p) => p.number === number);
  if (matches.length === 0) fail(`Không có bài đăng số ${number} (có khối \`\`\`text) trong ${DOC}.`);
  if (matches.length > 1) fail(`${DOC} có ${matches.length} mục cùng là bài số ${number} — sửa file cho khỏi trùng rồi chạy lại.`);
  return matches[0];
}

function pageId() {
  const missing = ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'].filter((key) => !process.env[key]);
  if (missing.length > 0) fail(`Thiếu ${missing.join(', ')} trong .env.local — cách lấy ở mục 6 của ${DOC}.`);
  return process.env.FACEBOOK_PAGE_ID;
}

async function graph(method, path, body) {
  // Mã đi trong header chứ không trong URL, để không nằm lại ở log hay lịch sử lệnh nào.
  const res = await fetch(`${GRAPH}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const error = data.error ?? {};
    const hint = graphErrorHint(error.code);
    throw new Error(
      `Facebook báo lỗi (${error.code ?? res.status}): ${error.message ?? res.statusText}` + (hint ? `\n→ ${hint}` : '')
    );
  }
  return data;
}

/** Mã phải là mã của đúng Trang đã khai — dán nhầm mã người dùng thì /me trả về người chứ không phải Trang. */
async function verifyPage(id) {
  const me = await graph('GET', 'me?fields=id,name');
  if (me.id !== id) {
    fail(
      `Mã truy cập đang trỏ vào "${me.name}" (${me.id}), không phải Trang FACEBOOK_PAGE_ID=${id}.\n` +
        '→ Thường là do dán mã người dùng thay vì mã của Trang. Xem bước 4 ở mục 6 của bai-dang-facebook.md.'
    );
  }
  return me.name;
}

async function findDuplicates(id, message) {
  const found = [];
  const posts = await graph('GET', `${id}/posts?fields=message,created_time,permalink_url&limit=50`);
  for (const p of posts.data ?? []) {
    if (looksLikeSamePost(message, p.message ?? '')) {
      found.push(`đã đăng ${formatVietnamTime(new Date(p.created_time))} — ${p.permalink_url ?? p.id}`);
    }
  }
  try {
    const scheduled = await graph('GET', `${id}/scheduled_posts?fields=message,scheduled_publish_time&limit=50`);
    for (const p of scheduled.data ?? []) {
      if (looksLikeSamePost(message, p.message ?? '')) {
        found.push(`đã hẹn đăng ${formatVietnamTime(new Date(p.scheduled_publish_time * 1000))}`);
      }
    }
  } catch (error) {
    console.warn(`Cảnh báo: không đọc được danh sách bài đã hẹn giờ, nên chưa kiểm trùng với chúng.\n${error.message}\n`);
  }
  return found;
}

function checkImages(paths) {
  for (const path of paths) {
    if (!existsSync(path)) fail(`Không thấy ảnh ${path}.`);
    if (!IMAGE_TYPES[extname(path).toLowerCase()]) {
      fail(`${basename(path)}: Facebook nhận ${Object.keys(IMAGE_TYPES).join(', ')}.`);
    }
  }
}

async function uploadPhoto(id, path, scheduled) {
  const form = new FormData();
  form.append('source', await openAsBlob(path, { type: IMAGE_TYPES[extname(path).toLowerCase()] }), basename(path));
  // Ảnh tải lên ở dạng chưa đăng rồi mới gắn vào bài. Bài hẹn giờ thì Meta đòi thêm temporary.
  form.append('published', 'false');
  if (scheduled) form.append('temporary', 'true');
  const photo = await graph('POST', `${id}/photos`, form);
  return photo.id;
}

async function publish(options) {
  const post = findPost(options.positional[0]);
  if (post.alreadyPosted) {
    fail(`Tiêu đề bài số ${post.number} ghi "đã đăng". Muốn đăng lại thì sửa tiêu đề trong ${DOC} trước.`);
  }
  // Bài không ảnh thì không đăng — chủ sản phẩm chốt 15/09/2026. Trên bảng tin, bài chỉ có
  // chữ trôi qua gần như vô hình; chặn ở đây vì chữ dặn trong tài liệu thì lúc vội sẽ quên.
  if (options.images.length === 0) {
    fail(`Bài nào cũng phải kèm ảnh. Thêm --image <đường dẫn ảnh> — lời dặn ảnh nằm ngay trên bài số ${post.number} trong ${DOC}.`);
  }
  checkImages(options.images);

  const at = options.at ? parseVietnamTime(options.at) : null;
  if (at) {
    const problem = scheduleProblem(at, new Date());
    if (problem) fail(problem);
  }

  const id = pageId();
  const pageName = await verifyPage(id);
  const duplicates = await findDuplicates(id, post.message);

  console.log(`Trang:    ${pageName}`);
  console.log(`Bài:      ${post.heading}`);
  console.log(`Lúc đăng: ${at ? `hẹn ${formatVietnamTime(at)} (giờ Việt Nam)` : 'ngay khi chạy lệnh'}`);
  console.log(`Ảnh:      ${options.images.length > 0 ? options.images.map((p) => basename(p)).join(', ') : 'không có ảnh'}`);
  console.log(`\n${'─'.repeat(60)}\n${post.message}\n${'─'.repeat(60)}\n`);

  if (duplicates.length > 0) {
    fail(`Trang đã có bài mở đầu giống hệt bài này, không đăng:\n  ${duplicates.join('\n  ')}`);
  }
  if (!options.confirm) {
    console.log('Chưa đăng gì. Chạy lại đúng lệnh này, thêm --confirm để đăng thật.');
    return;
  }

  const mediaIds = [];
  for (const path of options.images) {
    mediaIds.push(await uploadPhoto(id, path, Boolean(at)));
    console.log(`Đã tải ảnh ${basename(path)}`);
  }

  const body = new URLSearchParams({ message: post.message });
  mediaIds.forEach((mediaId, i) => body.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: mediaId })));
  if (at) {
    // Kiểm lại: tải ảnh có thể đã ngốn mất vài phút của khoảng hẹn.
    const problem = scheduleProblem(at, new Date());
    if (problem) fail(`${problem}\nẢnh đã tải lên nhưng chưa gắn vào bài nào, Facebook tự xoá sau khoảng 24 giờ.`);
    body.append('published', 'false');
    body.append('scheduled_publish_time', String(Math.floor(at.getTime() / 1000)));
  }

  const created = await graph('POST', `${id}/feed`, body);

  if (at) {
    console.log(`\nĐã hẹn đăng bài số ${post.number} lúc ${formatVietnamTime(at)}. Xem hoặc huỷ trong Meta Business Suite → Nội dung → Đã lên lịch.`);
  } else {
    const link = await graph('GET', `${created.id}?fields=permalink_url`).catch(() => ({}));
    console.log(`\nĐã đăng bài số ${post.number}: ${link.permalink_url ?? `https://www.facebook.com/${created.id}`}`);
  }
  console.log(`Nhớ sửa tiêu đề bài số ${post.number} trong ${DOC} — file đó là chỗ duy nhất biết bài nào còn chờ.`);
}

const [command, ...rest] = process.argv.slice(2);
const options = parseArgs(rest);

try {
  if (command === 'list') {
    for (const p of loadPosts()) {
      const firstLine = p.message.split('\n')[0];
      console.log(`Số ${p.number}  ${p.alreadyPosted ? 'đã đăng ' : 'chưa đăng'}  ${firstLine.slice(0, 70)}${firstLine.length > 70 ? '…' : ''}`);
    }
  } else if (command === 'show') {
    const post = findPost(options.positional[0]);
    console.log(`${post.heading}\n\n${post.message}\n\n(${post.message.length} ký tự)`);
  } else if (command === 'check') {
    const id = pageId();
    const name = await verifyPage(id);
    await graph('GET', `${id}/posts?fields=id&limit=1`);
    console.log(`Mã truy cập dùng được cho Trang "${name}" (${id}), đọc được bài trên Trang.`);
    console.log('Quyền đăng bài chỉ biết chắc ở lần đăng đầu tiên — thiếu thì Facebook báo lỗi 200 và không có gì lên Trang.');
  } else if (command === 'publish') {
    await publish(options);
  } else {
    fail('Cách dùng: pnpm fb list | show <số> | check | publish <số> [--image <file>]... [--at "YYYY-MM-DD HH:mm"] [--confirm]');
  }
} catch (error) {
  fail(error.message);
}
