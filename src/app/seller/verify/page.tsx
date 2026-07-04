'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, CreditCard, Loader2, CheckCircle, Wrench } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { devMarkSellerVerified } from '../../actions/dev-bypass';

export default function SellerVerifyPage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justReturned = searchParams.get('return') === 'true';

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(justReturned);
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');

  // Gate: unverified sellers belong here — and admins are allowed too, so the
  // owner can set up their own Stripe payout account (otherwise an admin can
  // never receive escrow payouts, which breaks their own checkouts).
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!profile) return;
    // Already onboarded → send them to their hub.
    if (profile.stripe_onboarding_complete) {
      router.replace(profile.role === 'seller' ? '/seller' : '/buyer');
      return;
    }
    // Plain buyers (not admins) don't onboard as sellers.
    if (profile.role === 'buyer' && !profile.is_admin) {
      router.replace('/buyer');
    }
  }, [user, profile, router]);

  // If returning from Stripe, confirm the account is fully onboarded.
  useEffect(() => {
    if (!justReturned || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stripe/onboard/status', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (data.complete) {
          router.refresh();
          window.location.href = '/seller';
        } else {
          setChecking(false);
          setPendingMessage(
            "Stripe is still reviewing your details, or onboarding wasn't finished. You can resume below."
          );
        }
      } catch {
        if (!cancelled) {
          setChecking(false);
          setPendingMessage('Could not confirm your Stripe status. Try resuming onboarding.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [justReturned, user, router]);

  async function startOnboarding() {
    setLoading(true);
    setError('');
    try {
      // 20s timeout so a hung Stripe call surfaces an error instead of
      // leaving the user stuck on "Redirecting to Stripe…" forever.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      let res: Response;
      try {
        res = await fetch('/api/stripe/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ returnUrl: `${window.location.origin}/seller/verify?return=true` }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(raw); } catch { /* not JSON */ }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(`Stripe error: ${data.error}`);
        setLoading(false);
      } else {
        setError(`Onboarding failed (HTTP ${res.status}). Make sure Stripe Connect is enabled in your Stripe dashboard.`);
        console.error('[onboard] non-JSON response:', raw.slice(0, 400));
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Stripe took too long to respond (20s). Check that Stripe Connect is enabled and your STRIPE_SECRET_KEY is valid.');
      } else {
        setError(err?.message || 'Could not start Stripe onboarding.');
      }
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <Centered>
        <Loader2 size={28} className="spin" style={{ color: 'var(--primary-navy)' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Confirming your Stripe verification…</p>
        <style jsx>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(29, 158, 117, 0.1)',
              color: 'var(--success-green, #1d9e75)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1 className="heading-md" style={{ color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Verify your seller account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Surcal uses <strong>Stripe</strong> — the same payment service used by Amazon, Shopify, and Lyft — to verify your identity and send your payouts. You only do this once. Most people finish in 2-3 minutes.
          </p>
        </div>

        <div style={{ background: 'rgba(46, 95, 163, 0.05)', border: '1px solid rgba(46, 95, 163, 0.15)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What you&apos;ll need
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            <li>A photo of your driver&apos;s license or state ID (use your phone&apos;s camera)</li>
            <li>Last 4 digits of your SSN</li>
            <li>Your bank account — <strong>tip:</strong> the easiest option is &quot;Log in to your bank&quot; on the bank-info step (works for Chase, BofA, Wells Fargo, Capital One, and most others)</li>
          </ul>
          <p style={{ margin: '0.8rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Don&apos;t want to log in? You can also type your routing + account number manually. They&apos;re printed at the bottom of any check, or shown in your bank&apos;s app under &quot;Direct Deposit&quot; / &quot;Account Details&quot;.
          </p>
        </div>

        {pendingMessage && (
          <div style={{ padding: '1rem', background: 'rgba(230,126,34,0.1)', color: '#b45309', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {pendingMessage}
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Feature>Bank-grade identity verification handled entirely by Stripe</Feature>
          <Feature>Your bank and ID details never touch Surcal's servers</Feature>
          <Feature>Required to receive escrow payouts from buyers</Feature>
        </div>

        <button
          onClick={startOnboarding}
          disabled={loading}
          className="button-primary"
          style={{ width: '100%', padding: '1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <CreditCard size={18} />
          {loading ? 'Redirecting to Stripe…' : pendingMessage ? 'Resume Stripe verification' : 'Verify with Stripe'}
        </button>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', opacity: 0.8 }}>
          You'll be redirected to Stripe and brought right back here when you're done.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <DevBypassButton />
        )}
      </div>
    </Centered>
  );
}

function DevBypassButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function run() {
    setBusy(true);
    setErr('');
    const result = await devMarkSellerVerified();
    if (!result.ok) {
      setErr(result.error || 'Dev bypass failed.');
      setBusy(false);
      return;
    }
    // Hard reload so the layout re-fetches the profile.
    window.location.href = '/seller';
  }

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '0.75rem' }}>
        Development only · not shown in production
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="button-secondary"
        style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
      >
        <Wrench size={14} />
        {busy ? 'Marking verified…' : 'Dev: skip Stripe & mark me verified'}
      </button>
      {err && (
        <p style={{ fontSize: '0.8rem', color: 'var(--danger-red, #e74c3c)', marginTop: '0.5rem', textAlign: 'center' }}>
          {err}
        </p>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px var(--container-padding) 60px',
        background: 'var(--bg-color)',
      }}
    >
      {children}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
      <CheckCircle size={18} color="var(--success-green, #1d9e75)" style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  );
}
