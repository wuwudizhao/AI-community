import { CategoryPage } from '@/components/forum/category-page';
import { findForumCategory } from '@/lib/forum-categories';

export default function OpportunitiesPage() {
  const category = findForumCategory('money-opportunities');
  if (!category) throw new Error('Money opportunities category is missing');
  return <CategoryPage category={category} />;
}
