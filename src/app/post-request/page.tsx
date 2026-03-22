'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { improveRequestDescription } from '@/app/actions/ai';
import { Sparkles } from 'lucide-react';

export default function PostRequestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [aiPrice, setAiPrice] = useState<{min: number, max: number, reasoning: string} | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadCats() {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    }
    loadCats();
  }, [supabase]);

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
      if (result) setAiPrice(result);
    } catch (err) {
      console.error(err);
    }
    setLoadingPrice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to post a request.');
      setLoading(false);
      return;
    }

    // Buyers have unlimited requests

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + parseInt(deadlineDays));

    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('request_images').upload(filePath, image);
      if (uploadError) {
        setError('Failed to upload image: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data } = supabase.storage.from('request_images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const ai_description = await improveRequestDescription(description);

    const { error: insertError } = await supabase.from('requests').insert([{
      buyer_id: user.id,
      category_id: categoryId,
      title,
      description,
      ai_description,
      budget: parseFloat(budget),
      deadline: deadlineDate.toISOString(),
      image_url: imageUrl,
    }]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategoryId('');
      setBudget('');
      setDeadlineDays('');
      setImage(null);
      setAiPrice(null);
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
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
                style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--text-primary)' }} 
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
    </div>
  );
}
