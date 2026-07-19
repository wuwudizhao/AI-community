import { FileText, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { PostSummary } from '@/lib/posts';
import { CATEGORY_ICONS, findForumCategoryByKey } from '@/lib/forum-categories';
import { AuthorBadge } from './author-badge';
import { PixelCoinIcon } from './pixel-coin-icon';
import { PixelProjectAnalysisIcon } from './pixel-project-analysis-icon';
import { TagBadge } from './tag-badge';
import { TimeLabel } from './time-label';

export function PostCard({ post }: { post: PostSummary }) {
  const category = findForumCategoryByKey(post.category.key);
  const CategoryIcon = category ? CATEGORY_ICONS[category.iconKey] : FileText;
  const authorName =
    post.author.type === 'anonymous'
      ? `${post.author.displayName} · ${post.author.anonymousLabel}`
      : post.author.displayName || post.author.username;
  return (
    <article className="forum-post-card">
      <Link
        className="forum-post-card__link"
        href={`/posts/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      />
      <div
        className="forum-post-card__visual"
        aria-hidden="true"
        data-category-icon={category?.key ?? 'fallback'}
      >
        {category?.iconKey === 'opportunity' ? (
          <PixelCoinIcon className="post-card-pixel-coin" />
        ) : category?.iconKey === 'breakdown' ? (
          <PixelProjectAnalysisIcon className="post-card-pixel-project-analysis" />
        ) : (
          <CategoryIcon className={category ? 'forum-category-icon' : undefined} size={24} />
        )}
      </div>
      <div className="forum-post-card__body">
        <div className="forum-post-card__tags">
          {post.tags.map((tag) => (
            <TagBadge key={tag.id}>{tag.name}</TagBadge>
          ))}
        </div>
        <div className="forum-post-card__title-row">
          <h2>{post.title}</h2>
          {post.pinned && <span className="forum-post-card__pinned">置顶</span>}
        </div>
        <p>{post.excerpt}</p>
        <footer>
          <AuthorBadge
            name={authorName}
            handle={post.author.type === 'user' ? post.author.username : undefined}
          />
          <TimeLabel value={post.publishedAt} />
        </footer>
      </div>
      <span className="forum-post-card__comment-count" aria-label={`${post.commentCount} 条评论`}>
        <MessageCircle size={15} aria-hidden="true" />
        {post.commentCount}
      </span>
    </article>
  );
}
