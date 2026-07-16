import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function NotFound() {
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
      <span>404</span>
      <h1>这个页面还没有起飞</h1>
      <p>链接可能已失效，或者内容已被移动。</p>
      <Button asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </main>
  );
}
