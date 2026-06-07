'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Ban, Check, X, ExternalLink, ShieldAlert } from 'lucide-react';
import { banUser } from '../../actions/admin';
import { resolveFlag } from '../../actions/moderation';

export type FlagRow = {
  id: string;
  content_type: string;
  content_id: string | null;
  flagged_user_id: string | null;
  category: string | null;
  severity: string;
  reason: string | null;
  excerpt: string | null;
  link: string | null;
  status: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_banned: boolean;
};

const SEVERITY_COLOR: Record<string, string> = {
  high: 'var(--danger-red, #e74c3c)',
  medium: '#d96f00',
  low: 'var(--text-secondary)',
};

export default function ModerationQueue({ flags }: { flags: FlagRow[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(id);
    setError('');
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) setError(res.error);
      else setHidden((prev) => new Set(prev).add(id));
      setBusyId(null);
    });
  }

  const visible = flags.filter((f) => !hidden.has(f.id));

  if (visible.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--success-green, #1d9e75)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Queue is clear</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No flagged content needs review right now.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ padding: '0.9rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visible.map((f) => {
          const rowBusy = pending && busyId === f.id;
          return (
            <div
              key={f.id}
              className="glass-card"
              style={{ padding: '1.3rem', borderLeft: `4px solid ${SEVERITY_COLOR[f.severity] ?? 'var(--text-secondary)'}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: SEVERITY_COLOR[f.severity], padding: '0.2rem 0.55rem', borderRadius: '999px', background: `${SEVERITY_COLOR[f.severity]}1a` }}>
                    {f.severity}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{f.category || 'flagged'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>· {f.content_type}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {new Date(f.created_at).toLocaleString()}
                </span>
              </div>

              {f.reason && <p style={{ margin: '0 0 0.6rem', color: 'var(--text-primary)', fontWeight: 500 }}>{f.reason}</p>}

              {f.excerpt && (
                <blockquote style={{ margin: '0 0 0.8rem', padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{f.excerpt}"
                </blockquote>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  By{' '}
                  <strong style={{ color: 'var(--primary-navy)' }}>
                    {f.user_name || f.user_email || 'unknown user'}
                  </strong>
                  {f.user_banned && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--danger-red)', fontWeight: 600, fontSize: '0.78rem' }}>
                      (already banned)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {f.link && (
                    <Link href={f.link} style={{ textDecoration: 'none' }}>
                      <button className="button-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ExternalLink size={14} /> View
                      </button>
                    </Link>
                  )}
                  {f.flagged_user_id && !f.user_banned && (
                    <button
                      disabled={rowBusy}
                      onClick={() => {
                        if (confirm(`Ban "${f.user_name || f.user_email}"? They'll be signed out and unable to sign in.`)) {
                          run(f.id, async () => {
                            const banRes = await banUser(f.flagged_user_id!);
                            if (!banRes.ok) return banRes;
                            return resolveFlag(f.id, 'actioned');
                          });
                        }
                      }}
                      style={pillBtn('rgba(231,76,60,0.08)', 'var(--danger-red, #e74c3c)', 'rgba(231,76,60,0.25)')}
                    >
                      <Ban size={14} /> Ban user
                    </button>
                  )}
                  <button
                    disabled={rowBusy}
                    onClick={() => run(f.id, () => resolveFlag(f.id, 'actioned'))}
                    style={pillBtn('rgba(29,158,117,0.08)', 'var(--success-green, #1d9e75)', 'rgba(29,158,117,0.25)')}
                    title="Mark handled without banning"
                  >
                    <Check size={14} /> Resolve
                  </button>
                  <button
                    disabled={rowBusy}
                    onClick={() => run(f.id, () => resolveFlag(f.id, 'dismissed'))}
                    style={pillBtn('rgba(0,0,0,0.04)', 'var(--text-primary)', 'rgba(0,0,0,0.1)')}
                    title="False positive"
                  >
                    <X size={14} /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function pillBtn(bg: string, color: string, border: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: `1px solid ${border}`,
    padding: '0.45rem 0.7rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
  };
}
