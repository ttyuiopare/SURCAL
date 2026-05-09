'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import BuyerSidebar from '../BuyerSidebar'; // We will create this shared component

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function loadRequests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch requests and their bid counts
      const { data } = await supabase
        .from('requests')
        .select('*, bids(count)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setRequests(data);
      }
      setLoading(false);
    }
    loadRequests();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <BuyerSidebar active="my-requests" />

      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="heading-lg">My Requests</h1>
          <Link href="/buyer/post-request" className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={18} /> New Request
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading your requests...</div>
        ) : requests.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <FileText size={48} color="var(--primary-navy)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No requests yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You haven't posted any requests to the marketplace yet.</p>
            <Link href="/buyer/post-request" className="button-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Create Your First Request</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {requests.map((req, i) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card" 
                style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.8rem', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      background: req.status === 'open' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                      color: req.status === 'open' ? '#2ecc71' : 'var(--danger-red)',
                      textTransform: 'capitalize'
                    }}>
                      {req.status}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} /> {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>{req.title}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><DollarSign size={16} /> Budget: ${req.budget}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={16} /> {req.bids[0]?.count || 0} Offers Received
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link href={`/buyer/offers?request_id=${req.id}`} className="button-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    View Offers
                  </Link>
                  <Link href={`/requests/${req.id}`} className="button-secondary" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ExternalLink size={16} /> Open
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
