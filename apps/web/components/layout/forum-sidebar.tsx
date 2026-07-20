'use client';

import { Bell, Code2, FileText, Heart, History, House, Plus, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BUSINESS_CATEGORIES,
  CATEGORY_ICONS,
  TECHNICAL_CATEGORIES,
  categoryHref,
} from '@/lib/forum-categories';
import { PixelCoinIcon } from '@/components/forum/pixel-coin-icon';
import { PixelProjectAnalysisIcon } from '@/components/forum/pixel-project-analysis-icon';
import { PublishEntry } from './publish-entry';

const businessItems = [
  { label: '首页', href: '/', icon: House, iconKey: 'home' },
  ...BUSINESS_CATEGORIES.map((category) => ({
    label: category.label,
    href: categoryHref(category.slug),
    icon: CATEGORY_ICONS[category.iconKey],
    iconKey: category.iconKey,
  })),
];

const technologyItems = TECHNICAL_CATEGORIES.map((category) => ({
  label: category.label,
  href: categoryHref(category.slug),
  icon: CATEGORY_ICONS[category.iconKey],
  iconKey: category.iconKey,
}));

const personalItems = [
  { label: '我的收藏', href: '/me/bookmarks', icon: Star },
  { label: '我的点赞', href: '/me/likes', icon: Heart },
  { label: '我的发布', href: '/posts/mine', icon: FileText },
  { label: '我的通知', href: '/notifications', icon: Bell },
  { label: '浏览历史', href: '/me/history', icon: History },
  { label: '设置', icon: Settings, disabled: true },
] as const;

export function ForumSidebar() {
  const pathname = usePathname();

  return (
    <aside className="community-sidebar" aria-label="社区侧栏">
      <div className="community-sidebar__scroll">
        <SidebarGroup label="赚钱与项目" items={businessItems} pathname={pathname} />
        <SidebarGroup label="技术实现" items={technologyItems} pathname={pathname} />
        <SidebarGroup label="个人空间" items={personalItems} pathname={pathname} />
      </div>
      <PublishEntry className="sidebar-publish">
        <Plus size={17} aria-hidden="true" /> 发布帖子
      </PublishEntry>
    </aside>
  );
}

type SidebarItem = {
  readonly label: string;
  readonly href?: string;
  readonly icon: typeof Code2;
  readonly iconKey?: string;
  readonly disabled?: boolean;
};

function SidebarGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly SidebarItem[];
  pathname: string;
}) {
  return (
    <nav className="sidebar-group" aria-label={label}>
      <span className="sidebar-group__label">{label}</span>
      <ul>
        {items.map(({ label: itemLabel, href, icon: Icon, iconKey, disabled }) => {
          const active = href === '/' ? pathname === '/' : href ? pathname === href : false;
          return (
            <li key={itemLabel}>
              {disabled ? (
                <span className="sidebar-item is-disabled" aria-disabled="true">
                  <Icon
                    className={
                      iconKey === 'home'
                        ? 'reference-sidebar-icon reference-icon--home'
                        : iconKey
                          ? 'forum-category-icon'
                          : undefined
                    }
                    size={17}
                    aria-hidden="true"
                  />
                  <span>{itemLabel}</span>
                </span>
              ) : (
                <Link className={active ? 'sidebar-item is-active' : 'sidebar-item'} href={href!}>
                  {iconKey === 'opportunity' ? (
                    <PixelCoinIcon className="sidebar-pixel-coin" />
                  ) : iconKey === 'breakdown' ? (
                    <PixelProjectAnalysisIcon className="sidebar-pixel-project-analysis" />
                  ) : (
                    <Icon
                      className={
                        iconKey === 'home'
                          ? 'reference-sidebar-icon reference-icon--home'
                          : iconKey
                            ? 'forum-category-icon'
                            : undefined
                      }
                      size={17}
                      aria-hidden="true"
                    />
                  )}
                  <span>{itemLabel}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
