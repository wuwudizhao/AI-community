'use client';

import { FileText, LayoutDashboard, LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/components/auth-provider';

const navigation = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/posts', label: '帖子管理', icon: FileText },
  { href: '/admin/users', label: '用户管理', icon: Users },
] as const;

const ADMIN_VERIFY_PATH = '/admin/verify';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const adminVerificationActive = isAdminVerificationActive(user?.adminVerifiedUntil);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${pathname === ADMIN_VERIFY_PATH ? '/admin' : pathname}`);
      return;
    }
    if (user.role === 'ADMIN' && pathname !== ADMIN_VERIFY_PATH && !adminVerificationActive) {
      router.replace(`${ADMIN_VERIFY_PATH}?redirect=${pathname}`);
    }
  }, [adminVerificationActive, loading, pathname, router, user]);

  useEffect(() => {
    if (
      loading ||
      !user?.adminVerifiedUntil ||
      user.role !== 'ADMIN' ||
      pathname === ADMIN_VERIFY_PATH
    ) {
      return;
    }
    const remaining = Date.parse(user.adminVerifiedUntil) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const timeout = window.setTimeout(() => {
      router.replace(`${ADMIN_VERIFY_PATH}?redirect=${pathname}`);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [loading, pathname, router, user]);

  if (loading) {
    return <main className="admin-access-state">正在验证管理员权限…</main>;
  }

  if (!user) {
    return <main className="admin-access-state">正在跳转登录页…</main>;
  }

  if (user.role !== 'ADMIN') {
    return (
      <main className="admin-access-state">
        <div className="admin-access-card">
          <span className="admin-eyebrow">403 · Forbidden</span>
          <h1>无权访问管理后台</h1>
          <p>当前账号不是管理员。</p>
          <Link href="/">返回社区</Link>
        </div>
      </main>
    );
  }

  if (pathname !== ADMIN_VERIFY_PATH && !adminVerificationActive) {
    return <main className="admin-access-state">正在跳转管理员验证页…</main>;
  }

  if (pathname === ADMIN_VERIFY_PATH) return <>{children}</>;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">L</span>
          <span>
            <strong>Liftoff</strong>
            <small>社区管理</small>
          </span>
        </Link>
        <nav aria-label="管理员导航">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="admin-back-link">
          <LogOut size={16} aria-hidden="true" /> 返回社区
        </Link>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <span>运营后台</span>
          <span>{user.displayName || user.username}</span>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

export function isAdminVerificationActive(
  adminVerifiedUntil: string | null | undefined,
  now = Date.now(),
): boolean {
  return Boolean(adminVerifiedUntil && Date.parse(adminVerifiedUntil) >= now);
}
