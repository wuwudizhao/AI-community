import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationClient } from './notification-client';

const apiRequest = vi.fn();
const push = vi.fn();
let auth: Record<string, unknown>;
vi.mock('@/components/auth-provider', () => ({ useAuth: () => auth }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

describe('NotificationClient', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    push.mockReset();
  });
  it('shows guest guidance and an authenticated empty state', async () => {
    auth = { user: null, loading: false };
    const { rerender } = render(<NotificationClient />);
    expect(screen.getByRole('link', { name: '前往登录' })).toBeInTheDocument();
    auth = { user: { id: 'a' }, loading: false };
    apiRequest.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    rerender(<NotificationClient />);
    expect(await screen.findByText('暂无通知')).toBeInTheDocument();
  });
  it('renders unread state, marks all read, and follows the safe target', async () => {
    auth = { user: { id: 'a' }, loading: false };
    const data = {
      items: [
        {
          id: 'n1',
          type: 'POST_COMMENTED',
          actor: { id: 'b', username: 'b', displayName: '用户 B' },
          post: { slug: 'hello', title: '标题' },
          commentId: 'c1',
          preview: '内容',
          readAt: null,
          createdAt: '2026-07-13T00:00:00.000Z',
          targetUrl: '/posts/hello#comment-c1',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    };
    apiRequest.mockResolvedValue(data);
    render(<NotificationClient />);
    expect(await screen.findByText('用户 B')).toBeInTheDocument();
    expect(document.querySelector('.is-unread')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '全部标记已读' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'PATCH' }),
    );
    fireEvent.click(screen.getByRole('link'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/posts/hello#comment-c1'));
  });
});
