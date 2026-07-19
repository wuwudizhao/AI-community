'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageCircle, Reply, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { ApiError, apiRequest } from '@/lib/api';
import type { CommentItem, CommentPage } from '@/lib/interactions';

export function CommentSection({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<CommentPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [targetedCommentId, setTargetedCommentId] = useState<string | null>(null);

  const load = useCallback(() => {
    void apiRequest<CommentPage>(
      `/posts/${encodeURIComponent(slug)}/comments?page=${page}&pageSize=20&sort=oldest`,
    )
      .then(setData)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : '评论加载失败'),
      );
  }, [slug, page]);

  useEffect(load, [load]);

  useEffect(() => {
    function syncCommentTarget() {
      const prefix = '#comment-';
      const hash = window.location.hash;
      const commentId = hash.startsWith(prefix)
        ? decodeURIComponent(hash.slice(prefix.length))
        : null;

      setTargetedCommentId(commentId);
      if (!commentId) return;

      window.requestAnimationFrame(() => {
        document
          .getElementById(`comment-${commentId}`)
          ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      });
    }

    syncCommentTarget();
    window.addEventListener('hashchange', syncCommentTarget);
    return () => window.removeEventListener('hashchange', syncCommentTarget);
  }, [data]);

  async function submit(event: FormEvent<HTMLFormElement>, replyToCommentId?: string) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const input = form.elements.namedItem('content') as HTMLTextAreaElement;
    if (!input.value.trim()) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/posts/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: input.value, replyToCommentId }),
      });
      input.value = '';
      setReplyTo(null);
      load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '评论发布失败');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('确定删除这条评论吗？')) return;
    try {
      await apiRequest(`/comments/${id}`, { method: 'DELETE' });
      load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '删除失败');
    }
  }

  return (
    <section id="comments" className="comment-section" aria-labelledby="comments-heading">
      <div className="comment-section__heading">
        <div>
          <span>Discussion</span>
          <h2 id="comments-heading">评论{data ? `（${data.pagination.total}）` : ''}</h2>
        </div>
        <MessageCircle size={20} aria-hidden="true" />
      </div>

      {user ? (
        <CommentForm
          busy={busy}
          authorName={user.displayName || user.username}
          onSubmit={(event) => submit(event)}
        />
      ) : (
        <div className="comment-login-prompt">
          <strong>加入讨论</strong>
          <p>登录后可以发表真实经验或回复其他 Builder。</p>
          <Link href="/login">登录后参与评论</Link>
        </div>
      )}

      {error && (
        <div role="alert" className="comment-error">
          <span>评论暂时无法处理，请稍后重试。</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              load();
            }}
          >
            重试
          </button>
        </div>
      )}

      {!data && !error && <CommentLoading />}
      {data?.items.length === 0 && (
        <div className="comment-empty">
          <strong>还没有评论</strong>
          <p>成为第一个参与讨论的人吧。</p>
        </div>
      )}

      <div className="comment-list">
        {data?.items.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            depth={0}
            userId={user?.id}
            role={user?.role}
            busy={busy}
            replyTo={replyTo}
            targetedCommentId={targetedCommentId}
            setReplyTo={setReplyTo}
            submit={submit}
            remove={remove}
          />
        ))}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <nav className="comment-pagination" aria-label="评论分页">
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
    </section>
  );
}

function CommentNode({
  comment,
  depth,
  userId,
  role,
  busy,
  replyTo,
  targetedCommentId,
  setReplyTo,
  submit,
  remove,
}: {
  comment: CommentItem;
  depth: 0 | 1;
  userId?: string;
  role?: string;
  busy: boolean;
  replyTo: string | null;
  targetedCommentId: string | null;
  setReplyTo: (id: string | null) => void;
  submit: (event: FormEvent<HTMLFormElement>, id?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const canDelete = comment.canDelete || userId === comment.author.id || role === 'ADMIN';
  const authorName = comment.author.displayName || comment.author.username;
  const isTargeted = targetedCommentId === comment.id;

  return (
    <article
      id={`comment-${comment.id}`}
      className={`comment-item${depth === 1 ? ' is-reply' : ''}${isTargeted ? ' is-targeted' : ''}${comment.status !== 'PUBLISHED' ? ' is-deleted' : ''}`}
    >
      <Avatar name={authorName} className="comment-item__avatar" />
      <div className="comment-item__body">
        <header>
          <div>
            <strong>{authorName}</strong>
            <span>@{comment.author.username}</span>
          </div>
          <time dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleString('zh-CN')}
          </time>
        </header>
        {depth === 1 && comment.replyToUser && comment.status === 'PUBLISHED' && (
          <span className="comment-reply-context">回复 @{comment.replyToUser.username}</span>
        )}
        <p className="comment-content">{comment.content ?? comment.placeholder}</p>
        {comment.status === 'PUBLISHED' && userId && (
          <div className="comment-item__actions">
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            >
              <Reply size={14} aria-hidden="true" /> 回复
            </button>
            {canDelete && (
              <button type="button" onClick={() => void remove(comment.id)}>
                <Trash2 size={14} aria-hidden="true" /> 删除
              </button>
            )}
          </div>
        )}
        {replyTo === comment.id && (
          <CommentForm
            busy={busy}
            authorName={authorName}
            onSubmit={(event) => submit(event, comment.id)}
            compact
          />
        )}
        {depth === 0 && comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentNode
                key={reply.id}
                comment={reply}
                depth={1}
                userId={userId}
                role={role}
                busy={busy}
                replyTo={replyTo}
                targetedCommentId={targetedCommentId}
                setReplyTo={setReplyTo}
                submit={submit}
                remove={remove}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function CommentForm({
  busy,
  authorName,
  onSubmit,
  compact = false,
}: {
  busy: boolean;
  authorName: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  compact?: boolean;
}) {
  return (
    <form className={compact ? 'comment-form is-compact' : 'comment-form'} onSubmit={onSubmit}>
      <Avatar name={authorName} className="comment-form__avatar" />
      <div>
        <textarea
          name="content"
          required
          maxLength={5000}
          rows={compact ? 3 : 5}
          placeholder={compact ? '写下回复…' : '写下你的看法…'}
        />
        <div className="comment-form__footer">
          <span>请分享真实、可验证的经验。</span>
          <button disabled={busy} type="submit">
            {busy ? '提交中…' : compact ? '回复' : '发表评论'}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentLoading() {
  return (
    <div className="comment-loading" aria-label="正在加载评论">
      {[0, 1, 2].map((item) => (
        <div key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
