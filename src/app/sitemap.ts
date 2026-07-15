import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { CATEGORIES } from '@/lib/categories';
import { ARTICLES } from '@/lib/articles';

// Static, public, indexable routes. App/dashboard/auth routes are intentionally
// excluded — they are gated and not useful in search.
const STATIC_PATHS = ['/', '/about', '/faq', '/pricing', '/buy', '/blog', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/buy/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updated || a.published,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}
