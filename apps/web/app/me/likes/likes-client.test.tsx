import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LikesClient } from './likes-client';

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  replace: vi.fn(),
  auth: { user: null as null | { id: string }, loading: false },
}));

vi.mock('@/components/auth-provider', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/lib/api', () => ({ apiRequest: mocks.apiRequest }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/me/likes',
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/forum/forum-feed', () => ({
  FeedSkeleton: () => <div>正在加载</div>,
}));
vi.mock('@/components/forum/post-card', () => ({
  PostCard: ({ post }: { post: { title: string } }) => <article>{post.title}</article>,
}));

const pagination = {
  page: 1,
  pageSize: 20,
  totalItems: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('LikesClient', () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.replace.mockReset();
    mocks.auth = { user: { id: 'user-1' }, loading: false };
  });

  it('renders liked posts and their like time', async () => {
    mocks.apiRequest.mockResolvedValue({
      items: [
        {
          id: 'post-1',
          title: '一篇点赞过的帖子',
          slug: 'liked-post',
          likedAt: '2026-07-20T02:00:00.000Z',
        },
      ],
      pagination,
    });

    render(<LikesClient />);

    expect(await screen.findByText('一篇点赞过的帖子')).toBeInTheDocument();
    expect(screen.getByText('点赞于：')).toBeInTheDocument();
    expect(mocks.apiRequest).toHaveBeenCalledWith('/posts/likes?page=1&pageSize=20');
  });

  it('renders the empty state', async () => {
    mocks.apiRequest.mockResolvedValue({
      items: [],
      pagination: { ...pagination, totalItems: 0, totalPages: 0 },
    });

    render(<LikesClient />);

    expect(await screen.findByText('还没有点赞')).toBeInTheDocument();
  });

  it('redirects signed-out users to login and keeps a fallback link', async () => {
    mocks.auth = { user: null, loading: false };

    render(<LikesClient />);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/login?redirect=%2Fme%2Flikes'),
    );
    expect(screen.getByRole('link', { name: '前往登录' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Fme%2Flikes',
    );
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });
});
