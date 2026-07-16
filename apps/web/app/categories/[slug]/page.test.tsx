import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    notFound: () => {
      throw new Error('NEXT_NOT_FOUND');
    },
    permanentRedirect: (url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    },
  };
});

import ForumCategoryRoute, { generateStaticParams } from './page';

describe('forum category route', () => {
  it('prepares every category and the technical aggregate as direct routes', () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(13);
    expect(params).toContainEqual({ slug: 'money-opportunities' });
    expect(params).toContainEqual({ slug: 'tools-resources' });
    expect(params).toContainEqual({ slug: 'technical-discussions' });
    expect(params).not.toContainEqual({ slug: 'side-projects' });
    expect(params).not.toContainEqual({ slug: 'income-cases' });
  });

  it('uses the standard not-found path for an invalid category', async () => {
    await expect(
      ForumCategoryRoute({ params: Promise.resolve({ slug: 'not-a-real-category' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it.each(['side-projects', 'income-cases'])(
    'permanently redirects the legacy %s route and preserves pagination',
    async (slug) => {
      await expect(
        ForumCategoryRoute({
          params: Promise.resolve({ slug }),
          searchParams: Promise.resolve({ page: '3' }),
        }),
      ).rejects.toThrow('NEXT_REDIRECT:/categories/money-opportunities?page=3');
    },
  );
});
