'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api';

export function VerifyEmailClient() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在验证邮箱…');

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setState('error');
        setMessage('验证链接缺少 Token');
      });
      return;
    }
    void apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((result) => {
        setState('success');
        setMessage(result.message);
      })
      .catch((error: unknown) => {
        setState('error');
        setMessage(error instanceof Error ? error.message : '验证失败');
      });
  }, [token]);

  return (
    <div className={`verification-state is-${state}`} aria-live="polite">
      <strong>{message}</strong>
      <span>
        {state === 'success'
          ? '现在可以登录 Liftoff。'
          : state === 'loading'
            ? '请稍候。'
            : '请重新获取验证邮件。'}
      </span>
      {state !== 'loading' && (
        <Link href={state === 'success' ? '/login' : '/verify-email/pending'}>
          {state === 'success' ? '返回登录' : '重新发送'}
        </Link>
      )}
    </div>
  );
}
