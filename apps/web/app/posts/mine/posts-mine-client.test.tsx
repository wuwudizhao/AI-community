import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MinePostsClient } from './posts-mine-client';

const navigation = vi.hoisted(() => ({ search: 'page=2' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/posts/mine',
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    loading: false,
    user: { id: 'owner-1', username: 'owner', displayName: 'Owner' },
  }),
}));

function response(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

describe('MinePostsClient pagination', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('uses the URL page, a fixed page size of 20, and real pagination links', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({
        items: [
          {
            id: 'mine-21',
            title: '我的第二页帖子',
            slug: 'mine-page-two',
            excerpt: '正文摘要',
            author: {
              type: 'user',
              id: 'owner-1',
              username: 'owner',
              displayName: 'Owner',
              bio: null,
            },
            category: { key: 'agent', label: 'Agent' },
            tags: [],
            status: 'PUBLISHED',
            createdAt: '2026-07-15T00:00:00.000Z',
            updatedAt: '2026-07-15T00:00:00.000Z',
            publishedAt: '2026-07-15T00:00:00.000Z',
            commentCount: 0,
          },
        ],
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
    render(<MinePostsClient />);

    expect(await screen.findByText('我的第二页帖子')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/posts/mine?page=2&pageSize=20'),
      expect.anything(),
    );
    expect(screen.getByRole('link', { name: '上一页' })).toHaveAttribute('href', '/posts/mine');
    expect(screen.getByRole('link', { name: '下一页' })).toHaveAttribute(
      'href',
      '/posts/mine?page=3',
    );
  });
});
