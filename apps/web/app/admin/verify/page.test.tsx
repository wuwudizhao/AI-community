import type { AuthUser } from '@liftoff/shared-types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminVerifyPage from './page';

const { refresh, replace, useAuthMock } = vi.hoisted(() => ({
  refresh: vi.fn().mockResolvedValue(undefined),
  replace: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/components/auth-provider', () => ({ useAuth: useAuthMock }));

const admin: AuthUser = {
  id: 'admin-id',
  email: 'admin@example.test',
  username: 'admin',
  displayName: 'Admin',
  bio: null,
  role: 'ADMIN',
  status: 'ACTIVE',
  emailVerifiedAt: new Date().toISOString(),
  adminVerifiedUntil: null,
};

describe('AdminVerifyPage', () => {
  beforeEach(() => {
    history.replaceState({}, '', '/admin/verify?redirect=/admin/posts');
    replace.mockReset();
    refresh.mockClear();
    vi.mocked(fetch).mockReset();
    useAuthMock.mockReturnValue({ user: admin, refresh });
  });

  it('shows the current administrator without asking for an email', () => {
    render(<AdminVerifyPage />);

    expect(screen.getByText('admin@example.test')).toBeInTheDocument();
    expect(screen.getByLabelText('当前密码')).toBeInTheDocument();
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument();
  });

  it('returns to the original admin path after a correct password', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '管理员身份验证成功' }), { status: 200 }),
    );
    render(<AdminVerifyPage />);
    fireEvent.change(screen.getByLabelText('当前密码'), { target: { value: 'StrongPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: '进入管理后台' }).closest('form')!);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/posts'));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('shows a clear error when the password is incorrect', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '密码不正确，请重新输入。' }), { status: 400 }),
    );
    render(<AdminVerifyPage />);
    fireEvent.change(screen.getByLabelText('当前密码'), { target: { value: 'WrongPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: '进入管理后台' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('密码不正确，请重新输入。');
    expect(replace).not.toHaveBeenCalled();
  });
});
