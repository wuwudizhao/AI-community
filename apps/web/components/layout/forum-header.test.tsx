import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForumHeader } from './forum-header';

let authState: Record<string, unknown>;
let allowGuestPosting = true;

vi.mock('@/components/auth-provider', () => ({ useAuth: () => authState }));
vi.mock('@/components/feature-flags-provider', () => ({
  useFeatureFlags: () => ({ allowGuestPosting }),
}));

describe('ForumHeader', () => {
  beforeEach(() => {
    allowGuestPosting = true;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 4 }),
    } as Response);
  });

  it('keeps guest actions honest', () => {
    authState = { user: null, loading: false, logout: vi.fn() };
    render(<ForumHeader />);

    expect(screen.getByRole('textbox', { name: '全局搜索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '消息即将开放' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /发布/ })).toHaveAttribute('href', '/posts/new');
    expect(screen.getByRole('link', { name: '登录' })).toHaveAttribute('href', '/login');
  });

  it('restores the login publishing route when guest posting is disabled', () => {
    authState = { user: null, loading: false, logout: vi.fn() };
    allowGuestPosting = false;
    render(<ForumHeader />);

    expect(screen.getByRole('link', { name: /发布/ })).toHaveAttribute('href', '/login');
  });

  it('routes authenticated publishing and shows the real notification count', async () => {
    authState = {
      user: { username: 'builder', displayName: 'Builder' },
      loading: false,
      logout: vi.fn(),
    };
    render(<ForumHeader />);

    expect(screen.getByRole('link', { name: /发布/ })).toHaveAttribute('href', '/posts/new');
    expect(await screen.findByText('4')).toBeInTheDocument();
  });
});
