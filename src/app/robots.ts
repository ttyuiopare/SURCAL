import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep gated / non-public areas out of the index.
      disallow: ['/api/', '/admin/', '/buyer/', '/seller/', '/dashboard', '/settings', '/login', '/messages', '/notifications'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
