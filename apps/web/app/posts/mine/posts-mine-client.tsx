'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { FeedSkeleton } from '@/components/forum/forum-feed';
import { PostList } from '@/components/forum/post-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { apiRequest } from '@/lib/api';
import type { PostsPage } from '@/lib/posts';

export function MinePostsClient() {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? '/posts/mine';
  const searchParams = useSearchParams();
  const rawPage = searchParams?.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : 1;
  const [data, setData] = useState<PostsPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    void apiRequest<PostsPage>(`/posts/mine?page=${rawPage}&pageSize=20`)
      .then(setData)
      .catch(() => setError(true));
  }, [rawPage, user]);

  function hrefForPage(targetPage: number) {
    const query = new URLSearchParams(searchParams?.toString() ?? '');
    if (targetPage === 1) query.delete('page');
    else query.set('page', String(targetPage));
    return `${pathname}${query.size > 0 ? `?${query.toString()}` : ''}`;
  }

  if (loading) return <FeedSkeleton />;
  if (!user)
    return (
      <EmptyState
        title="请先登录"
        description="登录后查看你的真实发布记录。"
        action={<Link href="/login">前往登录</Link>}
      />
    );
  return (
    <>
      <header className="community-route-heading">
        <span className="eyebrow">Your posts</span>
        <h1>我的发布</h1>
        <p>这里仅展示当前账户真实发布的内容。</p>
      </header>
      {error && <EmptyState title="加载失败" description="暂时无法读取你的发布记录。" />}
      {!data && !error && <FeedSkeleton />}
      {data?.items.length === 0 && (
        <EmptyState
          title="还没有发布"
          description="发布第一篇真实机会、项目或复盘。"
          action={<Link href="/posts/new">发布帖子</Link>}
        />
      )}
      {data && data.items.length > 0 && <PostList posts={data.items} />}
      {data && data.pagination.totalPages > 1 && (
        <Pagination page={page} totalPages={data.pagination.totalPages} hrefForPage={hrefForPage} />
      )}
    </>
  );
}
