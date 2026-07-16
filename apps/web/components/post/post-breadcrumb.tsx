import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function PostBreadcrumb() {
  return (
    <nav className="post-breadcrumb" aria-label="帖子导航">
      <Link href="/#feed">
        <ArrowLeft size={15} aria-hidden="true" /> 返回最新讨论
      </Link>
    </nav>
  );
}
