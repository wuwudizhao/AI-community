'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="route-state">
      <div className="route-state__topbar">
        <Link href="/" className="liftoff-brand" aria-label="Liftoff 首页">
          <span className="liftoff-mark" aria-hidden="true">
            <span />
          </span>
          <strong>Liftoff</strong>
        </Link>
        <ThemeSwitcher />
      </div>
      <span>ERROR</span>
      <h1>页面暂时无法加载</h1>
      <p>请稍后重试。如果问题持续存在，可以先返回首页。</p>
      <div className="route-state__actions">
        <Button onClick={reset}>重新加载</Button>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </main>
  );
}
