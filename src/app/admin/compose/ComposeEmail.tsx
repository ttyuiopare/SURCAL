'use client';

import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

const FIELD: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  background: 'var(--bg-surface)',
};

export default function ComposeEmail({ fromLabel }: { fromLabel: string }) {
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const canSend = form.to.trim() && form.subject.trim() && form.body.trim();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSuccess(true);
      setForm({ to: '', subject: '', body: '' });
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <CheckCircle size={48} color="var(--success-green)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Email sent</h3>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>
          Your message went out from {fromLabel}.
        </p>
        <button type="button" onClick={() => setSuccess(false)} className="button-secondary">
          Compose another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        From <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{fromLabel}</code>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--primary-navy)' }}>To</label>
        <input
          type="email"
          required
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          placeholder="recipient@example.com"
          style={FIELD}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--primary-navy)' }}>Subject</label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Subject line"
          style={FIELD}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--primary-navy)' }}>Message</label>
        <textarea
          required
          rows={10}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Write your message…"
          style={{ ...FIELD, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ padding: '0.7rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading || !canSend}
          className="button-primary"
          style={{ padding: '0.7rem 1.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Send size={15} /> {loading ? 'Sending…' : 'Send email'}
        </button>
      </div>
    </form>
  );
}
