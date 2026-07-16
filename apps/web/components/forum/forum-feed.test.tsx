import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedSkeleton, ForumFeed } from './forum-feed';

const navigation = vi.hoisted(() => ({ pathname: '/', search: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/components/feature-flags-provider', () => ({
  useFeatureFlags: () => ({ allowGuestPosting: true }),
}));

const emptyPage = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  },
};

function response(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('ForumFeed', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    navigation.pathname = '/';
    navigation.search = '';
  });

  it('shows eight loading skeletons matching the final grid', () => {
    render(<FeedSkeleton />);

    expect(screen.getByLabelText('正在加载帖子')).toBeInTheDocument();
    expect(document.querySelectorAll('.feed-card-skeleton')).toHaveLength(8);
  });

  it('shows a safe error and lets the user retry', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ message: '内部错误细节' }, false, 500))
      .mockResolvedValueOnce(response(emptyPage));
    render(<ForumFeed />);

    expect(await screen.findByText('帖子加载失败')).toBeInTheDocument();
    expect(screen.queryByText('内部错误细节')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /重试/ }));
    expect(await screen.findByText('还没有帖子')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '发布帖子' })).toHaveAttribute('href', '/posts/new');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('renders only real post fields and the real comment count without fake likes', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({
        items: [
          {
            id: 'post-1',
            title: '真实 Agent 项目复盘',
            slug: 'real-agent-retrospective',
            excerpt: '这是一段来自真实 API 的摘要。',
            category: { key: 'agent', label: 'Agent' },
            status: 'PUBLISHED',
            author: {
              type: 'user',
              id: 'user-1',
              username: 'builder',
              displayName: 'Builder',
              bio: null,
            },
            tags: [{ id: 'tag-1', name: 'Agent', slug: 'agent' }],
            createdAt: '2026-07-13T00:00:00.000Z',
            updatedAt: '2026-07-13T00:00:00.000Z',
            publishedAt: '2026-07-13T00:00:00.000Z',
            commentCount: 3,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }),
    );
    render(<ForumFeed />);

    expect(await screen.findByText('真实 Agent 项目复盘')).toBeInTheDocument();
    expect(screen.getByLabelText('3 条评论')).toBeInTheDocument();
    expect(screen.queryByText(/点赞/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /真实 Agent 项目复盘/ })).toHaveAttribute(
      'href',
      '/posts/real-agent-retrospective',
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it('requests a server-filtered opportunity tag and keeps the channel empty state truthful', async () => {
    vi.mocked(fetch).mockResolvedValue(response(emptyPage));
    render(
      <ForumFeed
        tag="赚钱机会"
        title="赚钱机会"
        emptyTitle="还没有赚钱机会"
        emptyDescription="分享你发现的 AI 商业机会，帮助大家判断它是否值得验证。"
        publishLabel="发布第一个赚钱机会"
        publishHref="/posts/new?tag=赚钱机会"
      />,
    );

    expect(await screen.findByText('还没有赚钱机会')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '发布第一个赚钱机会' })).toHaveAttribute(
      'href',
      '/posts/new?tag=赚钱机会',
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('tag=%E8%B5%9A%E9%92%B1%E6%9C%BA%E4%BC%9A'),
      expect.anything(),
    );
  });

  it('requests a stable category filter and shows the shared empty state with a post count', async () => {
    vi.mocked(fetch).mockResolvedValue(response(emptyPage));
    render(
      <ForumFeed
        category="agent"
        activeCategory="agent"
        title="Agent"
        emptyTitle="这里还没有帖子"
        emptyDescription="成为第一个分享经验的人。"
      />,
    );

    expect(await screen.findByText('这里还没有帖子')).toBeInTheDocument();
    expect(screen.getByText('共 0 篇 · 最新发布')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=agent'),
      expect.anything(),
    );
  });

  it('uses 20 items per page and renders real links that preserve the current route and query', async () => {
    navigation.pathname = '/search';
    navigation.search = 'q=agent&page=2';
    vi.mocked(fetch).mockResolvedValue(
      response({
        items: [],
        pagination: {
          page: 2,
          pageSize: 20,
          totalItems: 45,
          totalPages: 3,
          hasPreviousPage: true,
          hasNextPage: true,
        },
      }),
    );
    render(<ForumFeed query="agent" />);

    expect(await screen.findByText('共 45 篇 · 最新发布')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2&pageSize=20'),
      expect.anything(),
    );
    expect(screen.getByRole('link', { name: '上一页' })).toHaveAttribute('href', '/search?q=agent');
    expect(screen.getByRole('link', { name: '下一页' })).toHaveAttribute(
      'href',
      '/search?q=agent&page=3',
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows an explicit not-found state instead of a blank out-of-range page', async () => {
    navigation.search = 'page=99';
    vi.mocked(fetch).mockResolvedValue(response({ message: '分页不存在' }, false, 404));
    render(<ForumFeed />);

    expect(await screen.findByText('分页不存在')).toBeInTheDocument();
    expect(screen.getByText('当前页码超出帖子总页数，请返回上一页。')).toBeInTheDocument();
  });
});
