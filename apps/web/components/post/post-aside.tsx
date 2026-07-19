import { ArrowLeft, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import type { PostDetail } from '@/lib/posts';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PublishEntry } from '@/components/layout/publish-entry';
import { categoryHref, findForumCategoryByKey } from '@/lib/forum-categories';

export function PostAside({ post }: { post: PostDetail }) {
  const authorName =
    post.author.type === 'anonymous'
      ? `${post.author.displayName} · ${post.author.anonymousLabel}`
      : post.author.displayName || post.author.username;
  const category = findForumCategoryByKey(post.category.key);

  return (
    <aside className="post-aside" aria-label="帖子辅助信息">
      <Card className="post-aside-card post-author-card">
        <h2>作者</h2>
        <div className="post-author-card__identity">
          <Avatar name={authorName} />
          <div>
            <strong>{authorName}</strong>
            <span>{post.author.type === 'user' ? `@${post.author.username}` : '匿名身份'}</span>
          </div>
        </div>
        {post.author.type === 'user' && post.author.bio && <p>{post.author.bio}</p>}
      </Card>

      <Card className="post-aside-card post-actions-card post-continue-card">
        <h2>继续浏览</h2>
        <Link href="/#feed">
          <ArrowLeft size={15} aria-hidden="true" /> 返回最新讨论
        </Link>
        <Link href={category ? categoryHref(category.slug) : '/#feed'}>
          <FileText size={15} aria-hidden="true" /> 更多{category?.label ?? post.category.label}帖子
        </Link>
        <PublishEntry>
          <Plus size={15} aria-hidden="true" /> 发布帖子
        </PublishEntry>
      </Card>
    </aside>
  );
}
