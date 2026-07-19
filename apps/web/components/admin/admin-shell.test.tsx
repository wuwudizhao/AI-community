import type { AuthUser } from '@liftoff/shared-types';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminShell } from './admin-shell';

const { replace, useAuthMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ replace }),
}));
vi.mock('@/components/auth-provider', () => ({ useAuth: useAuthMock }));

const admin = userWithRole('ADMIN');
const user = userWithRole('USER');

describe('AdminShell', () => {
  beforeEach(() => replace.mockReset());

  it('redirects an unauthenticated visitor to the login page', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<AdminShell>Admin content</AdminShell>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?redirect=/admin'));
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders the admin workspace for an ADMIN', () => {
    useAuthMock.mockReturnValue({ user: admin, loading: false });
    render(<AdminShell>Admin content</AdminShell>);

    expect(screen.getByText('Admin content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('keeps an existing ADMIN session in the admin workspace after auth loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    const { rerender } = render(<AdminShell>Admin content</AdminShell>);

    expect(replace).not.toHaveBeenCalled();

    useAuthMock.mockReturnValue({ user: admin, loading: false });
    rerender(<AdminShell>Admin content</AdminShell>);

    expect(screen.getByText('Admin content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('keeps showing 403 for an authenticated USER', () => {
    useAuthMock.mockReturnValue({ user, loading: false });
    render(<AdminShell>Admin content</AdminShell>);

    expect(screen.getByRole('heading', { name: '无权访问管理后台' })).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

function userWithRole(role: AuthUser['role']): AuthUser {
  return {
    id: role.toLowerCase(),
    email: `${role.toLowerCase()}@example.test`,
    username: role.toLowerCase(),
    displayName: role,
    bio: null,
    role,
    status: 'ACTIVE',
    emailVerifiedAt: new Date().toISOString(),
  };
}
