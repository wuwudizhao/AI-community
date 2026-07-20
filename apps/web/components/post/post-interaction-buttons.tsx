'use client';

import { Bookmark, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiRequest } from '@/lib/api';

export function PostInteractionButtons({
  slug,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
  showBookmark = true,
}: {
  slug: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialBookmarked?: boolean;
  showBookmark?: boolean;
}) {
  const { user } = useSafeAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [error, setError] = useState('');
  const likePending = useRef(false);
  const bookmarkPending = useRef(false);

  async function toggleLike() {
    if (!user || likePending.current) return;
    likePending.current = true;
    setError('');
    const previous = { liked, likeCount };
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    try {
      const response = await apiRequest<{ liked: boolean; likeCount: number }>(
        `/posts/${encodeURIComponent(slug)}/like`,
        { method: next ? 'PUT' : 'DELETE' },
      );
      setLiked(response.liked);
      setLikeCount(response.likeCount);
    } catch {
      setLiked(previous.liked);
      setLikeCount(previous.likeCount);
      setError('点赞操作失败，请重试');
    } finally {
      likePending.current = false;
    }
  }

  async function toggleBookmark() {
    if (!user || bookmarkPending.current) return;
    bookmarkPending.current = true;
    setError('');
    const previous = bookmarked;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const response = await apiRequest<{ bookmarked: boolean }>(
        `/posts/${encodeURIComponent(slug)}/bookmark`,
        { method: next ? 'PUT' : 'DELETE' },
      );
      setBookmarked(response.bookmarked);
    } catch {
      setBookmarked(previous);
      setError('收藏操作失败，请重试');
    } finally {
      bookmarkPending.current = false;
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(`/posts/${slug}`)}`;
  return (
    <span className="post-interactions">
      {user ? (
        <button
          type="button"
          className={liked ? 'is-active' : undefined}
          aria-pressed={liked}
          aria-label={liked ? '取消点赞' : '点赞'}
          onClick={() => void toggleLike()}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{likeCount}</span>
        </button>
      ) : (
        <Link href={loginHref} aria-label="登录后点赞">
          <Heart size={16} aria-hidden="true" />
          <span>{likeCount}</span>
        </Link>
      )}
      {showBookmark &&
        (user ? (
          <button
            type="button"
            className={bookmarked ? 'is-active' : undefined}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? '取消收藏' : '收藏'}
            onClick={() => void toggleBookmark()}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{bookmarked ? '已收藏' : '收藏'}</span>
          </button>
        ) : (
          <Link href={loginHref} aria-label="登录后收藏">
            <Bookmark size={16} aria-hidden="true" />
            <span>收藏</span>
          </Link>
        ))}
      {error && (
        <span className="post-interactions__error" role="status">
          {error}
        </span>
      )}
    </span>
  );
}

function useSafeAuth() {
  try {
    return useAuth();
  } catch {
    return { user: null, loading: false };
  }
}
