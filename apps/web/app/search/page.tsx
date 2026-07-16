import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForumFeed } from '@/components/forum/forum-feed';
import { ForumFooter } from '@/components/layout/forum-footer';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: '搜索帖子', robots: { index: false, follow: true } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page" aria-labelledby="search-title">
          <header className="community-route-heading">
            <span className="eyebrow">Search</span>
            <h1 id="search-title">搜索帖子</h1>
            <p>{query ? `“${query}”的搜索结果` : '输入关键词查找标题、正文和标签。'}</p>
          </header>
          {query ? (
            <Suspense fallback={null}>
              <ForumFeed
                query={query}
                activeCategory="latest"
                title="搜索结果"
                eyebrow="Search results · Latest"
                emptyTitle="没有找到相关帖子"
                emptyDescription="可以尝试更换关键词。"
              />
            </Suspense>
          ) : (
            <EmptyState title="请输入搜索词" description="可搜索帖子标题、正文和标签。" />
          )}
        </section>
        <ForumFooter />
      </ForumShell>
    </div>
  );
}
