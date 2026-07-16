import type { PostSummary } from '@/lib/posts';
import { PostCard } from './post-card';

export function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="community-post-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
