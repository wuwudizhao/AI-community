import type { MetadataRoute } from 'next';
import { FORUM_CATEGORIES, TECHNICAL_DISCUSSIONS } from '@/lib/forum-categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: 'http://localhost:3000', lastModified, changeFrequency: 'weekly' },
    ...[...FORUM_CATEGORIES, TECHNICAL_DISCUSSIONS].map(({ slug }) => ({
      url: `http://localhost:3000/categories/${slug}`,
      lastModified,
      changeFrequency: 'daily' as const,
    })),
  ];
}
