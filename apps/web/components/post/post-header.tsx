import type { PostDetail } from '@/lib/posts';
import { Avatar } from '@/components/ui/avatar';
import { TagBadge } from '@/components/forum/tag-badge';
import Link from 'next/link';
import { CATEGORY_ICONS, categoryHref, findForumCategoryByKey } from '@/lib/forum-categories';

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
  const category = findForumCategoryByKey(post.category.key);
  const CategoryIcon = category ? CATEGORY_ICONS[category.iconKey] : null;
  const authorName =
    post.author.type === 'anonymous'
      ? `${post.author.displayName} · ${post.author.anonymousLabel}`
      : post.author.displayName || post.author.username;
  const publishedAt = post.publishedAt ?? post.createdAt;

  return (
    <header className="post-header">
      <Link className="post-header__category" href={category ? categoryHref(category.slug) : '/'}>
        {CategoryIcon && <CategoryIcon size={15} aria-hidden="true" />}
        {category?.label ?? post.category.label}
      </Link>
      {post.tags.length > 0 && (
        <div className="post-header__tags" aria-label="帖子标签">
          {post.tags.map((tag) => (
            <TagBadge key={tag.id}>{tag.name}</TagBadge>
          ))}
        </div>
      )}
      <h1>{post.title}</h1>
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
    </header>
  );
}
