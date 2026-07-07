'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

/**
 * Downscale + re-encode an image to a reasonable JPEG before upload. iPad photos
 * are large HEIC files that can stall the upload; this keeps them small and in a
 * universally-supported format. Falls back to the original file on any error.
 */
async function prepareImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  const process = async (): Promise<File> => {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('decode failed'));
        el.src = url;
      });
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );
      return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  try {
    // iOS Safari's canvas/toBlob can stall on large photos — never let it hang.
    // Fall back to the original file after 6s.
    return await Promise.race<File>([
      process(),
      new Promise<File>((resolve) => setTimeout(() => resolve(file), 6000)),
    ]);
  } catch {
    return file;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function PostRequestPage() {
  const { user, supabase } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [aiPrice, setAiPrice] = useState<{ min: number; max: number; reasoning: string } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGetEstimate = async () => {
    if (!categoryId || !title || !description) {
      alert('Please fill out Category, Title, and Description to get an accurate estimate.');
      return;
    }
    setLoadingPrice(true);
    try {
      const catName = categories.find(c => c.id === categoryId)?.name || '';
      const { suggestPriceRange } = await import('@/app/actions/ai');
      const result = await suggestPriceRange(catName, title, description);
      if (result) {
        setAiPrice(result);
      } else {
        alert('The price advisor is temporarily unavailable. Please try again in a moment.');
      }
    } catch (err) {
      console.error(err);
      alert('Could not get a price estimate right now. Please try again.');
    }
    setLoadingPrice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    if (!user) { setError('You must be logged in to post a request.'); return; }

    setLoading(true);
    setError('');

    // Safety net: never let the button stay stuck. If any step hangs (network,
    // a slow API), force-recover after 25s with a helpful message. Runs
    // independently of the awaits below, so it fires even if one never resolves.
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setError('That took too long. Your request may have still posted — check "My Requests". If it isn\'t there, please try again.');
    }, 25000);

    try {
      // Shrink/convert the photo in the browser (small + HEIC→JPEG), then send
      // the bytes to the server to upload. Uploading server-side avoids the
      // browser storage-auth stall that was dropping photos on Safari.
      let imageBase64: string | null = null;
      if (image) {
        const prepared = await prepareImage(image);
        // Keep well under Vercel's ~4.5MB request-body limit (base64 adds ~33%).
        if (prepared.size <= 2_500_000) {
          imageBase64 = await fileToDataUrl(prepared).catch(() => null);
        } else {
          console.warn('[post-request] image too large after processing; posting without it');
        }
      }

      // Create the request on the SERVER (admin insert) instead of from the
      // browser Supabase client. The browser client's auth-token refresh was
      // stalling the insert after a few rapid posts; the server route avoids
      // that entirely. Abort after 20s so the fetch can't hang.
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 20000);
      let res: Response;
      try {
        res = await fetch('/api/requests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, categoryId, budget, deadlineDays, imageBase64 }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(abortTimer);
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Could not post your request (HTTP ${res.status}). Please try again.`);
        return;
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategoryId('');
      setBudget('');
      setDeadlineDays('');
      setImage(null);
      setAiPrice(null);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong posting your request. Please try again.');
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem', textAlign: 'center' }}>What do you want to buy?</h1>
          <p className="text-lead" style={{ marginBottom: '3rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Describe the exact physical item you are looking for.
          </p>

        <div className="glass-card" style={{ padding: '3rem' }}>
          {success && (
            <div style={{ padding: '1.5rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(39, 174, 96, 0.2)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Request Posted Successfully!</h3>
              <p style={{ margin: 0 }}>Sellers can now see your request and start bidding.</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Category</label>
                <select 
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="" disabled style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>Select a Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id} style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Request Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} 
                  placeholder="e.g. iPhone 15 Pro Max 256GB Unlocked" 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Item Condition & Specifications</label>
              <textarea 
                rows={6} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                placeholder="Are you looking for Brand New or Used? What accessories do you need? Be specific..."
              ></textarea>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reference Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }} 
              />
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ai-purple)', fontWeight: 700 }}>
                  <Sparkles size={18} /> Smart Assistant Price Advisor
                </div>
                <button type="button" onClick={handleGetEstimate} disabled={loadingPrice} className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  {loadingPrice ? 'Analyzing...' : 'Get Price Estimate'}
                </button>
              </div>
              
              {aiPrice && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Suggested Range: <span style={{ color: 'var(--success-green)', fontSize: '1.1rem' }}>${aiPrice.min} - ${aiPrice.max}</span></p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{aiPrice.reasoning}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Target Price ($)</label>
                <input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} 
                  placeholder="0.00" 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Desired Delivery (Days)</label>
                <input 
                  type="number" 
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  required
                  min="1"
                  style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} 
                  placeholder="7" 
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button type="submit" disabled={loading} className="button-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                {loading ? 'Posting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
}
