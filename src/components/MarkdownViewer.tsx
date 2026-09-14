'use client';
import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { SheetViewer } from './SheetViewer';
import { KeyboardDiagram } from './KeyboardDiagram';
import { addSlug, playedThroughStore } from '@/lib/slug-list';

/**
 * GitHub-style alert markers (`> [!WARNING]`) are not part of CommonMark or GFM,
 * so react-markdown would print them literally. We rewrite the marker line into a
 * bold label, which keeps the surrounding blockquote intact and renders nicely.
 */
const ALERT_LABELS: Record<string, string> = {
  NOTE: '📝 Ghi chú',
  TIP: '💡 Mẹo',
  IMPORTANT: '❗ Quan trọng',
  WARNING: '⚠️ Lưu ý',
  CAUTION: '🚨 Cẩn thận',
};

function renderAlertMarkers(markdown: string): string {
  return markdown.replace(
    /^(\s*>\s*)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gim,
    (_match, prefix: string, kind: string) =>
      `${prefix}**${ALERT_LABELS[kind.toUpperCase()]}**`
  );
}

/**
 * Cố ý KHÔNG trải `...props` xuống thẻ DOM.
 *
 * react-markdown truyền kèm một prop `node` (cây hast) cho mọi component. Trải
 * nguyên props là ném `node` vào thẻ thật, React cảnh báo thuộc tính lạ. Nội dung
 * ở đây là Markdown thuần, không bật `rehype-raw`, nên thuộc tính duy nhất cần
 * giữ là `title` của liên kết — liệt kê thẳng ra vừa đúng vừa khỏi phải lọc `node`.
 */
function buildComponents(onPlayedThrough?: () => void): Components {
  return {
    pre({ children }) {
      // react-markdown bọc khối mã trong <pre>. Nếu con là SheetViewer thì không
      // muốn thẻ <pre> nữa.
      return <div className="markdown-pre-wrapper">{children}</div>;
    },

    a({ href, title, children }) {
      // Liên kết nội bộ đi qua next/link để chuyển trang không tải lại;
      // liên kết ngoài mở tab mới.
      if (href?.startsWith('/')) {
        return <Link href={href}>{children}</Link>;
      }
      return (
        <a href={href} title={title} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },

    table({ children }) {
      // Bọc thêm một lớp để bảng rộng tự cuộn ngang, thay vì bắt cả trang
      // cuộn ngang trên điện thoại.
      return (
        <div className="markdown-table-wrapper">
          <table>{children}</table>
        </div>
      );
    },

    code({ className, children }) {
      // Từ react-markdown v9 không còn prop `inline` nữa; phân biệt khối mã với
      // mã nội dòng bằng chính lớp `language-*` mà GFM gắn cho khối có tên ngôn ngữ.
      const match = /language-(\w+)/.exec(className ?? '');
      if (match?.[1] === 'abc') {
        return (
          <SheetViewer
            abcNotation={String(children).replace(/\n$/, '')}
            onPlayedThrough={onPlayedThrough}
          />
        );
      }
      // Hình bàn phím minh hoạ một thế bấm — xem `keyboard-diagram.ts`.
      if (match?.[1] === 'keys') {
        return <KeyboardDiagram spec={String(children)} />;
      }
      return <code className={className}>{children}</code>;
    },
  };
}

/**
 * `lessonSlug` chỉ truyền ở trang bài học trên đường đi. Có nó thì đánh trọn bất
 * kỳ bản nhạc nào trong bài với đàn sẽ được ghi lại để nút tick khen một câu —
 * xem `LessonTickButton`. Trang Lộ trình, Đọc thêm, Góc bài hát không truyền: ở
 * đó không có nút tick nào để khen cạnh.
 */
export function MarkdownViewer({ content, lessonSlug }: { content: string; lessonSlug?: string }) {
  /*
   * Dựng lại bộ component chỉ khi đổi bài. Tạo mới mỗi lần vẽ thì react-markdown
   * coi mọi khuông nhạc là component khác và dựng lại từ đầu — mất luôn phần tập
   * với đàn đang mở dở.
   */
  const components = useMemo(
    () => buildComponents(lessonSlug ? () => addSlug(playedThroughStore, lessonSlug) : undefined),
    [lessonSlug],
  );

  return (
    <div className="markdown-body">
      <ReactMarkdown
        // remark-gfm adds tables, strikethrough, task lists and autolinks,
        // none of which react-markdown supports out of the box.
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {renderAlertMarkers(content)}
      </ReactMarkdown>
    </div>
  );
}
