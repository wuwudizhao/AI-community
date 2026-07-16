import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/components/auth-provider';
import OpportunitiesPage from './page';

describe('Opportunity channel page', () => {
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

  it('reuses the shared category page and stable category filter', async () => {
    render(
      <AuthProvider>
        <OpportunitiesPage />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '赚钱机会' })).toBeInTheDocument();
    expect(screen.getByText(/发现值得验证的商业机会/)).toBeInTheDocument();
    expect(await screen.findByText('这里还没有帖子')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=money-opportunity'),
      expect.anything(),
    );
  });
});
