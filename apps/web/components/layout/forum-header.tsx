import { MessageCircleMore, PenLine, Search } from 'lucide-react';
import Link from 'next/link';
import { AuthActions } from '@/components/auth-actions';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { PublishEntry } from './publish-entry';

export function ForumHeader() {
  return (
    <header className="community-header">
      <div className="community-header__brand">
        <Link href="/" aria-label="Liftoff 首页" className="liftoff-brand">
          <span className="liftoff-mark" aria-hidden="true">
            <span />
          </span>
          <strong>Liftoff</strong>
        </Link>
      </div>
      <form className="community-search" role="search" action="/search" method="get">
        <Search size={17} aria-hidden="true" />
        <input aria-label="全局搜索" name="q" placeholder="搜索赚钱机会、项目、工具、用户…" />
        <kbd>⌘ K</kbd>
      </form>
      <div className="community-header__actions">
        <ThemeSwitcher />
        <button
          className="header-icon-button"
          type="button"
          aria-label="消息即将开放"
          disabled
          title="消息即将开放"
        >
          <MessageCircleMore size={18} aria-hidden="true" />
        </button>
        <PublishEntry className="header-publish">
          <PenLine size={16} aria-hidden="true" /> 发布
        </PublishEntry>
        <AuthActions />
      </div>
    </header>
  );
}
