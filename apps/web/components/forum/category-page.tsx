import Link from 'next/link';
import { Suspense } from 'react';
import type { ForumCategory, ForumCategoryFilter } from '@/lib/forum-categories';
import {
  CATEGORY_ICONS,
  TECHNICAL_CATEGORIES,
  TECHNICAL_DISCUSSIONS,
  categoryHref,
} from '@/lib/forum-categories';
import { ForumFooter } from '@/components/layout/forum-footer';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { ForumFeed } from './forum-feed';
import { PixelProjectAnalysisIcon } from './pixel-project-analysis-icon';
import { PixelTechnicalDiscussionIcon } from './pixel-technical-discussion-icon';

type CategoryView = ForumCategory | typeof TECHNICAL_DISCUSSIONS;

export function CategoryPage({ category }: { category: CategoryView }) {
  const aggregate = 'icon' in category;
  const Icon = aggregate ? category.icon : CATEGORY_ICONS[category.iconKey];
  const iconKey = aggregate ? 'tech' : category.iconKey;
  const filter = aggregate ? category.slug : category.key;

  return (
    <div className="liftoff-community" id="top">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page" aria-labelledby="category-title">
          <header className="community-route-heading category-route-heading">
            <span className="category-route-icon" aria-hidden="true">
              {iconKey === 'breakdown' ? (
                <PixelProjectAnalysisIcon className="category-route-pixel-project-analysis" />
              ) : iconKey === 'tech' ? (
                <PixelTechnicalDiscussionIcon className="category-route-pixel-technical-discussion" />
              ) : (
                <Icon
                  className={
                    aggregate
                      ? `reference-shortcut-icon reference-shortcut-icon--${iconKey}`
                      : 'forum-category-icon'
                  }
                  size={24}
                />
              )}
            </span>
            <div>
              <span className="eyebrow">Forum category</span>
              <h1 id="category-title">{category.label}</h1>
              <p>{category.description}</p>
            </div>
          </header>

          {aggregate && <TechnicalCategoryNav />}

          <Suspense fallback={null}>
            <ForumFeed
              category={filter as ForumCategoryFilter}
              activeCategory={filter as ForumCategoryFilter}
              title={category.label}
              eyebrow={aggregate ? 'Technical categories · Latest' : 'Category · Latest'}
              emptyTitle="这里还没有帖子"
              emptyDescription="成为第一个分享经验的人。"
              publishLabel="发布帖子"
              publishHref="/posts/new"
            />
          </Suspense>
        </section>
        <ForumFooter />
      </ForumShell>
    </div>
  );
}

function TechnicalCategoryNav() {
  return (
    <nav className="technical-category-nav" aria-label="技术讨论子分类">
      {TECHNICAL_CATEGORIES.map((category) => (
        <Link href={categoryHref(category.slug)} key={category.key}>
          {category.label}
        </Link>
      ))}
    </nav>
  );
}
