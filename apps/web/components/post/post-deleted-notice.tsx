'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

export function PostDeletedNotice() {
  const visible = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get('postDeleted') === '1',
    () => false,
  );
  return visible ? (
    <p className="post-deleted-notice" role="status">
      帖子已删除
    </p>
  ) : null;
}
