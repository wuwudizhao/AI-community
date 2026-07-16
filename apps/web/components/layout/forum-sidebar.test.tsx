import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ForumSidebar } from './forum-sidebar';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/components/feature-flags-provider', () => ({
  useFeatureFlags: () => ({ allowGuestPosting: true }),
}));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));

describe('ForumSidebar', () => {
  it('links every configured forum category while leaving unrelated personal placeholders alone', () => {
    render(<ForumSidebar />);

    expect(screen.getByRole('link', { name: '首页' })).toHaveClass('is-active');
    expect(screen.getByRole('navigation', { name: '赚钱与项目' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '技术实现' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '赚钱机会' })).toHaveAttribute(
      'href',
      '/categories/money-opportunities',
    );
    const coin = screen
      .getByRole('link', { name: '赚钱机会' })
      .querySelector<HTMLImageElement>('.sidebar-pixel-coin');
    expect(coin).toBeInTheDocument();
    expect(decodeURIComponent(coin!.src)).toContain('/icons/pixel/coin.png');
    const breakdown = document.querySelector<HTMLImageElement>('.sidebar-pixel-project-analysis');
    expect(breakdown).toBeInTheDocument();
    expect(decodeURIComponent(breakdown!.src)).toContain('/icons/project-analysis.png');
    expect(screen.getByRole('link', { name: '教程与实践' })).toHaveAttribute(
      'href',
      '/categories/tutorials',
    );
    expect(screen.getByRole('link', { name: 'Agent' })).toHaveAttribute(
      'href',
      '/categories/agent',
    );
    expect(
      screen.getByRole('link', { name: 'Agent' }).querySelector('.lucide-bot'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '工具与资源' })).toHaveAttribute(
      'href',
      '/categories/tools-resources',
    );
    expect(screen.getByRole('link', { name: '我的发布' })).toHaveAttribute('href', '/posts/mine');
    expect(screen.getByRole('link', { name: '我的通知' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByText('我的收藏').closest('[aria-disabled="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '我的收藏' })).not.toBeInTheDocument();
    expect(screen.queryByText(/频道整理中|待开放/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /发布帖子/ })).toHaveAttribute('href', '/posts/new');
  });

  it('highlights a category route after direct navigation or refresh', () => {
    navigation.pathname = '/categories/agent';
    render(<ForumSidebar />);
    expect(screen.getByRole('link', { name: 'Agent' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: '首页' })).not.toHaveClass('is-active');
    navigation.pathname = '/';
  });
});
