'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';

export function PostDeleteControl({ slug }: { slug: string }) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!confirming) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, [confirming]);

  useEffect(() => {
    if (!confirming) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        setConfirming(false);
        setError('');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [confirming, deleting]);

  function close() {
    if (deleting) return;
    setConfirming(false);
    setError('');
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await apiRequest(`/posts/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      setConfirming(false);
      router.push('/?postDeleted=1');
      router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(
          reason.status === 403
            ? '你没有权限删除这篇帖子'
            : reason.status === 404
              ? '帖子不存在或已被删除'
              : reason.status === 429
                ? '操作过于频繁，请稍后再试'
                : '删除失败，请稍后重试',
        );
      } else setError('删除失败，请稍后重试');
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="post-delete-trigger"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={15} aria-hidden="true" /> 删除帖子
      </button>
      {confirming &&
        createPortal(
          <div
            className="post-delete-backdrop"
            data-testid="delete-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div
              className="post-delete-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-post-title"
              aria-describedby="delete-post-description"
              onKeyDown={trapFocus}
            >
              <strong id="delete-post-title">确认删除帖子？</strong>
              <p id="delete-post-description">删除后将无法恢复，请确认是否继续。</p>
              {error && <p role="alert" className="post-delete-error">{error}</p>}
              <div className="post-delete-dialog__actions">
                <button ref={cancelRef} type="button" disabled={deleting} onClick={close}>
                  取消
                </button>
                <button
                  type="button"
                  className="post-delete-danger"
                  disabled={deleting}
                  onClick={remove}
                >
                  {deleting ? '正在删除…' : '确认删除'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
