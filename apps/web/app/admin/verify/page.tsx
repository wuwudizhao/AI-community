'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { isAdminVerificationActive } from '@/components/admin/admin-shell';
import { useAuth } from '@/components/auth-provider';
import { ApiError, apiRequest } from '@/lib/api';

const VERIFICATION_ERROR = '密码不正确，请重新输入。';

export default function AdminVerifyPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAdminVerificationActive(user?.adminVerifiedUntil)) {
      router.replace(currentAdminRedirect());
    }
  }, [router, user?.adminVerifiedUntil]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/auth/verify-admin-password', {
        method: 'POST',
        body: JSON.stringify({ password: form.get('password') }),
      });
      await refresh();
      router.replace(currentAdminRedirect());
    } catch (reason) {
      setError(
        reason instanceof ApiError && (reason.status === 400 || reason.status === 401)
          ? VERIFICATION_ERROR
          : '管理员验证失败，请稍后重试。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-verify-page">
      <section className="admin-verify-card" aria-labelledby="admin-verify-title">
        <span className="admin-verify-icon" aria-hidden="true">
          <ShieldCheck size={22} />
        </span>
        <span className="admin-eyebrow">Security check</span>
        <h1 id="admin-verify-title">验证管理员身份</h1>
        <p>为保护社区运营数据，请输入当前账号密码。验证将在 30 分钟后失效。</p>

        <div className="admin-verify-identity">
          <span>当前管理员</span>
          <strong>{user?.email ?? user?.username}</strong>
        </div>

        <form className="admin-verify-form" onSubmit={submit}>
          <label>
            当前密码
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              autoFocus
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy}>
            {busy ? '验证中…' : '进入管理后台'}
          </button>
        </form>

        <Link className="admin-verify-back" href="/">
          返回社区
        </Link>
      </section>
    </main>
  );
}

export function resolveAdminRedirect(redirect: string | null): string {
  if (
    !redirect ||
    (redirect !== '/admin' && !redirect.startsWith('/admin/')) ||
    redirect.startsWith('//') ||
    redirect.startsWith('/admin/verify')
  ) {
    return '/admin';
  }
  return redirect;
}

function currentAdminRedirect(): string {
  return resolveAdminRedirect(new URLSearchParams(window.location.search).get('redirect'));
}
