import { ForumFeed } from '@/components/forum/forum-feed';
import { OpportunityShortcuts } from '@/components/forum/opportunity-shortcuts';
import { LiftoffHero } from '@/components/hero/liftoff-hero';
import { ForumFooter } from '@/components/layout/forum-footer';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { PostDeletedNotice } from '@/components/post/post-deleted-notice';

export default function Home() {
  return (
    <div className="liftoff-community" id="top">
      <ForumHeader />
      <ForumShell>
        <PostDeletedNotice />
        <LiftoffHero />
        <OpportunityShortcuts />
        <Suspense fallback={null}>
          <ForumFeed />
        </Suspense>
        <ForumFooter />
      </ForumShell>
    </div>
  );
}
import { Suspense } from 'react';
