import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { BookmarksClient } from './bookmarks-client';

export const metadata: Metadata = { title: '我的收藏', robots: { index: false, follow: false } };

export default function BookmarksPage() {
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page">
          <Suspense fallback={null}>
            <BookmarksClient />
          </Suspense>
        </section>
      </ForumShell>
    </div>
  );
}
