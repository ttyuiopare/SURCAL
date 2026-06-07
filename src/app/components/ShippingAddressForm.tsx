'use client';

import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  phone?: string;
  country: string; // ISO 2-letter, default 'US'
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function ShippingAddressForm({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (address: ShippingAddress) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}) {
  const [addr, setAddr] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    country: 'US',
  });
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!addr.name.trim() || !addr.line1.trim() || !addr.city.trim() || !addr.state || !addr.postal_code.trim()) {
      setErr('Please fill in name, street, city, state, and ZIP.');
      return;
    }
    setErr('');
    onConfirm(addr);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <MapPin size={20} color="var(--primary-magenta, #e2117e)" />
          <h2 className="heading-md" style={{ margin: 0, color: 'var(--primary-navy)' }}>Where should we ship?</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Only the seller you accepted will see this address. After you confirm we'll send you to Stripe to fund the escrow.
        </p>

        {err && (
          <div style={{ padding: '0.8rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {err}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <Field label="Recipient name">
            <input type="text" required value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} style={inputStyle} placeholder="Full name" />
          </Field>
          <Field label="Street address">
            <input type="text" required value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} style={inputStyle} placeholder="123 Main St" />
          </Field>
          <Field label="Apt / Suite (optional)">
            <input type="text" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <Field label="City" style={{ flex: 2 }}>
              <input type="text" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="State" style={{ flex: 1 }}>
              <select required value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} style={inputStyle}>
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="ZIP" style={{ flex: 1 }}>
              <input type="text" required value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} style={inputStyle} pattern="\d{5}(-\d{4})?" title="5-digit ZIP" />
            </Field>
          </div>
          <Field label="Phone (optional, for delivery)">
            <input type="tel" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} style={inputStyle} placeholder="555-555-5555" />
          </Field>

          <button type="submit" disabled={loading} className="button-primary" style={{ marginTop: '0.5rem', padding: '0.9rem', justifyContent: 'center' }}>
            {loading ? 'Continuing…' : 'Continue to payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'var(--bg-surface, #fff)',
  fontSize: '0.92rem',
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', ...style }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      {children}
    </label>
  );
}
