import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ForumSidebar } from './forum-sidebar';

const navigation = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('@/components/auth-provider', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/components/feature-flags-provider', () => ({
  useFeatureFlags: () => ({ allowGuestPosting: true }),
}));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));

describe('ForumSidebar', () => {
  it('links real personal routes and leaves only unimplemented entries disabled', () => {
    render(<ForumSidebar />);
    expect(screen.getByRole('link', { name: '首页' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: '我的发布' })).toHaveAttribute('href', '/posts/mine');
    expect(screen.getByRole('link', { name: '我的通知' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByRole('link', { name: '我的收藏' })).toHaveAttribute('href', '/me/bookmarks');
    expect(screen.getByRole('link', { name: '浏览历史' })).toHaveAttribute('href', '/me/history');
    expect(screen.getByText('我的点赞').closest('[aria-disabled="true"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /发布帖子/ })).toHaveAttribute('href', '/posts/new');
  });

  it('highlights the active route', () => {
    navigation.pathname = '/me/bookmarks';
    render(<ForumSidebar />);
    expect(screen.getByRole('link', { name: '我的收藏' })).toHaveClass('is-active');
    navigation.pathname = '/';
  });
});
