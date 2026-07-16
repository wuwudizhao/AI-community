import type { MetadataRoute } from 'next';
import { webEnvironment } from '@/lib/environment';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${webEnvironment.siteUrl}/sitemap.xml`,
  };
}
