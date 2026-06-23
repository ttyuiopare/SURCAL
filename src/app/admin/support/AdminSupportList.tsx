'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send, CheckCircle, ChevronDown } from 'lucide-react';

export type TicketRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  replies: { id: string; body: string; created_at: string }[];
};

export default function AdminSupportList({ tickets }: { tickets: TicketRow[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(tickets[0]?.id ?? null);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [closeAfter, setCloseAfter] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  if (tickets.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <Mail size={42} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>No tickets here</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You&apos;re all caught up.</p>
      </div>
    );
  }

  async function sendReply(ticket: TicketRow) {
    const body = (bodies[ticket.id] ?? '').trim();
    if (!body) return;
    setBusyId(ticket.id);
    setErrorById((prev) => ({ ...prev, [ticket.id]: '' }));

    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          body,
          closeAfter: !!closeAfter[ticket.id],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorById((prev) => ({ ...prev, [ticket.id]: data.error || `HTTP ${res.status}` }));
        return;
      }
      setBodies((prev) => ({ ...prev, [ticket.id]: '' }));
      router.refresh();
    } catch (err: any) {
      setErrorById((prev) => ({ ...prev, [ticket.id]: err.message || 'Network error' }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {tickets.map((t) => {
        const isOpen = openId === t.id;
        const rowBusy = busyId === t.id;
        return (
          <div
            key={t.id}
            className="glass-card"
            style={{
              padding: '1.3rem',
              borderLeft: `4px solid ${t.status === 'closed' ? 'var(--success-green)' : 'var(--primary-magenta)'}`,
            }}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                  <strong style={{ color: 'var(--primary-navy)' }}>{t.subject}</strong>
                  <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '999px', background: t.status === 'closed' ? 'rgba(39,174,96,0.1)' : 'rgba(229,0,125,0.1)', color: t.status === 'closed' ? 'var(--success-green)' : 'var(--primary-magenta)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t.status}
                  </span>
                  {t.replies.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {t.replies.length} reply{t.replies.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  From <strong style={{ color: 'var(--text-primary)' }}>{t.name}</strong> &lt;{t.email}&gt; · {new Date(t.created_at).toLocaleString()}
                </div>
              </div>
              <ChevronDown
                size={20}
                color="var(--text-secondary)"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
              />
            </button>

            {isOpen && (
              <div style={{ marginTop: '1.2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {t.message}
                </div>

                {t.replies.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {t.replies.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'rgba(46, 95, 163, 0.06)',
                          borderLeft: '3px solid var(--primary-navy)',
                          padding: '0.8rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          You · {new Date(r.created_at).toLocaleString()}
                        </div>
                        {r.body}
                      </div>
                    ))}
                  </div>
                )}

                {t.status === 'open' && (
                  <div style={{ marginTop: '1rem' }}>
                    <textarea
                      rows={4}
                      value={bodies[t.id] ?? ''}
                      onChange={(e) => setBodies((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder={`Write a reply to ${t.name}. They&apos;ll receive it as an email from support@surcal.xyz.`}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical', background: 'var(--bg-surface)' }}
                    />
                    {errorById[t.id] && (
                      <div style={{ padding: '0.6rem 0.9rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', fontSize: '0.85rem', marginTop: '0.6rem' }}>
                        {errorById[t.id]}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!closeAfter[t.id]}
                          onChange={(e) => setCloseAfter((prev) => ({ ...prev, [t.id]: e.target.checked }))}
                        />
                        Mark resolved after sending
                      </label>
                      <button
                        type="button"
                        onClick={() => sendReply(t)}
                        disabled={rowBusy || !(bodies[t.id] ?? '').trim()}
                        className="button-primary"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Send size={14} /> {rowBusy ? 'Sending…' : 'Send reply'}
                      </button>
                    </div>
                  </div>
                )}

                {t.status === 'closed' && (
                  <div style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(39,174,96,0.08)', borderRadius: '8px', color: 'var(--success-green)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={14} /> Marked resolved
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
