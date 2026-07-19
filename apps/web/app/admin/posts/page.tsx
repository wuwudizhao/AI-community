'use client';

import { ExternalLink, Pin, PinOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AdminPageState } from '@/components/admin/admin-page-state';
import { apiRequest } from '@/lib/api';

interface AdminPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  pinned: boolean;
  createdAt: string;
  publishedAt: string | null;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    return apiRequest<AdminPost[]>('/admin/posts')
      .then(setPosts)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(post: AdminPost) {
    if (!window.confirm(`确认永久删除帖子“${post.title}”吗？此操作不可撤销。`)) return;
    setBusyId(post.id);
    try {
      await apiRequest(`/admin/posts/${post.id}`, { method: 'DELETE' });
      setPosts((current) => current?.filter(({ id }) => id !== post.id) ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除失败');
    } finally {
      setBusyId('');
    }
  }

  async function togglePinned(post: AdminPost) {
    setBusyId(post.id);
    try {
      await apiRequest(`/admin/posts/${post.id}/pinned`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !post.pinned }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作失败');
    } finally {
      setBusyId('');
    }
  }

  if (!posts && !error) return <AdminPageState>正在加载帖子…</AdminPageState>;

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">Content</span>
          <h1>帖子管理</h1>
          <p>查看、置顶或删除社区帖子。</p>
        </div>
        <span className="admin-count">{posts?.length ?? 0} 篇帖子</span>
      </div>
      {error && <AdminPageState error>{error}</AdminPageState>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>作者</th>
              <th>发布时间</th>
              <th>状态</th>
              <th>
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post) => (
              <tr key={post.id}>
                <td>
                  <div className="admin-title-cell">
                    {post.pinned && <Pin size={13} aria-label="已置顶" />}
                    <strong>{post.title}</strong>
                  </div>
                </td>
                <td>{post.author}</td>
                <td>{formatDate(post.publishedAt ?? post.createdAt)}</td>
                <td>
                  <span className="admin-status">
                    {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <Link
                      href={`/posts/${post.slug}`}
                      title="查看帖子"
                      aria-label={`查看 ${post.title}`}
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <button
                      disabled={busyId === post.id}
                      onClick={() => void togglePinned(post)}
                      title={post.pinned ? '取消置顶' : '置顶'}
                    >
                      {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>
                    <button
                      className="is-danger"
                      disabled={busyId === post.id}
                      onClick={() => void remove(post)}
                      title="删除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts?.length === 0 && <div className="admin-empty">暂无帖子</div>}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
