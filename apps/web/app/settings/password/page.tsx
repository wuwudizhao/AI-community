'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { apiRequest } from '@/lib/api';

const PASSWORD_SETTINGS_PATH = '/settings/password';

export default function PasswordSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=${PASSWORD_SETTINGS_PATH}`);
  }, [loading, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get('currentPassword'));
    const newPassword = String(form.get('newPassword'));
    const confirmPassword = String(form.get('confirmPassword'));
    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) return setError(validationError);

    setBusy(true);
    try {
      const result = await apiRequest<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      formElement.reset();
      setSuccess(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '密码修改失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <AuthShell title="账户安全" description="正在验证登录状态…">
        <p className="auth-card__footer">{loading ? '请稍候。' : '正在跳转登录页…'}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="修改密码" description="更新密码后，所有设备上的登录状态都会失效。">
      {success ? (
        <div className="verification-state is-success" aria-live="polite">
          <strong className="form-success">{success}</strong>
          <span>请使用新密码重新登录 Liftoff。</span>
          <Link href="/login">前往登录</Link>
        </div>
      ) : (
        <form
          className="auth-form"
          onSubmit={submit}
          aria-describedby={error ? 'password-form-error' : undefined}
        >
          <label>
            当前密码
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
          <label>
            新密码
            <input
              name="newPassword"
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
            <p id="password-form-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy ? '提交中…' : '修改密码'}
          </button>
        </form>
      )}
      <p className="auth-card__footer">
        <Link href="/">返回社区</Link>
      </p>
    </AuthShell>
  );
}

export function validateNewPassword(newPassword: string, confirmPassword: string): string | null {
  if (newPassword.length < 10 || newPassword.length > 128) return '新密码长度应为 10-128 位';
  if (!/[a-z]/.test(newPassword)) return '新密码必须包含小写字母';
  if (!/[A-Z]/.test(newPassword)) return '新密码必须包含大写字母';
  if (!/[0-9]/.test(newPassword)) return '新密码必须包含数字';
  if (newPassword !== confirmPassword) return '两次输入的新密码不一致';
  return null;
}
