import Link from 'next/link';
import { Code2, Sparkles } from 'lucide-react';
import {
  CATEGORY_ICONS,
  TECHNICAL_DISCUSSIONS,
  categoryHref,
  findForumCategory,
} from '@/lib/forum-categories';
import { PixelCoinIcon } from './pixel-coin-icon';
import { PixelLatestIcon } from './pixel-latest-icon';
import { PixelProjectAnalysisIcon } from './pixel-project-analysis-icon';
import { PixelTechnicalDiscussionIcon } from './pixel-technical-discussion-icon';

const shortcuts = [
  { label: '最新', icon: Sparkles, iconKey: 'latest', href: '#feed' },
  shortcut('money-opportunities'),
  shortcut('project-breakdowns'),
  {
    label: TECHNICAL_DISCUSSIONS.label,
    icon: Code2,
    iconKey: 'tech',
    href: categoryHref(TECHNICAL_DISCUSSIONS.slug),
  },
] as const;

export function OpportunityShortcuts() {
  return (
    <nav className="opportunity-shortcuts" aria-label="主要分类快捷入口">
      {shortcuts.map(({ label, icon: Icon, iconKey, href }) => (
        <Link className="opportunity-shortcut is-active" href={href} key={label}>
          <span className="opportunity-shortcut__icon" aria-hidden="true">
            {iconKey === 'latest' ? (
              <PixelLatestIcon className="shortcut-pixel-latest" />
            ) : iconKey === 'opportunity' ? (
              <PixelCoinIcon className="shortcut-pixel-coin" />
            ) : iconKey === 'breakdown' ? (
              <PixelProjectAnalysisIcon className="shortcut-pixel-project-analysis" />
            ) : iconKey === 'tech' ? (
              <PixelTechnicalDiscussionIcon className="shortcut-pixel-technical-discussion" />
            ) : (
              <Icon
                className={`reference-shortcut-icon reference-shortcut-icon--${iconKey}`}
                size={19}
              />
            )}
          </span>
          <strong>{label}</strong>
          <small>查看帖子</small>
        </Link>
      ))}
    </nav>
  );
}

function shortcut(slug: string) {
  const category = findForumCategory(slug);
  if (!category) throw new Error(`Unknown forum category: ${slug}`);
  return {
    label: category.label,
    icon: CATEGORY_ICONS[category.iconKey],
    iconKey: category.iconKey,
    href: categoryHref(category.slug),
  };
}
