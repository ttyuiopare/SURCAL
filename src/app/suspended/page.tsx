'use client';

import React from 'react';
import { PauseCircle } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

/**
 * Shown (via the proxy funnel) to users whose account an admin has temporarily
 * suspended. Distinct from /banned — suspension is reversible and the copy
 * says "temporarily"; the support ticket form is the way to appeal.
 */
export default function SuspendedPage() {
  const { supabase } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px var(--container-padding) 60px',
        background: 'var(--bg-color)',
      }}
    >
      <div className="glass-card" style={{ maxWidth: '520px', padding: '3rem', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '999px',
            background: 'rgba(230, 126, 34, 0.1)',
            color: 'var(--warning-orange, #e67e22)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <PauseCircle size={28} />
        </div>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Account Suspended</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your account has been temporarily suspended for violating policies. While suspended you
          can&apos;t browse, buy, or sell. If you believe this is a mistake,{' '}
          <a href="/support" style={{ color: 'var(--primary-magenta, #e2117e)' }}>
            contact support
          </a>{' '}
          or call <strong>314-764-1341</strong> and our team will review your account.
        </p>
        <button onClick={handleSignOut} className="button-secondary">
          Sign out
        </button>
      </div>
    </div>
  );
}
