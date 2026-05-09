'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import BuyerSidebar from '../BuyerSidebar';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Get all requests by this buyer
    const { data: requests } = await supabase
      .from('requests')
      .select('id, title')
      .eq('buyer_id', user.id);

    if (requests && requests.length > 0) {
      const requestIds = requests.map(r => r.id);
      
      // 2. Get accepted bids (which serve as our orders)
      const { data: bids } = await supabase
        .from('bids')
        .select(`
          *,
          seller:seller_id(name)
        `)
        .eq('status', 'accepted')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

      if (bids) {
        // Map bids to include request info
        const enrichedOrders = bids.map(bid => {
          const req = requests.find(r => r.id === bid.request_id);
          return { ...bid, request: req };
        });
        setOrders(enrichedOrders);
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <BuyerSidebar active="orders" />

      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">Orders & Escrow</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Track your active purchases and escrow payments.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
            <ShieldCheck size={18} /> Stripe Escrow Active
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Package size={48} color="var(--primary-navy)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No active orders</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You haven't accepted any offers yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {orders.map((order, i) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card" 
                style={{ padding: '2rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.3rem' }}>
                      {order.request?.title}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Sold by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.seller?.name || 'Seller'}</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-green)' }}>${order.price}</div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Paid</span>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '2rem' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', background: 'var(--border-light)', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', top: '24px', left: '0', width: '25%', height: '2px', background: '#2ecc71', zIndex: 0 }}></div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0 0.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2ecc71', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={24} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2ecc71' }}>Offer Accepted</span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0 0.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={24} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>Payment in Escrow</span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0 0.5rem', opacity: 0.5 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={24} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Processing</span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0 0.5rem', opacity: 0.5 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={24} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Delivered</span>
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', padding: '1rem', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ShieldCheck size={24} color="#2ecc71" />
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', color: '#2ecc71', fontSize: '0.95rem' }}>Funds Secured</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your payment is held safely in Escrow. It will only be released to the seller once you confirm delivery.</p>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
