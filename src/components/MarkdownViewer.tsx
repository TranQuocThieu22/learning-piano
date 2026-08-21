'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AbcjsViewer } from './AbcjsViewer';

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

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        // remark-gfm adds tables, strikethrough, task lists and autolinks,
        // none of which react-markdown supports out of the box.
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }: any) {
            // react-markdown wraps code blocks in pre. If the child is our AbcjsViewer, we don't want the pre tag.
            return <div className="markdown-pre-wrapper">{children}</div>;
          },
          table({ children }: any) {
            // Wrapper lets wide tables scroll on their own instead of
            // forcing the whole page to scroll sideways on mobile.
            return (
              <div className="markdown-table-wrapper">
                <table>{children}</table>
              </div>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match && match[1] === 'abc') {
              return <AbcjsViewer abcNotation={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {renderAlertMarkers(content)}
      </ReactMarkdown>
    </div>
  );
}
