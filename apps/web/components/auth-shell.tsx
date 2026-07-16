import Link from 'next/link';
import type { ReactNode } from 'react';

import { ThemeSwitcher } from './theme-switcher';

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <header className="auth-page__header">
        <Link className="brand" href="/" aria-label="返回 Liftoff 首页">
          <span className="brand__mark">L</span>
          <span className="brand__name">Liftoff</span>
        </Link>
        <ThemeSwitcher />
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="eyebrow">Liftoff Account</span>
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </main>
  );
}
