'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, FileText, Tag, ExternalLink } from 'lucide-react';
import { deleteRequest, deleteBid } from '../../actions/requests';

export type RequestRow = {
  id: string;
  title: string;
  budget: number | string | null;
  status: string;
  createdAt: string;
  buyerName: string;
};

export type BidRow = {
  id: string;
  price: number | string | null;
  status: string;
  createdAt: string;
  sellerName: string;
  requestTitle: string;
  requestId: string;
};

export default function AdminContentManager({
  requests,
  bids,
}: {
  requests: RequestRow[];
  bids: BidRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'requests' | 'bids'>('requests');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function removeRequest(id: string, title: string) {
    if (!window.confirm(`Delete request “${title}” and all offers on it? This cannot be undone.`)) return;
    setBusyId(id);
    setError('');
    const res = await deleteRequest(id);
    setBusyId(null);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function removeBid(id: string) {
    if (!window.confirm('Delete this offer? This cannot be undone.')) return;
    setBusyId(id);
    setError('');
    const res = await deleteBid(id);
    setBusyId(null);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Tab label={`Requests (${requests.length})`} active={tab === 'requests'} onClick={() => setTab('requests')} />
        <Tab label={`Bids (${bids.length})`} active={tab === 'bids'} onClick={() => setTab('bids')} />
      </div>

      {error && (
        <div style={{ padding: '0.8rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {tab === 'requests' ? (
        requests.length === 0 ? (
          <Empty icon={<FileText size={40} />} text="No requests." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {requests.map((r) => (
              <div key={r.id} className="glass-card" style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>{r.title}</strong>
                    <StatusPill status={r.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    by {r.buyerName} · budget ${r.budget ?? '—'} · {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                  <Link href={`/requests/${r.id}`} className="button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ExternalLink size={14} /> View
                  </Link>
                  <button onClick={() => removeRequest(r.id, r.title)} disabled={busyId === r.id} style={deleteBtn}>
                    <Trash2 size={14} /> {busyId === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : bids.length === 0 ? (
        <Empty icon={<Tag size={40} />} text="No bids." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {bids.map((b) => (
            <div key={b.id} className="glass-card" style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--primary-navy)' }}>${b.price ?? '—'}</strong>
                  <StatusPill status={b.status} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>on “{b.requestTitle}”</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  by {b.sellerName} · {new Date(b.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                <Link href={`/requests/${b.requestId}`} className="button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ExternalLink size={14} /> View
                </Link>
                <button onClick={() => removeBid(b.id)} disabled={busyId === b.id} style={deleteBtn}>
                  <Trash2 size={14} /> {busyId === b.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const deleteBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.4rem 0.8rem',
  fontSize: '0.85rem',
  background: 'transparent',
  border: '1px solid rgba(231,76,60,0.4)',
  color: 'var(--danger-red)',
  borderRadius: '8px',
  cursor: 'pointer',
};

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: active ? 'var(--primary-navy)' : 'rgba(0,0,0,0.04)',
        color: active ? '#fff' : 'var(--text-primary)',
      }}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const closed = status === 'closed' || status === 'rejected';
  return (
    <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '999px', background: closed ? 'rgba(231,76,60,0.1)' : 'rgba(39,174,96,0.1)', color: closed ? 'var(--danger-red)' : 'var(--success-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {status}
    </span>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ opacity: 0.3, marginBottom: '0.8rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      {text}
    </div>
  );
}
