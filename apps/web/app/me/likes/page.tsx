import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { LikesClient } from './likes-client';

export const metadata: Metadata = { title: '我的点赞', robots: { index: false, follow: false } };

export default function LikesPage() {
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page">
          <Suspense fallback={null}>
            <LikesClient />
          </Suspense>
        </section>
      </ForumShell>
    </div>
  );
}
