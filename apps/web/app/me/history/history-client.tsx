'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { FeedSkeleton } from '@/components/forum/forum-feed';
import { PostCard } from '@/components/forum/post-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { apiRequest } from '@/lib/api';
import type { HistoryPage } from '@/lib/posts';

export function HistoryClient() {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? '/me/history';
  const params = useSearchParams();
  const rawPage = params.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : 1;
  const [data, setData] = useState<HistoryPage | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    void apiRequest<HistoryPage>(`/posts/history?page=${page}&pageSize=20`)
      .then(setData)
      .catch(() => setError(true));
  }, [page, user]);
  useEffect(load, [load]);

  async function remove(postId: string) {
    await apiRequest(`/posts/history/${encodeURIComponent(postId)}`, { method: 'DELETE' });
    load();
  }
  async function clear() {
    if (!window.confirm('确定清空全部浏览历史吗？此操作无法撤销。')) return;
    await apiRequest('/posts/history', { method: 'DELETE' });
    setData((current) =>
      current
        ? {
            ...current,
            items: [],
            pagination: { ...current.pagination, totalItems: 0, totalPages: 0, hasNextPage: false },
          }
        : current,
    );
  }

  if (loading) return <FeedSkeleton />;
  if (!user)
    return (
      <EmptyState
        title="请先登录"
        description="登录后查看你的浏览历史。"
        action={<Link href="/login?next=%2Fme%2Fhistory">前往登录</Link>}
      />
    );
  if (error)
    return <EmptyState title="加载失败" description="暂时无法读取浏览历史，请稍后重试。" />;
  return (
    <>
      <header className="community-route-heading history-heading">
        <div>
          <span className="eyebrow">History</span>
          <h1>浏览历史</h1>
          <p>按最后浏览时间倒序展示，仅你自己可见。</p>
        </div>
        {data && data.items.length > 0 && (
          <Button variant="outline" onClick={() => void clear()}>
            <Trash2 size={16} />
            清空全部
          </Button>
        )}
      </header>
      {!data && <FeedSkeleton />}
      {data?.items.length === 0 && (
        <EmptyState
          title="还没有浏览历史"
          description="登录后打开帖子，记录会自动出现在这里。"
          action={<Link href="/">浏览帖子</Link>}
        />
      )}
      {data && data.items.length > 0 && (
        <div className="history-list">
          {data.items.map((post) => (
            <div className="history-list__item" key={post.id}>
              <div className="history-list__meta">
                最后浏览：
                <time dateTime={post.lastViewedAt}>
                  {new Intl.DateTimeFormat('zh-CN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(post.lastViewedAt))}
                </time>
                <button
                  type="button"
                  onClick={() => void remove(post.id)}
                  aria-label={`删除 ${post.title} 的浏览历史`}
                >
                  <Trash2 size={15} />
                  删除
                </button>
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
