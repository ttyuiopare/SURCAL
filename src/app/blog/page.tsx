import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '@/lib/articles';
import { absoluteUrl, jsonLdScript, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Surcal Blog — Smart Buying Guides',
  description:
    'Guides for smarter buying: how to beat resale prices, buy high-value items safely, use escrow, and find hard-to-find products by making sellers compete.',
  alternates: { canonical: '/blog' },
};

// Sort newest-first without Date.now(); ISO date strings sort lexicographically.
const posts = [...ARTICLES].sort((a, b) => (a.published < b.published ? 1 : -1));

export default function BlogIndexPage() {
  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Surcal Blog',
    url: absoluteUrl('/blog'),
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.published,
      url: absoluteUrl(`/blog/${p.slug}`),
    })),
  };

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          listSchema,
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ])}
      />
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem' }}>Smart buying guides</h1>
          <p className="text-lead" style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            How to pay less, buy safely, and find what you actually want — by making sellers come to you.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
              <article
                className="glass-card"
                style={{ padding: '2rem' }}
              >
                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-navy)', marginBottom: '0.6rem', fontWeight: 600 }}>
                  {p.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{p.description}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                  {p.readMinutes} min read
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
