// Centralised SEO configuration and structured-data (JSON-LD) helpers.
//
// SITE_URL is the single source of truth for canonical URLs, OpenGraph URLs,
// and sitemap entries. It reads NEXT_PUBLIC_SITE_URL when set (recommended in
// production / Vercel) and falls back to the production domain below.
//
// ⚠️  Set NEXT_PUBLIC_SITE_URL to your real domain in Vercel, or change the
//     fallback here, so canonicals and social previews point at the right host.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://surcal.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Surcal';

// Used as the default OpenGraph/Twitter share image. This asset already ships
// in /public. Swap for a purpose-built 1200×630 image when you have one.
export const DEFAULT_OG_IMAGE = '/surcal_hero_abstract.png';

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * JSON-LD is emitted via a <script type="application/ld+json"> tag. Rendering
 * it through dangerouslySetInnerHTML with JSON.stringify is the standard,
 * safe pattern (the payload is our own structured data, not user input).
 */
export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(data),
  };
}

/** Organization schema — helps Google build a Knowledge Panel / brand entity. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/mark.png'),
    description:
      'Surcal is a reverse marketplace where buyers post the exact item they want and verified sellers compete with offers. Escrow-protected by Stripe.',
    sameAs: [] as string[], // add social profile URLs (X, Instagram, etc.) here
  };
}

/** WebSite schema with a SearchAction so Google can show a sitelinks searchbox. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/requests?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** FAQPage schema from a list of Q&A pairs (eligible for rich results). */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/** BreadcrumbList schema from ordered [name, path] pairs. */
export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Article schema for blog posts. */
export function articleSchema(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    image: absoluteUrl(opts.image || DEFAULT_OG_IMAGE),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(opts.path),
    },
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/mark.png') },
    },
  };
}
