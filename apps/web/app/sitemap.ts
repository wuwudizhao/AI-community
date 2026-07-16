import type { MetadataRoute } from 'next';
import { FORUM_CATEGORIES, TECHNICAL_DISCUSSIONS } from '@/lib/forum-categories';
import { webEnvironment } from '@/lib/environment';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: webEnvironment.siteUrl, lastModified, changeFrequency: 'weekly' },
    ...[...FORUM_CATEGORIES, TECHNICAL_DISCUSSIONS].map(({ slug }) => ({
      url: `${webEnvironment.siteUrl}/categories/${slug}`,
      lastModified,
      changeFrequency: 'daily' as const,
    })),
  ];
}
