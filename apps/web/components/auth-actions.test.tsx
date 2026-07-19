import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthActions } from './auth-actions';

const logout = vi.fn().mockResolvedValue(undefined);
let authState: Record<string, unknown>;

vi.mock('./auth-provider', () => ({ useAuth: () => authState }));

describe('AuthActions', () => {
  beforeEach(() => {
    logout.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ count: 120 }),
      }),
    );
  });

  it('shows login and registration for guests', () => {
    authState = { user: null, loading: false, logout };
    render(<AuthActions />);
    expect(screen.getByRole('link', { name: '登录' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '注册' })).toHaveAttribute('href', '/register');
  });

  it('shows real identity, real unread count, and logs out through the auth provider', async () => {
    authState = {
      user: { username: 'builder', displayName: '真实用户', role: 'ADMIN' },
      loading: false,
      logout,
    };
    render(<AuthActions />);
    expect(screen.getByText('真实用户')).toBeInTheDocument();
    expect(await screen.findByText('99+')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '修改密码' })).toHaveAttribute(
      'href',
      '/settings/password',
    );
    expect(screen.getByRole('link', { name: '管理后台' })).toHaveAttribute('href', '/admin');
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });
});
