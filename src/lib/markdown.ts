import fs from 'fs';
import path from 'path';

const contentDirs = [
  '01-roadmap',
  '02-lessons',
  '03-exercises',
  '05-learning-logs'
];

export interface MarkdownFile {
  slug: string;
  title: string;
  category: string;
  filePath: string;
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
      const content = fs.readFileSync(filePath, 'utf-8');
      const h1Match = content.match(/^#\s+(.*)/m);
      const title = h1Match ? h1Match[1] : file.replace('.md', '');
      
      files.push({
        slug: file.replace('.md', ''),
        title,
        category: dir,
        filePath: path.join(dir, file).replace(/\\/g, '/')
      });
    }
  }

  return files;
}

export function getMarkdownContent(relativePath: string): string | null {
  const rootDir = path.join(process.cwd(), 'docs');
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}
