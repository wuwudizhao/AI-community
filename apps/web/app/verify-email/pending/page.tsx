'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthShell } from '@/components/auth-shell';
import { apiRequest } from '@/lib/api';

function PendingContent() {
  const masked = useSearchParams().get('email') ?? '你的邮箱';
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(false);

  async function resend() {
    const email = sessionStorage.getItem('liftoff-pending-email');
    if (!email) return setMessage('请返回注册或登录页重新填写邮箱');
    setCooldown(true);
    try {
      const result = await apiRequest<{ message: string; developmentPreviewUrl?: string }>(
        '/auth/resend-verification',
        { method: 'POST', body: JSON.stringify({ email }) },
      );
      setMessage(result.message);
      if (result.developmentPreviewUrl)
        sessionStorage.setItem('liftoff-development-preview', result.developmentPreviewUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发送失败');
    }
    window.setTimeout(() => setCooldown(false), 30_000);
  }

  return (
    <div className="pending-verification">
      <div className="mail-mark">@</div>
      <strong>请检查 {masked}</strong>
      <p>验证链接包含过期时间。如果没有收到，可以重新发送。</p>
      <button className="auth-submit" disabled={cooldown} onClick={() => void resend()}>
        {cooldown ? '请稍后再试' : '重新发送验证邮件'}
      </button>
      {message && <p aria-live="polite">{message}</p>}
      <Link href="/login">返回登录</Link>
    </div>
  );
}

export default function PendingPage() {
  return (
    <AuthShell title="验证邮件已发送" description="完成邮箱验证后才能登录 Liftoff。">
      <Suspense fallback={<p>正在加载…</p>}>
        <PendingContent />
      </Suspense>
    </AuthShell>
  );
}
