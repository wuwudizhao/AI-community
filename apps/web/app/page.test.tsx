import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/components/auth-provider';
import Home from './page';

describe('Liftoff community home', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input).includes('/auth/me')
        ? ({ ok: false, status: 401, json: async () => ({ message: '未登录' }) } as Response)
        : ({
            ok: true,
            status: 200,
            json: async () => ({
              items: [],
              pagination: {
                page: 1,
                pageSize: 20,
                totalItems: 0,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false,
              },
            }),
          } as Response),
    );
  });

  it('renders the desktop community shell and a truthful empty feed', async () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '发现 AI 赚钱机会把想法变成收入',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '全局搜索' })).toHaveAttribute(
      'placeholder',
      '搜索赚钱机会、项目、工具、用户…',
    );
    expect(screen.getByRole('navigation', { name: '赚钱与项目' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '技术实现' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主要分类快捷入口' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '最新帖子' })).toBeInTheDocument();
    expect(await screen.findByText('还没有帖子')).toBeInTheDocument();
    expect(screen.queryByText(/官方示例/)).not.toBeInTheDocument();
  });
});
