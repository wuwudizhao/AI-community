'use client';

import { useEffect, useState } from 'react';

export function PostDeletedNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('postDeleted') !== '1') return;

    let active = true;
    queueMicrotask(() => {
      if (active) setVisible(true);
    });
    url.searchParams.delete('postDeleted');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );

    const timer = window.setTimeout(() => setVisible(false), 3_000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return visible ? (
    <p className="post-deleted-notice" role="status">
      帖子已删除
    </p>
  ) : null;
}
