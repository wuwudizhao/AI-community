import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { MinePostsClient } from './posts-mine-client';

export const metadata: Metadata = {
  title: '我的发布',
  robots: { index: false, follow: false },
};

export default function MinePostsPage() {
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page">
          <Suspense fallback={null}>
            <MinePostsClient />
          </Suspense>
        </section>
      </ForumShell>
    </div>
  );
}
