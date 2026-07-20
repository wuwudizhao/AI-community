import type { PostDetail } from '@/lib/posts';
import { Avatar } from '@/components/ui/avatar';
import { PostHeaderActions } from './post-header-actions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PostHeader({ post }: { post: PostDetail }) {
  const authorName =
    post.author.type === 'anonymous'
      ? `${post.author.displayName} · ${post.author.anonymousLabel}`
      : post.author.displayName || post.author.username;
  const publishedAt = post.publishedAt ?? post.createdAt;

  return (
    <header className="post-header">
      <h1>{post.title}</h1>
      <div className="post-header__footer">
        <div className="post-meta">
          <Avatar name={authorName} className="post-meta__avatar" />
          <div>
            <strong>{authorName}</strong>
            <span>
              {post.author.type === 'user' && <>@{post.author.username} · </>}
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </span>
          </div>
        </div>
        <PostHeaderActions
          title={post.title}
          commentCount={post.commentCount}
          slug={post.slug}
          canDelete={post.canDelete}
          initialLiked={post.viewerHasLiked ?? false}
          initialLikeCount={post.likeCount ?? 0}
          initialBookmarked={post.viewerHasBookmarked ?? false}
        />
      </div>
    </header>
  );
}
