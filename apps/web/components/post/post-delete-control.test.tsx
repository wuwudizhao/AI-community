import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { PostDeleteControl } from './post-delete-control';

const apiRequest = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, apiRequest: (...args: unknown[]) => apiRequest(...args) };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

describe('PostDeleteControl', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    push.mockReset();
    refresh.mockReset();
  });

  it('does not open automatically and cancellation does not delete', () => {
    render(<PostDeleteControl slug="post-one" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '删除帖子' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('删除后将无法恢复，请确认是否继续。');
    expect(screen.getByRole('button', { name: '取消' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(apiRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click and Escape without deleting', () => {
    render(<PostDeleteControl slug="post-one" />);
    const trigger = screen.getByRole('button', { name: '删除帖子' });
    fireEvent.click(trigger);
    fireEvent.mouseDown(screen.getByTestId('delete-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('deletes once and redirects to the homepage notice', async () => {
    let resolve!: () => void;
    apiRequest.mockReturnValue(new Promise<void>((done) => (resolve = done)));
    render(<PostDeleteControl slug="post-one" />);
    fireEvent.click(screen.getByRole('button', { name: '删除帖子' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(screen.getByRole('button', { name: '正在删除…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '正在删除…' }));
    expect(apiRequest).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/?postDeleted=1'));
  });

  it.each([
    [403, '你没有权限删除这篇帖子'],
    [404, '帖子不存在或已被删除'],
    [429, '操作过于频繁，请稍后再试'],
    [500, '删除失败，请稍后重试'],
  ])('shows the mapped error for %s', async (status, message) => {
    apiRequest.mockRejectedValue(new ApiError(status, 'server error'));
    render(<PostDeleteControl slug={`post-${status}`} />);
    fireEvent.click(screen.getByRole('button', { name: '删除帖子' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
