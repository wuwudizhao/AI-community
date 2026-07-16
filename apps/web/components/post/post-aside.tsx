import { Bell, CalendarDays, FileText, MessageCircle, Plus, Tags, UserRound } from 'lucide-react';
import Link from 'next/link';
import type { PostDetail } from '@/lib/posts';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PublishEntry } from '@/components/layout/publish-entry';
import { PostDeleteControl } from './post-delete-control';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function PostAside({ post }: { post: PostDetail }) {
  const authorName =
    post.author.type === 'anonymous'
      ? `${post.author.displayName} · ${post.author.anonymousLabel}`
      : post.author.displayName || post.author.username;
  const publishedAt = post.publishedAt ?? post.createdAt;
  const wasUpdated = new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime();

  return (
    <aside className="post-aside" aria-label="帖子辅助信息">
      <Card className="post-aside-card">
        <h2>帖子信息</h2>
        <dl className="post-facts">
          <div>
            <dt>
              <CalendarDays size={15} aria-hidden="true" /> 发布时间
            </dt>
            <dd>{formatDate(publishedAt)}</dd>
          </div>
          {wasUpdated && (
            <div>
              <dt>
                <FileText size={15} aria-hidden="true" /> 最后更新
              </dt>
              <dd>{formatDate(post.updatedAt)}</dd>
            </div>
          )}
          <div>
            <dt>
              <MessageCircle size={15} aria-hidden="true" /> 评论
            </dt>
            <dd>{post.commentCount}</dd>
          </div>
          <div>
            <dt>
              <Tags size={15} aria-hidden="true" /> 标签
            </dt>
            <dd>{post.tags.length}</dd>
          </div>
        </dl>
      </Card>

      <Card className="post-aside-card post-author-card">
        <h2>作者</h2>
        <div className="post-author-card__identity">
          <Avatar name={authorName} />
          <div>
            <strong>{authorName}</strong>
            <span>
              {post.author.type === 'user' ? `@${post.author.username}` : '匿名身份'}
            </span>
          </div>
        </div>
        {post.author.type === 'user' && post.author.bio && <p>{post.author.bio}</p>}
      </Card>

      <Card className="post-aside-card community-guidance">
        <h2>社区提示</h2>
        <ul>
          <li>说明机会或项目的真实背景</li>
          <li>区分预估收入与实际收入</li>
          <li>尽量披露成本、周期和限制条件</li>
          <li>不要泄露密钥、Cookie、密码或隐私</li>
        </ul>
      </Card>

      <Card className="post-aside-card post-actions-card">
        <h2>相关操作</h2>
        <Link href="/">
          <UserRound size={15} aria-hidden="true" /> 返回首页
        </Link>
        <PublishEntry>
          <Plus size={15} aria-hidden="true" /> 发布帖子
        </PublishEntry>
        <Link href="/posts/mine">
          <FileText size={15} aria-hidden="true" /> 我的帖子
        </Link>
        <Link href="/notifications">
          <Bell size={15} aria-hidden="true" /> 我的通知
        </Link>
        {post.canDelete && <PostDeleteControl slug={post.slug} />}
      </Card>
    </aside>
  );
}
