'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Gift } from 'lucide-react';
import { SITE_URL } from '@/lib/seo';

const SHARE_MESSAGE =
  'Check out Surcal — post what you want to buy and let verified sellers compete for your order.';

export default function SharePage() {
  const [copied, setCopied] = useState(false);
  const url = SITE_URL;
  const enc = encodeURIComponent;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to copy manually */
    }
  };

  const nativeShare = async () => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: 'Surcal', text: SHARE_MESSAGE, url });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      copyLink();
    }
  };

  const socials = [
    {
      label: 'X',
      bg: '#000000',
      href: `https://twitter.com/intent/tweet?text=${enc(SHARE_MESSAGE)}&url=${enc(url)}`,
    },
    {
      label: 'Facebook',
      bg: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: 'WhatsApp',
      bg: '#25D366',
      href: `https://wa.me/?text=${enc(`${SHARE_MESSAGE} ${url}`)}`,
    },
    {
      label: 'Email',
      bg: 'var(--primary-navy)',
      href: `mailto:?subject=${enc('You should check out Surcal')}&body=${enc(
        `${SHARE_MESSAGE}\n\n${url}`
      )}`,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        padding: '80px 1.5rem 2rem',
      }}
    >
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '500px', padding: '3rem 2.5rem', textAlign: 'center' }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary-magenta), var(--ai-purple))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}
        >
          <Gift size={32} />
        </div>

        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>
          Enjoying Surcal?
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          The more people posting and selling, the better the offers get. Share Surcal with a
          friend who buys or sells online.
        </p>

        {/* Copyable link */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '0.9rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              textAlign: 'left',
            }}
          >
            {url.replace(/^https?:\/\//, '')}
          </div>
          <button
            onClick={copyLink}
            className="button-secondary"
            style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Native share (mobile) / fallback */}
        <button
          onClick={nativeShare}
          className="button-primary"
          style={{
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '1.05rem',
            marginBottom: '1.5rem',
          }}
        >
          <Share2 size={18} /> Share Surcal
        </button>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1 1 0',
                minWidth: '90px',
                padding: '0.7rem',
                borderRadius: '10px',
                background: s.bg,
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {s.label}
            </a>
          ))}
        </div>

        <Link
          href="/dashboard"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          Maybe later →
        </Link>
      </motion.div>
    </div>
  );
}
