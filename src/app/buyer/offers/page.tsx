'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BuyerSidebar from '../BuyerSidebar';
import { useAuth } from '../../providers/AuthProvider';

export default function ReceivedOffersPage() {
  const { user, supabase } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadOffers() {
    if (!user) return;

    // 1. Get all requests by this buyer
    const { data: requests } = await supabase
      .from('requests')
      .select('id, title, budget, status')
      .eq('buyer_id', user.id);

    if (requests && requests.length > 0) {
      const requestIds = requests.map(r => r.id);
      
      // 2. Get all bids for these requests
      const { data: bids } = await supabase
        .from('bids')
        .select(`
          *,
          seller:seller_id(name)
        `)
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

      if (bids) {
        // Map bids to include request info
        const enrichedBids = bids.map(bid => {
          const req = requests.find(r => r.id === bid.request_id);
          return { ...bid, request: req };
        });
        setOffers(enrichedBids);
      }
    }
    setLoading(false);
  }

  const handleAction = async (bidId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(bidId);

    // Update the bid status
    const { error } = await supabase.from('bids').update({ status: action }).eq('id', bidId);
    
    if (!error) {
       // Optimistic UI update
       setOffers(offers.map(o => o.id === bidId ? { ...o, status: action } : o));
    } else {
       alert('Failed to update offer status.');
    }
    setActionLoading(null);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <BuyerSidebar active="offers" />

      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <h1 className="heading-lg" style={{ marginBottom: '2rem' }}>Received Offers</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <MessageSquare size={48} color="var(--primary-navy)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No offers yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You haven't received any bids on your requests yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {offers.map((offer, i) => (
              <motion.div 
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card" 
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                      Request: <span style={{ fontWeight: 500, color: 'var(--primary-navy)' }}>{offer.request?.title}</span>
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Seller: {offer.seller?.name || 'Anonymous Seller'}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} /> Timeline: {offer.timeline}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div className="heading-lg" style={{ color: 'var(--success-green)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                      ${offer.price}
                    </div>
                    {offer.request && offer.price < offer.request.budget && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(46, 204, 113, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        Under Budget
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>{offer.message}</p>
                </div>

                {offer.ai_score && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ background: 'var(--ai-purple)', color: 'white', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                      <Star size={16} fill="white" style={{ marginBottom: '0.2rem' }}/>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{offer.ai_score}</span>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ai-purple)', fontSize: '0.9rem', fontWeight: 600 }}>AI Quality Score</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{offer.ai_reason || 'Smart Assistant analysis indicates this is a competitive bid.'}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {offer.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleAction(offer.id, 'rejected')}
                        disabled={actionLoading === offer.id}
                        className="button-secondary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-red)', borderColor: 'rgba(231, 76, 60, 0.2)' }}
                      >
                        <XCircle size={18} /> {actionLoading === offer.id ? '...' : 'Decline'}
                      </button>
                      <button 
                        onClick={() => handleAction(offer.id, 'accepted')}
                        disabled={actionLoading === offer.id}
                        className="button-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <CheckCircle size={18} /> {actionLoading === offer.id ? '...' : 'Accept Offer'}
                      </button>
                    </>
                  ) : (
                    <span style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '20px', 
                      fontSize: '0.9rem', 
                      fontWeight: 600,
                      background: offer.status === 'accepted' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                      color: offer.status === 'accepted' ? '#2ecc71' : 'var(--danger-red)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {offer.status === 'accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      Offer {offer.status}
                    </span>
                  )}
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
