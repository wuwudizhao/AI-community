import type { PostDetail } from '@/lib/posts';
import { CommentSection } from '@/components/comment/comment-section';
import { PostAside } from './post-aside';
import { PostBreadcrumb } from './post-breadcrumb';
import { PostContent } from './post-content';
import { PostHeader } from './post-header';

export function PostDetailShell({ post }: { post: PostDetail }) {
  return (
    <div className="post-detail-frame">
      <div className="post-detail-grid">
        <div className="post-detail-main">
          <PostBreadcrumb post={post} />
          <article className="post-article">
            <PostHeader post={post} />
            <PostContent title={post.title}>{post.contentMarkdown}</PostContent>
          </article>
          <CommentSection slug={post.slug} />
        </div>
        <PostAside post={post} />
      </div>
    </div>
  );
}
