import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { HistoryClient } from './history-client';

export const metadata: Metadata = { title: '浏览历史', robots: { index: false, follow: false } };

export default function HistoryPage() {
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page">
          <Suspense fallback={null}>
            <HistoryClient />
          </Suspense>
        </section>
      </ForumShell>
    </div>
  );
}
