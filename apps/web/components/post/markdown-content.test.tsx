import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownContent } from './markdown-content';

describe('MarkdownContent', () => {
  it('renders basic Markdown and code without injecting raw script HTML', () => {
    const { container } = render(
      <MarkdownContent>
        {'# Safe\n\n<script>alert(1)</script>\n\n```ts\nconst ok = true\n```'}
      </MarkdownContent>,
    );
    expect(screen.getByRole('heading', { name: 'Safe' })).toBeInTheDocument();
    expect(screen.getByText('const ok = true')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('renders Markdown images while continuing to ignore raw HTML images', () => {
    const { container } = render(
      <MarkdownContent>
        {
          '![正文图片](http://localhost:4000/api/post-images/cmrpostimage000000000001)\n\n<img src="https://evil.example/raw.png">'
        }
      </MarkdownContent>,
    );
    expect(screen.getByRole('img', { name: '正文图片' })).toHaveAttribute(
      'src',
      'http://localhost:4000/api/post-images/cmrpostimage000000000001',
    );
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});
