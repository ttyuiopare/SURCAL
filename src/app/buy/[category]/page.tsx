import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { absoluteUrl, jsonLdScript, faqSchema, breadcrumbSchema } from '@/lib/seo';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: `/buy/${cat.slug}` },
    openGraph: {
      title: cat.title,
      description: cat.description,
      url: absoluteUrl(`/buy/${cat.slug}`),
      type: 'website',
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const requestsHref = `/requests?category=${encodeURIComponent(cat.name)}`;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.title,
    description: cat.description,
    url: absoluteUrl(`/buy/${cat.slug}`),
  };

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          collectionSchema,
          faqSchema(cat.faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Buy', path: '/buy' },
            { name: cat.shortLabel, path: `/buy/${cat.slug}` },
          ]),
        ])}
      />

      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          <Link href="/buy" style={{ color: 'inherit', textDecoration: 'none' }}>Buy</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--primary-navy)' }}>{cat.shortLabel}</span>
        </nav>

        {/* Hero */}
        <h1 className="heading-xl" style={{ marginBottom: '1.25rem', lineHeight: 1.15 }}>{cat.h1}</h1>
        <p className="text-lead" style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>{cat.intro}</p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ fontSize: '1.05rem', padding: '0.9rem 2rem', cursor: 'pointer' }}>
              Post a {cat.shortLabel} Request
            </button>
          </Link>
          <Link href={requestsHref} style={{ textDecoration: 'none' }}>
            <button
              className="button-primary"
              style={{ fontSize: '1.05rem', padding: '0.9rem 2rem', cursor: 'pointer', background: 'transparent', color: 'var(--primary-navy)', border: '1px solid var(--primary-navy)', boxShadow: 'none' }}
            >
              Browse open requests
            </button>
          </Link>
        </div>

        {/* How it works (per category) */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading-md" style={{ marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>How it works</h2>
          <ol style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem', fontSize: '1.05rem' }}>
            <li><strong>Post your request.</strong> Describe the exact item, condition, and your target price — the Smart Assistant helps fill in the details.</li>
            <li><strong>Sellers compete.</strong> Verified sellers send competing offers, each scored 1–10 so you skip the spam.</li>
            <li><strong>Pick and pay safely.</strong> Accept the best offer. Your payment stays in Stripe escrow until the item arrives as described.</li>
          </ol>
        </section>

        {/* Example requests */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading-md" style={{ marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>
            Example requests in {cat.shortLabel}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {cat.examples.map((ex) => (
              <div key={ex} style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                {ex}
              </div>
            ))}
          </div>
        </section>

        {/* What people search for — light, honest keyword section */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading-md" style={{ marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>
            A better way to search
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
            If you have been typing things like:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.9, paddingLeft: '1.25rem' }}>
            {cat.targetSearches.map((s) => (
              <li key={s}>&ldquo;{s}&rdquo;</li>
            ))}
          </ul>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '1rem' }}>
            …you can stop searching. Post it once and let the sellers who have it come to you.
          </p>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading-md" style={{ marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>
            {cat.shortLabel} — common questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {cat.faqs.map((f) => (
              <div key={f.question} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.75rem 0' }}>{f.question}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)', color: 'var(--text-primary)', borderRadius: '20px' }}>
          <h2 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Ready to get it at your price?
          </h2>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>Post your request free. Pay only when it shows up at your door.</p>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ background: '#fff', color: 'var(--primary-navy)', fontSize: '1.05rem', padding: '0.9rem 2rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Get Started for Free
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
}
