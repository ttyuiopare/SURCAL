'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';
import NotificationBell from './NotificationBell';

export default function ClientNav() {
  const { user, profile } = useAuth();

  // Logged-out state is decided by auth (`user`), NOT by whether the profile
  // row loaded. Keying off profile caused the Login button to show for
  // signed-in users whenever the profile fetch lagged or failed.
  if (!user) {
    return (
      <div className="nav-links">
        <Link href="/about" style={{ textDecoration: 'none' }}>
          About
        </Link>
        <Link
          href="/login"
          className="button-primary"
          style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          Login
        </Link>
      </div>
    );
  }

  const isSeller = profile?.role === 'seller';

  return (
    <div className="nav-links">
      <Link href="/requests" style={{ textDecoration: 'none' }}>
        Requests
      </Link>

      {isSeller && (
        <>
          <Link href="/seller/inventory" style={{ textDecoration: 'none' }}>
            Inventory
          </Link>
          <Link href="/seller/offers" style={{ textDecoration: 'none' }}>
            My Offers
          </Link>
          <Link href="/seller/earnings" style={{ textDecoration: 'none' }}>
            Earnings
          </Link>
          <Link href="/seller/manage" style={{ textDecoration: 'none' }}>
            Manage
          </Link>
        </>
      )}

      <Link
        href="/messages"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        Inbox
      </Link>
      <NotificationBell />
      {profile?.is_admin && (
        <Link
          href="/admin"
          style={{
            textDecoration: 'none',
            color: 'var(--ai-purple, #8b5cf6)',
            fontWeight: 600,
          }}
        >
          Admin
        </Link>
      )}
      <Link href="/settings" style={{ textDecoration: 'none' }}>
        Settings
      </Link>
      <Link
        href={isSeller ? '/seller' : '/buyer'}
        className="button-secondary"
        style={{
          padding: '0.4rem 1rem',
          fontSize: '0.9rem',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isSeller ? 'Seller Hub' : 'Buyer Hub'}
      </Link>
    </div>
  );
}
