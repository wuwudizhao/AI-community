import type { AuthUser } from '@liftoff/shared-types';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminShell } from './admin-shell';

const { replace, useAuthMock, usePathnameMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({ replace }),
}));
vi.mock('@/components/auth-provider', () => ({ useAuth: useAuthMock }));

const admin = userWithRole('ADMIN');
const user = userWithRole('USER');

describe('AdminShell', () => {
  beforeEach(() => {
    replace.mockReset();
    usePathnameMock.mockReturnValue('/admin');
  });

  it('redirects an unauthenticated visitor to the login page', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<AdminShell>Admin content</AdminShell>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?redirect=/admin'));
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('redirects an unverified ADMIN to secondary verification', async () => {
    useAuthMock.mockReturnValue({ user: adminWithVerification(null), loading: false });
    render(<AdminShell>Admin content</AdminShell>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/verify?redirect=/admin'));
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('keeps an existing verified ADMIN session in the admin workspace after auth loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    const { rerender } = render(<AdminShell>Admin content</AdminShell>);

    expect(replace).not.toHaveBeenCalled();

    useAuthMock.mockReturnValue({
      user: adminWithVerification(activeVerification()),
      loading: false,
    });
    rerender(<AdminShell>Admin content</AdminShell>);

    expect(screen.getByText('Admin content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not ask again while secondary verification is active', () => {
    usePathnameMock.mockReturnValue('/admin/users');
    useAuthMock.mockReturnValue({
      user: adminWithVerification(activeVerification()),
      loading: false,
    });
    render(<AdminShell>Admin content</AdminShell>);

    expect(screen.getByText('Admin content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('requires secondary verification again after it expires', async () => {
    usePathnameMock.mockReturnValue('/admin/posts');
    useAuthMock.mockReturnValue({
      user: adminWithVerification(new Date(Date.now() - 1).toISOString()),
      loading: false,
    });
    render(<AdminShell>Admin content</AdminShell>);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/admin/verify?redirect=/admin/posts'),
    );
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
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
    adminVerifiedUntil: null,
  };
}

function adminWithVerification(adminVerifiedUntil: string | null): AuthUser {
  return { ...admin, adminVerifiedUntil };
}

function activeVerification(): string {
  return new Date(Date.now() + 30 * 60_000).toISOString();
}
