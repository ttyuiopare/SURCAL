'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ManageOrdersPage() {
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch projects where user is Buyer AND bid is accepted
      const { data: buyingData } = await supabase.from('requests')
        .select('id, title, budget, created_at, bids!inner(id, price, status, seller_id, profiles!bids_seller_id_fkey(name))')
        .eq('buyer_id', user.id)
        .eq('bids.status', 'accepted');

      // Fetch projects where user is Seller AND bid is accepted
      const { data: sellingData } = await supabase.from('bids')
        .select('id, price, status, request_id, requests!inner(title, budget, created_at, buyer_id, profiles!requests_buyer_id_fkey(name))')
        .eq('seller_id', user.id)
        .eq('status', 'accepted');

      const merged: any[] = [];

      if (buyingData) {
        buyingData.forEach(req => {
          if (req.bids && req.bids.length > 0) {
            const firstBid = Array.isArray(req.bids) ? req.bids[0] : req.bids;
            const profile = firstBid.profiles as any;
            merged.push({
              type: 'buying',
              request_id: req.id,
              title: req.title,
              counterparty: profile?.name || 'Unknown Vendor',
              price: firstBid.price,
              date: req.created_at
            });
          }
        });
      }

      if (sellingData) {
        sellingData.forEach(bid => {
          const reqDetails = bid.requests as any;
          merged.push({
            type: 'selling',
            request_id: bid.request_id,
            title: reqDetails?.title || 'Unknown Item',
            counterparty: reqDetails?.profiles?.name || 'Unknown Buyer',
            price: bid.price,
            date: reqDetails?.created_at
          });
        });
      }

      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActiveProjects(merged);
      setLoading(false);
    }
    loadProjects();
  }, [supabase, router]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Orders...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Active Orders</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage your active purchases and items you are selling.</p>
          </div>
        </div>

        {activeProjects.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You don't have any active orders right now.</p>
            <Link href="/requests" style={{ textDecoration: 'none' }}>
              <button className="button-primary">Browse Marketplace</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeProjects.map((proj, i) => (
              <motion.div 
                key={i}
                className="glass-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: proj.type === 'buying' ? '4px solid var(--primary-magenta)' : '4px solid var(--ai-purple)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: proj.type === 'buying' ? 'var(--primary-magenta)' : 'var(--ai-purple)', marginBottom: '0.8rem', display: 'inline-block', textTransform: 'uppercase' }}>
                      {proj.type === 'buying' ? 'Purchased By You' : 'You are Selling'}
                    </span>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{proj.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                      Counterparty: <strong>{proj.counterparty}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-green)' }}>${proj.price}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
                      <Clock size={14} /> In Progress
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <CheckCircle size={16} color="var(--success-green)" /> Escrow Funded
                  </div>
                  <Link href={`/requests/${proj.request_id}`} style={{ textDecoration: 'none' }}>
                    <button className="button-secondary">View Order Details</button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
