import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/components/auth-provider';
import { FeatureFlagsProvider } from '@/components/feature-flags-provider';
import { findForumCategory, TECHNICAL_DISCUSSIONS } from '@/lib/forum-categories';
import { CategoryPage } from './category-page';

function response(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as Response;
}

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input).includes('/auth/me')
        ? response({ message: '未登录' }, 401)
        : response({
            items: [],
            pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
          }),
    );
  });

  it('renders the shared category template and truthful empty state', async () => {
    const category = findForumCategory('agent');
    if (!category) throw new Error('Agent category missing');
    render(
      <FeatureFlagsProvider allowGuestPosting>
        <AuthProvider>
          <CategoryPage category={category} />
        </AuthProvider>
      </FeatureFlagsProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Agent' })).toBeInTheDocument();
    expect(await screen.findByText('这里还没有帖子')).toBeInTheDocument();
    expect(screen.getByText('成为第一个分享经验的人。')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: '发布帖子' }).some((link) =>
        link.getAttribute('href')?.startsWith('/posts/new'),
      ),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('category=agent'), expect.anything());
  });

  it('uses the project analysis pixel icon on the project breakdown category page', async () => {
    const category = findForumCategory('project-breakdowns');
    if (!category) throw new Error('Project breakdown category missing');
    const { container } = render(
      <FeatureFlagsProvider allowGuestPosting>
        <AuthProvider>
          <CategoryPage category={category} />
        </AuthProvider>
      </FeatureFlagsProvider>,
    );

    const icon = container.querySelector<HTMLImageElement>('.category-route-pixel-project-analysis');
    expect(icon).toBeInTheDocument();
    expect(decodeURIComponent(icon!.src)).toContain('/icons/project-analysis.png');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=project-breakdown'),
      expect.anything(),
    );
  });

  it('renders technical discussions as an aggregate with reusable subcategory links', async () => {
    const { container } = render(
      <FeatureFlagsProvider allowGuestPosting>
        <AuthProvider>
          <CategoryPage category={TECHNICAL_DISCUSSIONS} />
        </AuthProvider>
      </FeatureFlagsProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '技术讨论' })).toBeInTheDocument();
    const subcategories = screen.getByRole('navigation', { name: '技术讨论子分类' });
    expect(subcategories).toHaveTextContent('Vibe Coding');
    expect(subcategories).toHaveTextContent('工具与资源');
    const icon = container.querySelector<HTMLImageElement>(
      '.category-route-pixel-technical-discussion',
    );
    expect(icon).toBeInTheDocument();
    expect(decodeURIComponent(icon!.src)).toContain('/icons/technical-discussion-v2.png');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=technical-discussions'),
      expect.anything(),
    );
  });
});
