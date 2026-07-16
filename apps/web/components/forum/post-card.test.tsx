import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PostSummary } from '@/lib/posts';
import { FORUM_CATEGORIES } from '@/lib/forum-categories';
import { PostCard } from './post-card';

const post: PostSummary = {
  id: 'post-1',
  title: '用 AI 验证一个真实项目机会',
  slug: 'real-opportunity',
  excerpt: '记录需求验证过程和真实结果。',
  category: { key: 'money-opportunity', label: '赚钱机会' },
  author: { type: 'user', id: 'user-1', username: 'builder', displayName: 'Builder', bio: null },
  tags: [{ id: 'tag-1', name: '项目验证', slug: 'validation' }],
  status: 'PUBLISHED',
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
  publishedAt: '2026-07-14T00:00:00.000Z',
  commentCount: 7,
};

describe('PostCard', () => {
  it('renders only real post fields in the horizontal feed row', () => {
    const { container } = render(<PostCard post={post} />);

    expect(screen.getByRole('link', { name: /用 AI 验证一个真实项目机会/ })).toHaveAttribute(
      'href',
      '/posts/real-opportunity',
    );
    expect(screen.getByText('#项目验证')).toBeInTheDocument();
    expect(screen.getByLabelText('7 条评论')).toHaveTextContent('7');
    expect(screen.queryByText(/收入|启动成本|浏览量|点赞/)).not.toBeInTheDocument();
    const coin = container.querySelector<HTMLImageElement>(
      '[data-category-icon="money-opportunity"] .pixel-coin-icon',
    );
    expect(coin).toBeInTheDocument();
    expect(decodeURIComponent(coin!.src)).toContain('/icons/pixel/coin.png');
  });

  it('falls back to the document icon only for an unknown category key', () => {
    const { container } = render(
      <PostCard
        post={{
          ...post,
          category: { key: 'unknown' as PostSummary['category']['key'], label: 'Unknown' },
        }}
      />,
    );
    expect(
      container.querySelector('[data-category-icon="fallback"] .lucide-file-text'),
    ).toBeInTheDocument();
  });

  it('resolves every configured category to a real category icon', () => {
    const { container } = render(
      <>
        {FORUM_CATEGORIES.map((category) => (
          <PostCard
            key={category.key}
            post={{
              ...post,
              id: category.key,
              slug: category.slug,
              category: { key: category.key, label: category.label },
            }}
          />
        ))}
      </>,
    );
    for (const category of FORUM_CATEGORIES) {
      const iconSelector =
        category.key === 'money-opportunity'
          ? '.pixel-coin-icon'
          : category.key === 'project-breakdown'
            ? '.pixel-project-analysis-icon'
            : '.forum-category-icon';
      expect(
        container.querySelector(`[data-category-icon="${category.key}"] ${iconSelector}`),
      ).toBeInTheDocument();
    }
    const breakdown = container.querySelector<HTMLImageElement>(
      '[data-category-icon="project-breakdown"] .post-card-pixel-project-analysis',
    );
    expect(breakdown).toBeInTheDocument();
    expect(decodeURIComponent(breakdown!.src)).toContain('/icons/project-analysis.png');
    expect(container.querySelector('[data-category-icon="fallback"]')).not.toBeInTheDocument();
  });

  it('shows the stable short label for an anonymous author', () => {
    const anonymousPost: PostSummary = {
      ...post,
      id: 'anonymous-post',
      slug: 'anonymous-post',
      author: { type: 'anonymous', displayName: 'Liftoff 访客', anonymousLabel: '7F93' },
    };
    render(<PostCard post={anonymousPost} />);

    expect(screen.getByText('Liftoff 访客 · 7F93')).toBeInTheDocument();
    expect(screen.queryByText('@7F93')).not.toBeInTheDocument();
  });

  it('shows the same label on multiple posts from one anonymous identity', () => {
    const author = {
      type: 'anonymous' as const,
      displayName: 'Liftoff 访客',
      anonymousLabel: 'A12B',
    };
    render(
      <>
        <PostCard post={{ ...post, id: 'anonymous-1', slug: 'anonymous-1', author }} />
        <PostCard post={{ ...post, id: 'anonymous-2', slug: 'anonymous-2', author }} />
      </>,
    );

    expect(screen.getAllByText('Liftoff 访客 · A12B')).toHaveLength(2);
  });
});
