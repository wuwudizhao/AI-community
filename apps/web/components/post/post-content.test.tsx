import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { dedupeLeadingTitleHeading, PostContent } from './post-content';

describe('PostContent', () => {
  it('removes only an identical first H1 from historical content', () => {
    const markdown = '# 同名标题\n\n正文内容\n\n## 子标题';
    expect(dedupeLeadingTitleHeading(markdown, '同名标题')).toBe('正文内容\n\n## 子标题');

    render(<PostContent title="同名标题">{markdown}</PostContent>);
    expect(screen.queryByRole('heading', { name: '同名标题' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '子标题' })).toBeInTheDocument();
    expect(screen.getByText('正文内容')).toBeInTheDocument();
  });

  it('keeps a distinct first H1 and does not rewrite later headings', () => {
    const markdown = '# 正文自己的标题\n\n内容\n\n# 页面标题';
    expect(dedupeLeadingTitleHeading(markdown, '页面标题')).toBe(markdown);
  });

  it('renders a new post body from its first subsection without repeating the page title', () => {
    render(<PostContent title="我的帖子标题">{'## 第一部分\n\n正文内容'}</PostContent>);
    expect(screen.queryByText('我的帖子标题')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '第一部分' })).toBeInTheDocument();
    expect(screen.getByText('正文内容')).toBeInTheDocument();
  });
});
