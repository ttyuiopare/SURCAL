'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Boxes, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

type Category = { id: string; name: string };

type InventoryItem = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  condition: string | null;
  asking_price: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  category_id: '',
  condition: 'used',
  asking_price: '',
};

const CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
  { value: 'for_parts', label: 'For Parts' },
];

export default function SellerInventoryPage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile && profile.role !== 'seller') {
      router.push('/buyer');
      return;
    }
    if (!user) return;

    let cancelled = false;
    (async () => {
      const [invRes, catRes] = await Promise.all([
        supabase
          .from('seller_inventory')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
      ]);
      if (!cancelled) {
        setItems((invRes.data as InventoryItem[]) ?? []);
        setCategories((catRes.data as Category[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.role, supabase, router]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? '',
      category_id: item.category_id ?? '',
      condition: item.condition ?? 'used',
      asking_price: item.asking_price != null ? String(item.asking_price) : '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      seller_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      condition: form.condition || null,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
    };

    if (editingId) {
      const { data, error: updErr } = await supabase
        .from('seller_inventory')
        .update(payload)
        .eq('id', editingId)
        .select('*')
        .single();
      if (updErr) {
        setError(updErr.message);
      } else if (data) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? (data as InventoryItem) : i)));
        setShowForm(false);
      }
    } else {
      const { data, error: insErr } = await supabase
        .from('seller_inventory')
        .insert(payload)
        .select('*')
        .single();
      if (insErr) {
        setError(insErr.message);
      } else if (data) {
        setItems((prev) => [data as InventoryItem, ...prev]);
        setShowForm(false);
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item from your inventory? Buyers can still see it on past requests.')) return;
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    const { error: delErr } = await supabase.from('seller_inventory').delete().eq('id', id);
    if (delErr) {
      alert('Delete failed: ' + delErr.message);
      setItems(prev);
    }
  }

  async function toggleActive(item: InventoryItem) {
    const next = !item.is_active;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: next } : i)));
    await supabase.from('seller_inventory').update({ is_active: next }).eq('id', item.id);
  }

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(29, 158, 117, 0.1)',
                color: 'var(--ai-teal, #1d9e75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Boxes size={26} />
            </div>
            <div>
              <h1 className="heading-lg" style={{ margin: 0 }}>My Inventory</h1>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <Sparkles size={16} color="var(--ai-purple, #8b5cf6)" />
                Smart Assistant pings you the moment a buyer requests one of these.
              </p>
            </div>
          </div>
          <button onClick={openCreate} className="button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Item
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Boxes size={48} color="var(--primary-navy)" style={{ opacity: 0.25, marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No inventory yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Add the products you have on hand. When a buyer posts a matching request, you'll be the first to know.
            </p>
            <button onClick={openCreate} className="button-primary" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <Plus size={18} /> Add Your First Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {items.map((item, i) => {
              const cat = categories.find((c) => c.id === item.category_id);
              return (
                <motion.div
                  key={item.id}
                  className="glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', opacity: item.is_active ? 1 : 0.55 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary-navy)' }}>{item.title}</h3>
                    {item.asking_price != null && (
                      <span style={{ fontWeight: 700, color: 'var(--success-green, #1d9e75)', whiteSpace: 'nowrap' }}>${item.asking_price}</span>
                    )}
                  </div>
                  {item.description && (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {cat && (
                      <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(30,58,95,0.07)', borderRadius: '999px', color: 'var(--primary-navy)' }}>
                        {cat.name}
                      </span>
                    )}
                    {item.condition && (
                      <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '999px', color: 'var(--ai-purple, #8b5cf6)', textTransform: 'capitalize' }}>
                        {item.condition.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.8rem' }}>
                    <button
                      onClick={() => openEdit(item)}
                      className="button-secondary"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="button-secondary"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem' }}
                    >
                      {item.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.25)', color: 'var(--danger-red, #e74c3c)', padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer' }}
                      aria-label="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setShowForm(false)}
          >
            <div
              className="glass-card"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <h2 className="heading-md" style={{ marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>
                {editingId ? 'Edit item' : 'Add item to inventory'}
              </h2>
              {error && (
                <div style={{ padding: '0.8rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red, #e74c3c)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Field label="Title">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max 256GB Unlocked"
                    required
                    style={inputStyle}
                  />
                </Field>
                <Field label="Description (optional)">
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Condition, accessories included, anything that helps the AI match buyers..."
                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </Field>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Field label="Category" style={{ flex: 1 }}>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">—</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Condition" style={{ flex: 1 }}>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      style={inputStyle}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Asking price (optional)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.asking_price}
                    onChange={(e) => setForm({ ...form, asking_price: e.target.value })}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </Field>
                <button type="submit" disabled={saving} className="button-primary" style={{ marginTop: '0.5rem', padding: '0.85rem', justifyContent: 'center' }}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to inventory'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.9rem',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'var(--bg-surface, #fff)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', ...style }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      {children}
    </label>
  );
}
