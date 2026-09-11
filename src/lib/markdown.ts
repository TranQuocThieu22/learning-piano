import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { resolveSheetEmbeds } from './sheet-embed';

const contentDirs = [
  '01-roadmap',
  '02-chapters',
  '03-exercises',
  '07-doc-them',
  '08-bai-hat'
];

/**
 * Vài trường khai ở đầu file bằng YAML. Chỉ thư mục bài hát dùng tới.
 *
 * Vì sao phải khai tay chứ không suy từ nội dung: `nguon` là **lý do bài này
 * được phép có mặt** trong một sản phẩm có bán. Nó phải do người soạn viết ra và
 * đọc lại được, không phải thứ máy đoán. Thiếu nó thì vài tháng sau không ai nhớ
 * bài nào đã kiểm bản quyền, bài nào lỡ đưa vào.
 */
export interface MarkdownMeta {
  /** 1 = chơi được sớm nhất. Chỉ để xếp thứ tự và gắn nhãn. */
  capDo?: number;
  /** Học xong chương này thì đủ sức thử. */
  sauChuong?: number;
  /** Xuất xứ và tình trạng bản quyền, viết cho người đọc hiểu. */
  nguon?: string;
}

export interface MarkdownFile {
  slug: string;
  title: string;
  category: string;
  filePath: string;
  meta: MarkdownMeta;
}

export function getAllMarkdownFiles(): MarkdownFile[] {
  // process.cwd() is the root of the project, content is now in docs/
  const rootDir = path.join(process.cwd(), 'docs');
  const files: MarkdownFile[] = [];

  for (const dir of contentDirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) continue;
    
    const dirFiles = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
    
    for (const file of dirFiles) {
      const filePath = path.join(fullPath, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { content, data } = matter(raw);
      const h1Match = content.match(/^#\s+(.*)/m);
      const title = h1Match ? h1Match[1] : file.replace('.md', '');

      files.push({
        slug: file.replace('.md', ''),
        title,
        category: dir,
        filePath: path.join(dir, file).replace(/\\/g, '/'),
        meta: data as MarkdownMeta
      });
    }
  }

  return files;
}

export function getMarkdownContent(relativePath: string): string | null {
  const rootDir = path.join(process.cwd(), 'docs');
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  /*
   * Cắt bỏ phần khai báo ở đầu file trước khi trả về. Không cắt thì nó hiện
   * nguyên si mấy dòng `capDo: 1` lên đầu trang cho người học đọc.
   */
  const { content } = matter(fs.readFileSync(fullPath, 'utf-8'));
  // Nhúng bản nhạc của bài khác vào ngay chỗ cần, xem sheet-embed.ts.
  return resolveSheetEmbeds(content);
}
