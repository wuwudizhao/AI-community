import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { FeatureFlagsProvider } from '@/components/feature-flags-provider';

const themeInitializationScript = `
(function () {
  try {
    var key = 'liftoff-theme';
    var stored = localStorage.getItem(key);
    var preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var resolved = preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {}
})();`;

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: 'Liftoff · AI 创业与副业社区', template: '%s · Liftoff' },
  description: '发现 AI 赚钱机会、验证项目、分享收入案例与失败复盘的实战社区。',
  openGraph: {
    title: 'Liftoff',
    description: '发现机会，做出产品，获得收入，再把经验分享出来。',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <FeatureFlagsProvider allowGuestPosting={process.env.ALLOW_GUEST_POSTING !== 'false'}>
          <AuthProvider>{children}</AuthProvider>
        </FeatureFlagsProvider>
      </body>
    </html>
  );
}
