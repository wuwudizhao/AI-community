import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostInteractionButtons } from './post-interaction-buttons';

const apiRequest = vi.fn();
let user: { id: string } | null = { id: 'user-1' };
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user, loading: false }),
}));
vi.mock('@/lib/api', () => ({ apiRequest: (...args: unknown[]) => apiRequest(...args) }));

describe('PostInteractionButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    user = { id: 'user-1' };
  });
  it('optimistically likes and applies the server result', async () => {
    apiRequest.mockResolvedValue({ liked: true, likeCount: 3 });
    render(<PostInteractionButtons slug="test" initialLiked={false} initialLikeCount={2} />);
    fireEvent.click(screen.getByRole('button', { name: '点赞' }));
    expect(screen.getByText('3')).toBeInTheDocument();
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/posts/test/like', { method: 'PUT' }),
    );
    expect(screen.getByRole('button', { name: '取消点赞' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
  it('rolls back a failed optimistic update', async () => {
    apiRequest.mockRejectedValue(new Error('offline'));
    render(<PostInteractionButtons slug="test" initialLiked={false} initialLikeCount={2} />);
    fireEvent.click(screen.getByRole('button', { name: '点赞' }));
    await screen.findByText('点赞操作失败，请重试');
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  it('links unauthenticated users to login without writing', () => {
    user = null;
    render(<PostInteractionButtons slug="test" initialLiked={false} initialLikeCount={0} />);
    expect(screen.getByRole('link', { name: '登录后点赞' })).toHaveAttribute(
      'href',
      '/login?next=%2Fposts%2Ftest',
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it('toggles bookmark state without exposing a public count', async () => {
    apiRequest.mockResolvedValue({ bookmarked: true });
    render(
      <PostInteractionButtons
        slug="test"
        initialLiked={false}
        initialLikeCount={0}
        initialBookmarked={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '收藏' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/posts/test/bookmark', { method: 'PUT' }),
    );
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
  });
});
