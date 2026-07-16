import type { ReactNode } from 'react';
import { MarkdownContent } from './markdown-content';

function normalizeHeading(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function dedupeLeadingTitleHeading(markdown: string, title: string) {
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const firstContentLine = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentLine < 0) return markdown;

  const heading = /^\s{0,3}#\s+(.+?)\s*#?\s*$/.exec(lines[firstContentLine]);
  if (!heading || normalizeHeading(heading[1]) !== normalizeHeading(title)) return markdown;

  lines.splice(firstContentLine, 1);
  if (lines[firstContentLine]?.trim() === '') lines.splice(firstContentLine, 1);
  return lines.join('\n').replace(/^\s+/, '');
}

export function PostContent({ title, children }: { title: string; children: string }): ReactNode {
  return (
    <div className="post-content markdown-body">
      <MarkdownContent>{dedupeLeadingTitleHeading(children, title)}</MarkdownContent>
    </div>
  );
}
