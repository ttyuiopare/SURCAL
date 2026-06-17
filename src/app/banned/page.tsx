'use client';

import React from 'react';
import { Ban } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

export default function BannedPage() {
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
            background: 'rgba(231, 76, 60, 0.1)',
            color: 'var(--danger-red, #e74c3c)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <Ban size={28} />
        </div>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Your account is suspended</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Access to Surcal has been suspended for this account. If you believe this is a mistake, reply to your
          original signup confirmation email or contact{' '}
          <a href="mailto:support@surcal.xyz" style={{ color: 'var(--primary-magenta, #e2117e)' }}>
            support@surcal.xyz
          </a>
          .
        </p>
        <button onClick={handleSignOut} className="button-secondary">
          Sign out
        </button>
      </div>
    </div>
  );
}
