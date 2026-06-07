'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';

export default function ClientFooterLinks() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1.5rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
          About Us
        </Link>
        <Link href="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>
          FAQ
        </Link>
        <Link href="/support" style={{ textDecoration: 'none', color: 'inherit' }}>
          Help & Support
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1.5rem',
        color: 'var(--text-secondary)',
      }}
    >
      <Link href="/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
        Requests
      </Link>
      <Link href="/messages" style={{ textDecoration: 'none', color: 'inherit' }}>
        Inbox
      </Link>
      <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
        About Us
      </Link>
      <Link href="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>
        FAQ
      </Link>
      <Link href="/support" style={{ textDecoration: 'none', color: 'inherit' }}>
        Help & Support
      </Link>
    </div>
  );
}
