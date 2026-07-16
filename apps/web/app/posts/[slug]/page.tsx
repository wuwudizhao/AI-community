'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { PostDetailShell } from '@/components/post/post-detail-shell';
import { ApiError, apiRequest } from '@/lib/api';
import type { PostDetail } from '@/lib/posts';

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    void apiRequest<PostDetail>(`/posts/${encodeURIComponent(slug)}`)
      .then(setPost)
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 404) {
          setMissing(true);
          return;
        }
        setError(reason instanceof ApiError ? reason.message : '帖子加载失败');
      });
  }, [slug]);

  useEffect(load, [load]);

  if (missing) notFound();

  return (
    <div className="liftoff-community" id="top">
      <ForumHeader />
      <ForumShell>
        {error ? (
          <div className="post-route-state" role="alert">
            <strong>帖子暂时无法加载</strong>
            <p>请稍后重试。页面不会展示内部接口错误。</p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMissing(false);
                load();
              }}
            >
              重新加载
            </button>
          </div>
        ) : post ? (
          <PostDetailShell post={post} />
        ) : (
          <PostDetailLoading />
        )}
      </ForumShell>
    </div>
  );
}

function PostDetailLoading() {
  return (
    <div className="post-detail-frame" aria-label="正在加载帖子">
      <div className="post-detail-grid">
        <div className="post-detail-loading">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="post-detail-loading is-aside">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
