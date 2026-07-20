'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { FeedSkeleton } from '@/components/forum/forum-feed';
import { PostCard } from '@/components/forum/post-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { apiRequest } from '@/lib/api';
import type { LikesPage } from '@/lib/posts';

export function LikesClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/me/likes';
  const searchParams = useSearchParams();
  const rawPage = searchParams.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : 1;
  const [data, setData] = useState<LikesPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=%2Fme%2Flikes');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    void apiRequest<LikesPage>(`/posts/likes?page=${page}&pageSize=20`)
      .then(setData)
      .catch(() => setError(true));
  }, [page, user]);

  if (loading) return <FeedSkeleton />;
  if (!user)
    return (
      <EmptyState
        title="请先登录"
        description="登录后查看你点赞过的帖子。"
        action={<Link href="/login?redirect=%2Fme%2Flikes">前往登录</Link>}
      />
    );
  if (error)
    return <EmptyState title="加载失败" description="暂时无法读取点赞内容，请稍后重试。" />;
  return (
    <>
      <header className="community-route-heading">
        <span className="eyebrow">Likes</span>
        <h1>我的点赞</h1>
        <p>按点赞时间倒序展示，仅你自己可见。</p>
      </header>
      {!data && <FeedSkeleton />}
      {data?.items.length === 0 && (
        <EmptyState
          title="还没有点赞"
          description="为认可的帖子点赞，之后可以在这里快速找到。"
          action={<Link href="/">浏览帖子</Link>}
        />
      )}
      {data && data.items.length > 0 && (
        <div className="history-list">
          {data.items.map((post) => (
            <div className="history-list__item" key={post.id}>
              <div className="history-list__meta">
                点赞于：
                <time dateTime={post.likedAt}>
                  {new Intl.DateTimeFormat('zh-CN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(post.likedAt))}
                </time>
              </div>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
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
