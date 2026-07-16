import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { CategoryPage } from '@/components/forum/category-page';
import { FORUM_CATEGORIES, TECHNICAL_DISCUSSIONS, findForumCategory } from '@/lib/forum-categories';

type CategoryRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const LEGACY_OPPORTUNITY_SLUGS = new Set(['side-projects', 'income-cases']);

export function generateStaticParams() {
  return [...FORUM_CATEGORIES.map(({ slug }) => ({ slug })), { slug: TECHNICAL_DISCUSSIONS.slug }];
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const category = resolveCategory((await params).slug);
  return category
    ? { title: category.label, description: category.description }
    : { title: '分类不存在' };
}

export default async function ForumCategoryRoute({ params, searchParams }: CategoryRouteProps) {
  const slug = (await params).slug;
  if (LEGACY_OPPORTUNITY_SLUGS.has(slug)) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries((await searchParams) ?? {})) {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
        query.append(key, item);
      }
    }
    permanentRedirect(
      `/categories/money-opportunities${query.size > 0 ? `?${query.toString()}` : ''}`,
    );
  }
  const category = resolveCategory(slug);
  if (!category) notFound();
  return <CategoryPage category={category} />;
}

function resolveCategory(slug: string) {
  return slug === TECHNICAL_DISCUSSIONS.slug ? TECHNICAL_DISCUSSIONS : findForumCategory(slug);
}
