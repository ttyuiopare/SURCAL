'use client';

import React from 'react';
import { Heart, Search, Star } from 'lucide-react';
import BuyerSidebar from '../BuyerSidebar';

export default function SavedSellersPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <BuyerSidebar active="saved" />

      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">Saved Sellers</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your favorite and trusted sellers.</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search saved sellers..." 
              style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '20px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '250px' }}
            />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Heart size={48} color="#e74c3c" style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No saved sellers yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            When you find a seller you trust or whose offers you like, you can save them here for quick access in the future.
          </p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.05)', padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Star size={18} color="var(--ai-purple)" />
            <span style={{ color: 'var(--ai-purple)', fontWeight: 500, fontSize: '0.9rem' }}>Feature coming soon: Auto-invite saved sellers to new requests.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
