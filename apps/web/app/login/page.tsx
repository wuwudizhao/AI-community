'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { apiRequest } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setUnverified(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      await refresh();
      router.push(
        resolveLoginRedirect(new URLSearchParams(window.location.search).get('redirect')),
      );
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '登录失败';
      setError(message);
      setUnverified(message.includes('邮箱验证'));
      sessionStorage.setItem('liftoff-pending-email', String(form.get('email')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="欢迎回来"
      description="登录后，Liftoff 将使用安全的 HttpOnly Session 保持身份。"
    >
      <form className="auth-form" onSubmit={submit}>
        <label>
          邮箱
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          密码
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {unverified && (
          <Link className="inline-link" href="/verify-email/pending">
            重新发送验证邮件
          </Link>
        )}
        <button className="auth-submit" disabled={busy}>
          {busy ? '登录中…' : '登录'}
        </button>
      </form>
      <p className="auth-card__footer">
        还没有账户？<Link href="/register">注册</Link>
      </p>
    </AuthShell>
  );
}

export function resolveLoginRedirect(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return '/';
  return redirect;
}
