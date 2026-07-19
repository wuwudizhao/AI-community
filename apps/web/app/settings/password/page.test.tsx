import type { AuthUser } from '@liftoff/shared-types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PasswordSettingsPage from './page';

const { replace, useAuthMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/components/auth-provider', () => ({ useAuth: useAuthMock }));

const user: AuthUser = {
  id: 'user-id',
  email: 'user@example.test',
  username: 'user',
  displayName: 'User',
  bio: null,
  role: 'USER',
  status: 'ACTIVE',
  emailVerifiedAt: new Date().toISOString(),
};

describe('PasswordSettingsPage', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(fetch).mockClear();
    useAuthMock.mockReturnValue({ user, loading: false });
  });

  it('renders all password fields for an authenticated user', () => {
    render(<PasswordSettingsPage />);

    expect(screen.getByRole('heading', { name: '修改密码' })).toBeInTheDocument();
    expect(screen.getByLabelText('当前密码')).toBeInTheDocument();
    expect(screen.getByLabelText('新密码')).toBeInTheDocument();
    expect(screen.getByLabelText('确认密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '修改密码' })).toBeInTheDocument();
  });

  it('validates password confirmation before calling the API', () => {
    render(<PasswordSettingsPage />);
    fillPasswords('StrongPass123', 'NewStrongPass456', 'DifferentPass789');
    fireEvent.submit(screen.getByRole('button', { name: '修改密码' }).closest('form')!);

    expect(screen.getByRole('alert')).toHaveTextContent('两次输入的新密码不一致');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows the re-login message after a successful password change', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '密码修改成功，请重新登录。' }), { status: 200 }),
    );
    render(<PasswordSettingsPage />);
    fillPasswords('StrongPass123', 'NewStrongPass456', 'NewStrongPass456');
    fireEvent.submit(screen.getByRole('button', { name: '修改密码' }).closest('form')!);

    expect(await screen.findByText('密码修改成功，请重新登录。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '前往登录' })).toHaveAttribute('href', '/login');
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  });
});

function fillPasswords(currentPassword: string, newPassword: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText('当前密码'), { target: { value: currentPassword } });
  fireEvent.change(screen.getByLabelText('新密码'), { target: { value: newPassword } });
  fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: confirmPassword } });
}
