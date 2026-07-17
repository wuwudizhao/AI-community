'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { AuthShell } from '@/components/auth-shell';
import { apiRequest } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmPassword'))) return setError('两次输入的密码不一致');
    setBusy(true);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          username: form.get('username'),
          displayName: form.get('displayName'),
          password,
        }),
      });
      router.push('/login');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '注册失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="创建真实身份" description="使用邮箱注册 Liftoff，注册完成后即可登录。">
      <form
        className="auth-form"
        onSubmit={submit}
        aria-describedby={error ? 'form-error' : undefined}
      >
        <label>
          邮箱
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          用户名
          <input
            name="username"
            pattern="[A-Za-z0-9_]{3,24}"
            minLength={3}
            maxLength={24}
            required
          />
        </label>
        <label>
          显示名称
          <input name="displayName" minLength={1} maxLength={40} required />
        </label>
        <label>
          密码
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
          />
        </label>
        <label>
          确认密码
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p id="form-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="auth-submit" disabled={busy}>
          {busy ? '注册中…' : '注册'}
        </button>
      </form>
      <p className="auth-card__footer">
        已有账户？<Link href="/login">登录</Link>
      </p>
    </AuthShell>
  );
}
