import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PostDetailShell } from './post-detail-shell';

vi.mock('@/components/comment/comment-section', () => ({
  CommentSection: ({ slug }: { slug: string }) => <section data-testid="comments">{slug}</section>,
}));
vi.mock('@/components/layout/publish-entry', () => ({
  PublishEntry: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('./post-delete-control', () => ({
  PostDeleteControl: () => <button type="button">删除帖子</button>,
}));

const post = {
  id: 'post-1',
  title: 'Liftoff 真实项目复盘',
  slug: 'liftoff-project',
  contentMarkdown: '# Liftoff 真实项目复盘\n\n正文只保留一次标题。',
  category: { key: 'vibe-coding' as const, label: 'Vibe Coding' },
  author: {
    type: 'user' as const,
    id: 'user-1',
    username: 'builder',
    displayName: 'Builder',
    bio: '分享真实构建经验。',
  },
  tags: [{ id: 'tag-1', name: 'Vibe Coding', slug: 'vibe-coding' }],
  status: 'PUBLISHED' as const,
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
  publishedAt: '2026-07-13T00:00:00.000Z',
  commentCount: 3,
  canDelete: false,
};

describe('PostDetailShell', () => {
  it('shows the real title once, real tags, author and comment count', () => {
    render(<PostDetailShell post={post} />);

    expect(screen.getAllByRole('heading', { name: post.title })).toHaveLength(1);
    expect(screen.getByText('#Vibe Coding')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vibe Coding' })).toHaveAttribute(
      'href',
      '/categories/vibe-coding',
    );
    expect(screen.getAllByText('Builder').length).toBeGreaterThan(0);
    expect(screen.getAllByText('@builder').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTestId('comments')).toHaveTextContent(post.slug);
  });

  it('does not expose unimplemented reputation or engagement statistics', () => {
    render(<PostDetailShell post={post} />);

    expect(screen.queryByText(/等级|粉丝|浏览量|点赞|收藏/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /关注/ })).not.toBeInTheDocument();
  });

  it('shows an anonymous author with a stable short label', () => {
    render(
      <PostDetailShell
        post={{
          ...post,
          author: {
            type: 'anonymous' as const,
            displayName: 'Liftoff 访客',
            anonymousLabel: '7F93',
          },
        }}
      />,
    );

    expect(screen.getAllByText('Liftoff 访客 · 7F93').length).toBeGreaterThan(0);
    expect(screen.queryByText('@7F93')).not.toBeInTheDocument();
  });

  it('shows delete control only when the API grants permission', () => {
    const { rerender } = render(<PostDetailShell post={post} />);
    expect(screen.queryByRole('button', { name: '删除帖子' })).not.toBeInTheDocument();
    rerender(<PostDetailShell post={{ ...post, canDelete: true }} />);
    const button = screen.getByRole('button', { name: '删除帖子' });
    expect(button.closest('aside')).toBeInTheDocument();
    expect(button.closest('article')).toBeNull();
  });
});
