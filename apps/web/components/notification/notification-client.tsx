'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { ApiError, apiRequest } from '@/lib/api';
import type { NotificationPage } from '@/lib/interactions';

export function NotificationClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificationPage | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const load = useCallback(() => {
    void apiRequest<NotificationPage>(
      `/notifications?page=${page}&pageSize=20&unreadOnly=${unreadOnly}`,
    )
      .then((result) => {
        setError('');
        setData(result);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : '通知加载失败'),
      );
  }, [unreadOnly, page]);
  useEffect(() => {
    if (user) load();
  }, [user, load]);
  if (loading) return <div className="community-status-card">正在确认登录状态…</div>;
  if (!user)
    return (
      <EmptyState
        title="请先登录"
        description="登录后查看与你的帖子和评论相关的真实通知。"
        action={<Link href="/login">前往登录</Link>}
      />
    );
  async function read(id: string) {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    load();
  }
  async function readAll() {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    load();
  }
  async function readAndNavigate(id: string, targetUrl: string) {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    router.push(targetUrl);
  }
  return (
    <div className="notifications-page">
      <header>
        <div>
          <span className="eyebrow">Inbox</span>
          <h1>站内通知</h1>
          <p>仅显示真实评论与回复产生的站内通知。</p>
        </div>
        <div className="notification-toolbar">
          <button
            className={!unreadOnly ? 'is-active' : undefined}
            onClick={() => {
              setPage(1);
              setUnreadOnly(false);
            }}
          >
            全部
          </button>
          <button
            className={unreadOnly ? 'is-active' : undefined}
            onClick={() => {
              setPage(1);
              setUnreadOnly(true);
            }}
          >
            未读
          </button>
          <button className="notification-read-all" onClick={() => void readAll()}>
            全部标记已读
          </button>
        </div>
      </header>
      {error && (
        <div className="community-error-state" role="alert">
          {error} <button onClick={load}>重试</button>
        </div>
      )}
      {!data && !error && <div className="community-status-card">正在加载通知…</div>}
      {data?.items.length === 0 && (
        <EmptyState title="暂无通知" description="有用户评论你的帖子或回复评论后，会显示在这里。" />
      )}
      {data?.items.map((item) => (
        <article
          key={item.id}
          className={item.readAt ? 'notification-item' : 'notification-item is-unread'}
        >
          <Link
            href={item.targetUrl}
            onClick={(event) => {
              event.preventDefault();
              void readAndNavigate(item.id, item.targetUrl);
            }}
          >
            <strong>{item.actor?.displayName ?? '系统'}</strong>{' '}
            {item.type === 'POST_COMMENTED'
              ? `评论了你的帖子《${item.post?.title ?? ''}》`
              : '回复了你的评论'}
            <p>{item.preview}</p>
            <time>{new Date(item.createdAt).toLocaleString('zh-CN')}</time>
          </Link>
          {!item.readAt && <button onClick={() => void read(item.id)}>标记已读</button>}
        </article>
      ))}
      {data && data.pagination.totalPages > 1 && (
        <nav className="community-pagination" aria-label="通知分页">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            上一页
          </button>
          <span>
            {page} / {data.pagination.totalPages}
          </span>
          <button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
          </button>
        </nav>
      )}
    </div>
  );
}
