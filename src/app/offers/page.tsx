'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Link as LinkIcon, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function OffersInteractionsPage() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchInteractions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch requests posted by the user that have bids
      const { data: userRequests } = await supabase.from('requests').select('id, title, bids(id, price, seller_id, message, created_at, profiles!bids_seller_id_fkey(name, is_verified))').eq('buyer_id', user.id);
      
      // 2. Fetch bids placed by the user on other people's requests
      const { data: userBids } = await supabase.from('bids').select('id, price, message, created_at, request_id, requests(title, buyer_id, profiles!requests_buyer_id_fkey(name, is_verified))').eq('seller_id', user.id);

      let merged: any[] = [];

      if (userRequests) {
        userRequests.forEach(req => {
          if (req.bids && req.bids.length > 0) {
            req.bids.forEach((bid: any) => {
              merged.push({
                type: 'incoming_bid',
                request_title: req.title,
                request_id: req.id,
                counterparty: bid.profiles?.name || 'Unknown User',
                is_verified: bid.profiles?.is_verified || false,
                message: bid.message,
                price: bid.price,
                date: new Date(bid.created_at)
              });
            });
          }
        });
      }

      if (userBids) {
        userBids.forEach((bid: any) => {
          merged.push({
            type: 'outgoing_bid',
            request_title: bid.requests?.title || 'Unknown Request',
            request_id: bid.request_id,
            counterparty: bid.requests?.profiles?.name || 'Unknown Buyer',
            is_verified: bid.requests?.profiles?.is_verified || false,
            message: bid.message,
            price: bid.price,
            date: new Date(bid.created_at)
          });
        });
      }

      merged.sort((a, b) => b.date.getTime() - a.date.getTime());
      setInteractions(merged);
      setLoading(false);
    }
    fetchInteractions();
  }, [supabase, router]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Interactions...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="heading-lg" style={{ marginBottom: '0.5rem' }}>My Offers</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Track the offers you've made to buyers and received from sellers.</p>

      {interactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '12px' }}>
          No interactions found. Go post a request or submit a bid to start connecting!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {interactions.map((interaction, i) => (
            <motion.div 
              key={i}
              className="glass-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: interaction.type === 'incoming_bid' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: interaction.type === 'incoming_bid' ? 'var(--success-green)' : 'var(--ai-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={24} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                    {interaction.type === 'incoming_bid' ? 'Offer Received from ' : 'Offer Sent to '} 
                    <Link href={`/user/${interaction.counterparty.replace(/\s+/g, '-').toLowerCase()}`} style={{ color: 'var(--primary-magenta)', textDecoration: 'none', marginLeft: '0.3rem', display: 'flex', alignItems: 'center' }}>
                      {interaction.counterparty}
                      {interaction.is_verified && <span title="Verified User" style={{ display: 'flex', alignItems: 'center' }}><Shield size={16} color="var(--success-green)" style={{ marginLeft: '5px' }} /></span>}
                    </Link>
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{interaction.date.toLocaleDateString()}</span>
                </div>
                
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                  "{interaction.message}"
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ background: 'var(--bg-surface)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                      Offer Amount: <strong style={{ color: 'var(--success-green)' }}>${interaction.price}</strong>
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      On request: <strong>{interaction.request_title}</strong>
                    </span>
                  </div>
                  
                  <Link href={`/requests/${interaction.request_id}`} style={{ textDecoration: 'none' }}>
                    <button className="button-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      <ExternalLink size={16} style={{ marginRight: '0.5rem' }} /> Go to Request
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
