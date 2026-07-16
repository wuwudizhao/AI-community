'use client';

import { RotateCcw } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublishEntry } from '@/components/layout/publish-entry';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/api';
import type { ForumCategoryFilter } from '@/lib/forum-categories';
import type { PostsPage } from '@/lib/posts';
import { CategoryTabs, type TopCategory } from './category-tabs';
import { PostList } from './post-list';
import { Pagination } from '@/components/ui/pagination';

type ForumFeedProps = {
  tag?: string;
  query?: string;
  category?: ForumCategoryFilter;
  activeCategory?: TopCategory;
  title?: string;
  eyebrow?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  publishLabel?: string;
  publishHref?: string;
};

export function ForumFeed({
  tag,
  query: searchQuery,
  category,
  activeCategory = category ?? (tag ? 'money-opportunity' : 'latest'),
  title = '最新帖子',
  eyebrow = 'Real opportunities · Real practice',
  emptyTitle = '还没有帖子',
  emptyDescription = '成为第一个分享赚钱机会、项目验证或真实复盘的人。',
  publishLabel = '发布帖子',
  publishHref,
}: ForumFeedProps) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const rawPage = searchParams?.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : 1;
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<PostsPage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: rawPage,
      pageSize: '20',
      sort: 'latest',
    });
    if (tag) query.set('tag', tag);
    if (category) query.set('category', category);
    if (searchQuery) query.set('q', searchQuery);
    void apiRequest<PostsPage>(`/posts?${query.toString()}`)
      .then((value) => active && setData(value))
      .catch((reason: unknown) => {
        if (active) {
          setData(null);
          setError(
            reason instanceof ApiError && reason.status === 404 ? '分页不存在' : '帖子加载失败',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [category, page, rawPage, retry, searchQuery, tag]);

  function hrefForPage(targetPage: number) {
    const query = new URLSearchParams(searchParams?.toString() ?? '');
    if (targetPage === 1) query.delete('page');
    else query.set('page', String(targetPage));
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    return `${pathname}${suffix}${pathname === '/' ? '#feed' : ''}`;
  }

  return (
    <section className="community-feed" id="feed" aria-labelledby="feed-title">
      <CategoryTabs active={activeCategory} />
      <div className="community-feed__heading">
        <div>
          <span>{eyebrow}</span>
          <h2 id="feed-title">{title}</h2>
        </div>
        <p>{data ? `共 ${data.pagination.totalItems} 篇 · 最新发布` : '最新发布'}</p>
      </div>

      {!data && !error && <FeedSkeleton />}
      {error && (
        <EmptyState
          title={error}
          description={
            error === '分页不存在'
              ? '当前页码超出帖子总页数，请返回上一页。'
              : '暂时无法连接社区内容，请稍后重试。'
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setError('');
                setData(null);
                setRetry((value) => value + 1);
              }}
            >
              <RotateCcw size={15} aria-hidden="true" /> 重试
            </Button>
          }
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <PublishEntry className="empty-feed__action" href={publishHref}>
              {publishLabel}
            </PublishEntry>
          }
        />
      )}
      {data && data.items.length > 0 && <PostList posts={data.items} />}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          hrefForPage={hrefForPage}
        />
      )}
    </section>
  );
}

export function FeedSkeleton() {
  return (
    <div className="community-post-grid" aria-label="正在加载帖子">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="feed-card-skeleton" key={index} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
