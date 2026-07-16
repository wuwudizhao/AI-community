import { afterEach, describe, expect, it, vi } from 'vitest';

describe('production public URLs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses the configured site origin for sitemap and robots', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://woyaoqifei.club');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.woyaoqifei.club/api');
    vi.resetModules();

    const [{ default: sitemap }, { default: robots }] = await Promise.all([
      import('./sitemap'),
      import('./robots'),
    ]);

    expect(
      sitemap().every(
        ({ url }) =>
          url === 'https://woyaoqifei.club' || url.startsWith('https://woyaoqifei.club/'),
      ),
    ).toBe(true);
    expect(robots().sitemap).toBe('https://woyaoqifei.club/sitemap.xml');
  });
});
