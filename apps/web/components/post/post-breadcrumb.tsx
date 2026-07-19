import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { PostDetail } from '@/lib/posts';
import { categoryHref, findForumCategoryByKey } from '@/lib/forum-categories';

export function PostBreadcrumb({ post }: { post: PostDetail }) {
  const category = findForumCategoryByKey(post.category.key);

  return (
    <nav className="post-breadcrumb" aria-label="帖子导航">
      <Link href="/#feed">
        <ArrowLeft size={15} aria-hidden="true" /> 返回最新讨论
      </Link>
      <ChevronRight size={14} aria-hidden="true" />
      <Link href={category ? categoryHref(category.slug) : '/#feed'}>
        {category?.label ?? post.category.label}
      </Link>
    </nav>
  );
}
