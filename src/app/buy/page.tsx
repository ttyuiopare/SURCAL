import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { absoluteUrl, jsonLdScript, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Can You Buy on Surcal? Browse Categories',
  description:
    'Post what you want in any category — sneakers, electronics, collectibles, watches, auto parts, home goods and fragrance — and let verified sellers compete with offers.',
  alternates: { canonical: '/buy' },
};

export default function BuyIndexPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Buy on Surcal — Categories',
    url: absoluteUrl('/buy'),
    hasPart: CATEGORIES.map((c) => ({
      '@type': 'CollectionPage',
      name: c.name,
      url: absoluteUrl(`/buy/${c.slug}`),
    })),
  };

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          itemList,
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Buy', path: '/buy' },
          ]),
        ])}
      />
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem' }}>What can you buy on Surcal?</h1>
          <p className="text-lead" style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
            Pick a category, post the exact item you want, and let verified sellers compete with offers.
            You only pay when you accept one — and your money stays in escrow until it arrives.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/buy/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div
                className="glass-card"
                style={{ padding: '2rem', height: '100%', borderTop: '4px solid var(--primary-navy)' }}
              >
                <h2 style={{ fontSize: '1.35rem', color: 'var(--primary-navy)', marginBottom: '0.75rem', fontWeight: 600 }}>
                  {c.shortLabel}
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.98rem' }}>
                  {c.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', cursor: 'pointer' }}>
              Post a Request
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
