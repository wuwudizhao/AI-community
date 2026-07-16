import Link from 'next/link';
import {
  TECHNICAL_DISCUSSIONS,
  categoryHref,
  findForumCategory,
  type ForumCategoryFilter,
  type ForumCategorySlug,
} from '@/lib/forum-categories';

export type TopCategory = 'latest' | ForumCategoryFilter;

const topChannels: readonly { label: string; href: string; value: TopCategory }[] = [
  { label: '最新', href: '/#feed', value: 'latest' },
  channel('money-opportunities'),
  channel('project-breakdowns'),
  {
    label: TECHNICAL_DISCUSSIONS.label,
    href: categoryHref(TECHNICAL_DISCUSSIONS.slug),
    value: TECHNICAL_DISCUSSIONS.slug,
  },
];

export function CategoryTabs({ active = 'latest' }: { active?: TopCategory }) {
  return (
    <nav className="community-tabs" aria-label="帖子分类" id="categories">
      {topChannels.map(({ label, href, value }) => (
        <Link
          className={active === value ? 'community-tab is-active' : 'community-tab'}
          href={href}
          key={value}
          aria-current={active === value ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function channel(slug: ForumCategorySlug) {
  const category = findForumCategory(slug);
  if (!category) throw new Error(`Unknown forum category: ${slug}`);
  return { label: category.label, href: categoryHref(category.slug), value: category.key };
}
