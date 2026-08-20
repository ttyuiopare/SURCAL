'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Boxes, Search, Mail, ExternalLink, Zap, AlertCircle } from 'lucide-react';

export type InventoryRow = {
  id: string;
  title: string;
  description: string | null;
  condition: string | null;
  askingPrice: number | string | null;
  isActive: boolean;
  createdAt: string;
  category: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string | null;
};

export type MatchRow = {
  id: string;
  requestId: string;
  requestTitle: string;
  requestBudget: number | string | null;
  outcome: string;
  score: number | string | null;
  createdAt: string;
  sellerName: string | null;
  sellerEmail: string | null;
  itemTitle: string | null;
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'Brand New',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
  for_parts: 'For Parts',
};

export default function AdminInventoryBrowser({
  items,
  matches,
}: {
  items: InventoryRow[];
  matches: MatchRow[];
}) {
  const [tab, setTab] = useState<'inventory' | 'matches'>('inventory');
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  // Same spirit as the matching engine's pre-filter: split the query into words
  // and rank by how many of them an item hits, so "black leather sofa" surfaces
  // the closest stock rather than only exact-substring matches.
  const results = useMemo(() => {
    const pool = activeOnly ? items.filter((i) => i.isActive) : items;
    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return pool;

    return pool
      .map((item) => {
        const hay = [item.title, item.description ?? '', item.category ?? '', item.sellerName]
          .join(' ')
          .toLowerCase();
        const hits = terms.filter((t) => hay.includes(t)).length;
        return { item, hits };
      })
      .filter((r) => r.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .map((r) => r.item);
  }, [items, query, activeOnly]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Tab label={`Inventory (${items.length})`} active={tab === 'inventory'} onClick={() => setTab('inventory')} />
        <Tab label={`Recent matches (${matches.length})`} active={tab === 'matches'} onClick={() => setTab('matches')} />
      </div>

      {tab === 'inventory' ? (
        <>
          <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What does the buyer want? e.g. iphone 13 unlocked"
              style={{
                width: '100%',
                padding: '0.8rem 1rem 0.8rem 2.8rem',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
              Active listings only
            </label>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {query ? `${results.length} match${results.length === 1 ? '' : 'es'}` : `${results.length} item${results.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {results.length === 0 ? (
            <Empty
              icon={<Boxes size={40} />}
              text={query ? `No seller has anything matching “${query}”.` : 'No seller inventory yet.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {results.map((item) => (
                <div key={item.id} className="glass-card" style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--primary-navy)' }}>{item.title}</strong>
                      {item.condition && <Pill text={CONDITION_LABELS[item.condition] ?? item.condition} />}
                      {!item.isActive && <Pill text="Inactive" tone="muted" />}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      {item.sellerName}
                      {item.sellerEmail ? ` · ${item.sellerEmail}` : ''}
                      {item.category ? ` · ${item.category}` : ''}
                      {item.askingPrice != null ? ` · asking $${item.askingPrice}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                    {item.sellerEmail && (
                      <a
                        href={`mailto:${item.sellerEmail}?subject=${encodeURIComponent(`A buyer on Surcal is looking for ${item.title}`)}&body=${encodeURIComponent(
                          `Hi ${item.sellerName},\n\nA buyer just posted a request that matches the "${item.title}" you have listed on Surcal. Take a look and get an offer in early:\n\nhttps://www.surcal.xyz/requests\n\n— Surcal`
                        )}`}
                        className="button-secondary"
                        style={smallBtn}
                      >
                        <Mail size={14} /> Email
                      </a>
                    )}
                    <Link href={`/user/${item.sellerId}`} className="button-secondary" style={smallBtn}>
                      <ExternalLink size={14} /> Seller
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : matches.length === 0 ? (
        <Empty icon={<Zap size={40} />} text="No matches logged yet. They appear here as buyers post requests." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {matches.map((m) => {
            const noMatch = m.outcome === 'no_match';
            return (
              <div key={m.id} className="glass-card" style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {noMatch ? (
                      <AlertCircle size={16} style={{ color: 'var(--danger-red, #e74c3c)', flexShrink: 0 }} />
                    ) : (
                      <Zap size={16} style={{ color: 'var(--ai-purple, #8b5cf6)', flexShrink: 0 }} />
                    )}
                    <strong style={{ color: 'var(--primary-navy)' }}>{m.requestTitle}</strong>
                    {m.requestBudget != null && <Pill text={`$${m.requestBudget}`} />}
                    {!noMatch && m.score != null && <Pill text={`${Math.round(Number(m.score) * 100)}% match`} />}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    {noMatch ? (
                      <span style={{ color: 'var(--danger-red, #e74c3c)' }}>
                        No seller inventory matched — unmet demand.
                      </span>
                    ) : (
                      <>
                        Notified {m.sellerName ?? 'a seller'}
                        {m.sellerEmail ? ` (${m.sellerEmail})` : ''}
                        {m.itemTitle ? ` — has “${m.itemTitle}”` : ''}
                      </>
                    )}
                    {' · '}
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                  <Link href={`/requests/${m.requestId}`} className="button-secondary" style={smallBtn}>
                    <ExternalLink size={14} /> Request
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '1rem 1.2rem',
  flexWrap: 'wrap',
};

const smallBtn: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  fontSize: '0.85rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  textDecoration: 'none',
};

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.1)',
        background: active ? 'var(--primary-navy)' : '#fff',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Pill({ text, tone }: { text: string; tone?: 'muted' }) {
  return (
    <span
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '0.2rem 0.55rem',
        borderRadius: '999px',
        background: tone === 'muted' ? 'rgba(0,0,0,0.06)' : 'rgba(30,58,95,0.08)',
        color: tone === 'muted' ? 'var(--text-secondary)' : 'var(--primary-navy)',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      {text}
    </span>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
      <div style={{ opacity: 0.4, marginBottom: '0.8rem' }}>{icon}</div>
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}
