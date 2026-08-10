'use client';
import ReactMarkdown from 'react-markdown';
import { AbcjsViewer } from './AbcjsViewer';

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          pre({ children }: any) {
            // react-markdown wraps code blocks in pre. If the child is our AbcjsViewer, we don't want the pre tag.
            // We can check if any child is an abc code block. 
            // A simpler way: if children is an array and contains our element, or we can just render a div instead of pre if it's abc.
            return <div className="markdown-pre-wrapper">{children}</div>;
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
