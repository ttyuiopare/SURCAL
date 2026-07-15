import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTICLES, getArticle, type ArticleBlock } from '@/lib/articles';
import { absoluteUrl, jsonLdScript, articleSchema, breadcrumbSchema } from '@/lib/seo';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      url: absoluteUrl(`/blog/${article.slug}`),
      publishedTime: article.published,
      modifiedTime: article.updated || article.published,
    },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  if (block.type === 'h2') {
    return (
      <h2 className="heading-md" style={{ color: 'var(--primary-navy)', margin: '2.5rem 0 1rem' }}>
        {block.text}
      </h2>
    );
  }
  if (block.type === 'ul') {
    return (
      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem', margin: '0 0 1.25rem' }}>
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.08rem', margin: '0 0 1.25rem' }}>
      {block.text}
    </p>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          articleSchema({
            title: article.title,
            description: article.description,
            path: `/blog/${article.slug}`,
            datePublished: article.published,
            dateModified: article.updated,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: article.title, path: `/blog/${article.slug}` },
          ]),
        ])}
      />

      <article style={{ maxWidth: '720px', margin: '0 auto' }}>
        <nav style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          <Link href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--primary-navy)' }}>{article.title}</span>
        </nav>

        <h1 className="heading-xl" style={{ marginBottom: '1rem', lineHeight: 1.2 }}>{article.title}</h1>
        <p style={{ color: 'var(--text-secondary)', opacity: 0.8, fontSize: '0.9rem', marginBottom: '3rem' }}>
          {article.readMinutes} min read
        </p>

        {article.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ fontSize: '1.05rem', padding: '0.9rem 2rem', cursor: 'pointer' }}>
              Post a Request for Free
            </button>
          </Link>
        </div>
      </article>
    </div>
  );
}
