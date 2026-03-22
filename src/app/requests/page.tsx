'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, ChevronDown, Tag, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadRequests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch all open requests and related generic data
      const { data } = await supabase.from('requests').select('*, profiles!requests_buyer_id_fkey(name)').eq('status', 'open').order('created_at', { ascending: false });
      
      setRequests(data || []);
      setLoading(false);
    }
    loadRequests();
  }, [supabase, router]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Marketplace...</div>;

  const filtered = requests.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2rem' }}>
          <div>
            <h1 className="heading-xl" style={{ margin: '0 0 0.5rem 0' }}>Wanted Items</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Browse items people want to buy and make your offer.</p>
          </div>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>Request an Item</button>
          </Link>
        </div>

        {/* 2-Column Main Layout */}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
          
          {/* Left Sidebar Filters */}
          <aside style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '100px' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 Filters <Filter size={18} color="var(--primary-magenta)" />
               </h3>

               <div style={{ marginBottom: '2rem' }}>
                 <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Category</h4>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked /> All Categories
                 </label>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="checkbox" /> Electronics & Tech
                 </label>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="checkbox" /> Sneakers & Apparel
                 </label>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="checkbox" /> Collectibles
                 </label>
               </div>

               <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                 <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Budget Range</h4>
                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <input type="number" placeholder="Min" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                   <span style={{ color: 'var(--text-secondary)' }}>-</span>
                   <input type="number" placeholder="Max" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                 </div>
               </div>

               <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                 <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Shipping Speed</h4>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="radio" name="time" defaultChecked /> Any
                 </label>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="radio" name="time" /> Under 3 Days
                 </label>
                 <label style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                   <input type="radio" name="time" /> 1-4 weeks
                 </label>
               </div>
            </div>
          </aside>

          {/* Right Column Content */}
          <main style={{ flex: 1 }}>
            
            {/* Search Bar & Sorter */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search for wanted items (e.g. 'iPhone 15', 'Vintage Nike')..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none', fontSize: '1.05rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Sort by:</span>
                <div style={{ padding: '0.8rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  Newest <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
              {filtered.length} Items found
            </p>

            {/* List Body */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                 No items matching your exact search. Try adjusting keywords.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((req, i) => (
                  <motion.div 
                    key={req.id}
                    className="glass-card list-row-hover"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.3 }}
                    style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', borderLeft: '4px solid transparent' }}
                    onClick={() => router.push(`/requests/${req.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = 'var(--primary-magenta)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 600 }}>{req.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>${req.budget}</span>
                         <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '20px', fontWeight: 600 }}>Open</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={16} /> Requested {new Date(req.created_at).toLocaleDateString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={16} /> Target Price</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={16} /> Nationwide Shipping</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ flex: '0 0 120px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', background: 'var(--bg-color)' }}>
                         <img 
                           src={req.image_url || `https://images.unsplash.com/photo-1620189507195-68309c04c4d0?w=400&auto=format&fit=crop&q=60`} 
                           alt={req.title}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                         />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0', fontSize: '0.95rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                          {req.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Authentic</span>
                      <span style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>New or Used</span>
                      
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buyer: <strong>{req.profiles?.name || 'Private'}</strong></span>
                        <button className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={(e) => { e.stopPropagation(); router.push(`/requests/${req.id}`); }}>View Item</button>
                      </div>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}
