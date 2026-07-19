import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentSection } from './comment-section';

const apiRequest = vi.fn();
let user: null | {
  id: string;
  role: string;
  username: string;
  displayName: string;
} = null;
vi.mock('@/components/auth-provider', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

const page = {
  items: [
    {
      id: 'root',
      content: '一级评论',
      placeholder: null,
      status: 'PUBLISHED',
      author: { id: 'b', username: 'b', displayName: '用户 B' },
      parentId: null,
      replyToUser: null,
      createdAt: '2026-07-13T00:00:00.000Z',
      updatedAt: '2026-07-13T00:00:00.000Z',
      canDelete: false,
      replyCount: 1,
      replies: [
        {
          id: 'reply',
          content: '二级回复',
          placeholder: null,
          status: 'PUBLISHED',
          author: { id: 'a', username: 'a', displayName: '用户 A' },
          parentId: 'root',
          replyToUser: { id: 'b', username: 'b', displayName: '用户 B' },
          createdAt: '2026-07-13T00:01:00.000Z',
          updatedAt: '2026-07-13T00:01:00.000Z',
          canDelete: false,
        },
      ],
    },
    {
      id: 'deleted',
      content: null,
      placeholder: '该评论已删除',
      status: 'DELETED',
      author: { id: 'b', username: 'b', displayName: '用户 B' },
      parentId: null,
      replyToUser: null,
      createdAt: '2026-07-13T00:02:00.000Z',
      updatedAt: '2026-07-13T00:02:00.000Z',
      canDelete: false,
      replies: [],
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
};

describe('CommentSection', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    user = null;
    window.history.replaceState(null, '', '/');
  });
  it('shows guest guidance, comments, replies and deleted placeholders', async () => {
    apiRequest.mockResolvedValue(page);
    render(<CommentSection slug="hello" />);
    expect(screen.getByRole('link', { name: '登录后参与评论' })).toBeInTheDocument();
    expect(await screen.findByText('一级评论')).toBeInTheDocument();
    expect(screen.getByText('二级回复')).toBeInTheDocument();
    expect(screen.getByText('该评论已删除')).toBeInTheDocument();
    expect(document.querySelector('#comment-reply')).not.toBeNull();
    expect(document.querySelector('#comment-deleted')).not.toBeNull();
  });
  it('scrolls to and highlights a root or reply comment from the URL hash', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    window.history.replaceState(null, '', '/posts/hello#comment-reply');
    apiRequest.mockResolvedValue(page);

    render(<CommentSection slug="hello" />);

    await screen.findByText('二级回复');
    await waitFor(() =>
      expect(document.querySelector('#comment-reply')).toHaveClass('is-targeted'),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
  it('publishes successfully and reloads the real list', async () => {
    user = { id: 'a', role: 'USER', username: 'a', displayName: '用户 A' };
    apiRequest.mockResolvedValueOnce(page).mockResolvedValueOnce({}).mockResolvedValueOnce(page);
    render(<CommentSection slug="hello" />);
    const input = await screen.findByPlaceholderText('写下你的看法…');
    fireEvent.change(input, { target: { value: '新的评论' } });
    fireEvent.click(screen.getByRole('button', { name: '发表评论' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/posts/hello/comments',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(input).toHaveValue('');
  });
  it('preserves input on publication failure and confirms deletion', async () => {
    user = { id: 'b', role: 'USER', username: 'b', displayName: '用户 B' };
    apiRequest.mockResolvedValueOnce(page).mockRejectedValueOnce(new Error('down'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CommentSection slug="hello" />);
    const input = await screen.findByPlaceholderText('写下你的看法…');
    fireEvent.change(input, { target: { value: '保留我' } });
    fireEvent.click(screen.getByRole('button', { name: '发表评论' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('评论暂时无法处理');
    expect(input).toHaveValue('保留我');
    apiRequest.mockResolvedValueOnce({}).mockResolvedValueOnce(page);
    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
  });
});
