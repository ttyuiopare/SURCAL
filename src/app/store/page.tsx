'use client';

import React, { useEffect, useState } from 'react';
import { Store, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { SITE_URL } from '@/lib/seo';

const CATEGORY_OPTIONS = [
  'Sneakers',
  'Electronics',
  'Collectibles',
  'Watches',
  'Trading cards',
  'Fashion',
  'Other',
];

/**
 * Business store editor. Business sellers set up their public page here
 * (/store/<id> is the public view). Individual sellers can switch to a
 * business account in one click. Reachable before Stripe verification so new
 * business signups coming out of the onboarding survey land somewhere useful.
 */
export default function StoreEditorPage() {
  const { user, profile, supabase } = useAuth();
  const [isBusiness, setIsBusiness] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Seed the form from the profile once it loads.
  useEffect(() => {
    if (!profile) return;
    setIsBusiness(profile.account_type === 'business');
    setBusinessName(profile.business_name ?? '');
    setDescription(profile.business_description ?? '');
    setCategory(profile.business_category ?? '');
    setLink(profile.business_link ?? '');
  }, [profile]);

  useEffect(() => {
    if (!user) window.location.href = '/login';
  }, [user]);

  const switchToBusiness = async () => {
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({ account_type: 'business' })
      .eq('id', user!.id);
    if (err) {
      setError(err.message);
      return;
    }
    setIsBusiness(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSaved(false);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        business_name: businessName.trim(),
        business_description: description.trim() || null,
        business_category: category || null,
        business_link: link.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
  };

  const copyLink = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/store/${profile.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — link is visible to copy manually */
    }
  };

  if (!user || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </div>
    );
  }

  const publicUrl = `${SITE_URL}/store/${profile.id}`;

  return (
    <div style={{ minHeight: '100vh', padding: '100px 1.5rem 4rem', background: 'var(--bg-color)' }}>
      <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto', padding: '2.75rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-magenta), var(--ai-purple))',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Store size={26} />
          </div>
          <h1 className="heading-lg" style={{ marginBottom: '0.4rem' }}>
            Your Store Page
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            A public page with your business info and everything you have listed. Share it anywhere.
          </p>
        </div>

        {isBusiness === false ? (
          /* Individual seller → one-click upgrade */
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your account is set up as an individual seller. Switch to a business account to get a
              public store page with your name, description, and all your active listings in one
              place — free.
            </p>
            <button onClick={switchToBusiness} className="button-primary" style={{ padding: '1rem 1.75rem', fontSize: '1rem' }}>
              Switch to a business account
            </button>
            {error && <p style={{ color: 'var(--danger-red)', fontSize: '0.85rem', marginTop: '1rem' }}>{error}</p>}
          </div>
        ) : (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Business name</label>
              <input
                type="text"
                required
                maxLength={60}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Prime Kicks Co."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Main category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
              >
                <option value="">Select a category…</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>About your business</label>
              <textarea
                maxLength={500}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you sell, what makes you different, shipping speed, anything buyers should know."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Website or social link (optional)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://instagram.com/yourstore"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.7rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            {saved && (
              <div style={{ padding: '0.7rem 1rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '8px', fontSize: '0.85rem' }}>
                Saved! Your store page is live.
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="button-primary"
              style={{ width: '100%', padding: '1rem', justifyContent: 'center', opacity: saving || !businessName.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Saving…' : 'Save store page'}
            </button>

            {/* Public link */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <div
                style={{
                  flex: 1,
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {publicUrl.replace(/^https?:\/\//, '')}
              </div>
              <button type="button" onClick={copyLink} className="button-secondary" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={`/store/${profile.id}`}
                target="_blank"
                rel="noreferrer"
                className="button-secondary"
                style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                <ExternalLink size={16} />
                View
              </a>
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Your store shows the listings you add under Seller → Inventory automatically.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
