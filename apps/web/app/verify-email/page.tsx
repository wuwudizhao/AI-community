import { Suspense } from 'react';

import { AuthShell } from '@/components/auth-shell';
import { VerifyEmailClient } from './verify-email-client';

export default function VerifyEmailPage() {
  return (
    <AuthShell title="验证邮箱" description="验证链接一次有效，并将在规定时间后过期。">
      <Suspense fallback={<p>正在读取验证链接…</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
