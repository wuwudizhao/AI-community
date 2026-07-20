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
import type { BookmarksPage } from '@/lib/posts';

export function BookmarksClient() {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? '/me/bookmarks';
  const searchParams = useSearchParams();
  const rawPage = searchParams.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : 1;
  const [data, setData] = useState<BookmarksPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    void apiRequest<BookmarksPage>(`/posts/bookmarks?page=${page}&pageSize=20`)
      .then(setData)
      .catch(() => setError(true));
  }, [page, user]);

  if (loading) return <FeedSkeleton />;
  if (!user)
    return (
      <EmptyState
        title="请先登录"
        description="登录后查看你的收藏。"
        action={<Link href="/login?next=%2Fme%2Fbookmarks">前往登录</Link>}
      />
    );
  if (error) return <EmptyState title="加载失败" description="暂时无法读取收藏，请稍后重试。" />;
  return (
    <>
      <header className="community-route-heading">
        <span className="eyebrow">Bookmarks</span>
        <h1>我的收藏</h1>
        <p>按收藏时间倒序展示，仅你自己可见。</p>
      </header>
      {!data && <FeedSkeleton />}
      {data?.items.length === 0 && (
        <EmptyState
          title="还没有收藏"
          description="在帖子详情或列表中收藏值得回看的内容。"
          action={<Link href="/">浏览帖子</Link>}
        />
      )}
      {data && data.items.length > 0 && <PostList posts={data.items} />}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages}
          hrefForPage={(target) => (target === 1 ? pathname : `${pathname}?page=${target}`)}
        />
      )}
    </>
  );
}
