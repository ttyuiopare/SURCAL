'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

type Prefs = {
  notify_email_bids: boolean;
  notify_email_matches: boolean;
  notify_push_bids: boolean;
  notify_push_matches: boolean;
};

const DEFAULTS: Prefs = {
  notify_email_bids: true,
  notify_email_matches: true,
  notify_push_bids: true,
  notify_push_matches: true,
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined' ? window.atob(base64) : '';
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function NotificationPreferences() {
  const { user, profile, supabase } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);
  const [pushState, setPushState] = useState<'unsupported' | 'denied' | 'unsubscribed' | 'subscribed' | 'busy'>('unsubscribed');
  const [pushError, setPushError] = useState<string>('');

  // Hydrate from profile.
  useEffect(() => {
    if (!profile) return;
    setPrefs({
      notify_email_bids: profile.notify_email_bids ?? true,
      notify_email_matches: profile.notify_email_matches ?? true,
      notify_push_bids: profile.notify_push_bids ?? true,
      notify_push_matches: profile.notify_push_matches ?? true,
    });
  }, [profile]);

  // Detect push subscription state.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushState('denied');
      return;
    }
    navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
      if (!reg) {
        setPushState('unsubscribed');
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setPushState(sub ? 'subscribed' : 'unsubscribed');
    });
  }, []);

  async function togglePref(key: keyof Prefs) {
    if (!user) return;
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving(key);
    const { error } = await supabase.from('profiles').update({ [key]: next }).eq('id', user.id);
    setSaving(null);
    if (error) {
      // revert on failure
      setPrefs((p) => ({ ...p, [key]: !next }));
      alert('Could not save: ' + error.message);
    }
  }

  async function enablePush() {
    setPushError('');
    setPushState('busy');
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Push is not configured. NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.');
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'unsubscribed');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Server rejected the subscription.');
      }
      setPushState('subscribed');
    } catch (err: any) {
      console.error('[push] enable failed', err);
      setPushError(err?.message ?? 'Could not enable push.');
      setPushState('unsubscribed');
    }
  }

  async function disablePush() {
    setPushError('');
    setPushState('busy');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' });
        await sub.unsubscribe();
      }
      setPushState('unsubscribed');
    } catch (err: any) {
      setPushError(err?.message ?? 'Could not disable push.');
      setPushState('subscribed');
    }
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-navy)' }}>
        <Bell size={20} /> Notification Preferences
      </h2>

      <Group title="Email" icon={<Mail size={16} />}>
        <Toggle
          label="When a buyer requests something you have in inventory"
          checked={prefs.notify_email_matches}
          onChange={() => togglePref('notify_email_matches')}
          loading={saving === 'notify_email_matches'}
        />
        <Toggle
          label="When you receive or your offer status changes"
          checked={prefs.notify_email_bids}
          onChange={() => togglePref('notify_email_bids')}
          loading={saving === 'notify_email_bids'}
        />
      </Group>

      <Group title="Browser push" icon={<Smartphone size={16} />}>
        <div style={{ padding: '0.4rem 0' }}>
          {pushState === 'unsupported' && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Your browser doesn't support push notifications. Try Chrome, Edge, or Firefox.
            </div>
          )}
          {pushState === 'denied' && (
            <div style={{ color: 'var(--danger-red, #e74c3c)', fontSize: '0.88rem' }}>
              You blocked notifications for this site. Allow them in your browser settings, then refresh this page.
            </div>
          )}
          {(pushState === 'unsubscribed' || pushState === 'busy') && (
            <button
              type="button"
              onClick={enablePush}
              disabled={pushState === 'busy'}
              className="button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {pushState === 'busy' ? 'Enabling…' : 'Enable browser push'}
            </button>
          )}
          {pushState === 'subscribed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--success-green, #1d9e75)', fontWeight: 600 }}>
                ✓ Push enabled on this device
              </span>
              <button type="button" onClick={disablePush} className="button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Disable
              </button>
            </div>
          )}
          {pushError && (
            <div style={{ color: 'var(--danger-red, #e74c3c)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {pushError}
            </div>
          )}
        </div>

        {pushState === 'subscribed' && (
          <>
            <Toggle
              label="Inventory matches"
              checked={prefs.notify_push_matches}
              onChange={() => togglePref('notify_push_matches')}
              loading={saving === 'notify_push_matches'}
            />
            <Toggle
              label="Bid activity"
              checked={prefs.notify_push_bids}
              onChange={() => togglePref('notify_push_bids')}
              loading={saving === 'notify_push_bids'}
            />
          </>
        )}
      </Group>
    </div>
  );
}

function Group({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', fontWeight: 600 }}>
        {icon} {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--bg-surface, rgba(0,0,0,0.02))', borderRadius: '8px', padding: '0.4rem 0.8rem' }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, loading }: { label: string; checked: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer', gap: '1rem' }}>
      <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        {loading && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>saving…</span>}
        <span
          onClick={onChange}
          role="switch"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onChange();
            }
          }}
          style={{
            width: '36px',
            height: '20px',
            background: checked ? 'var(--primary-magenta, #e2117e)' : 'rgba(0,0,0,0.2)',
            borderRadius: '999px',
            position: 'relative',
            transition: 'background 0.15s',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: checked ? '18px' : '2px',
              width: '16px',
              height: '16px',
              background: '#fff',
              borderRadius: '999px',
              transition: 'left 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </span>
      </span>
    </label>
  );
}
