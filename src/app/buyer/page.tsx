'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, MessageSquare, DollarSign, Heart, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BuyerSidebar from './BuyerSidebar';
import { useAuth } from '../providers/AuthProvider';

export default function BuyerDashboard() {
  const { user, profile, supabase } = useAuth();
  const [stats, setStats] = useState({ requests: 0, bids: 0, moneySaved: 0, savedSellers: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingState, setLoadingState] = useState('Loading dashboard...');

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile?.role === 'seller') {
      router.push('/seller');
      return;
    }

    async function loadDashboard() {
      try {
        setLoadingState('Fetching requests...');
        const { count: requestsCount } = await supabase.from('requests').select('*', { count: 'exact' }).eq('buyer_id', user!.id);
        const { data: allBuyerRequests } = await supabase.from('requests').select('id, title, created_at, budget').eq('buyer_id', user!.id).order('created_at', { ascending: false });
        
        let totalBids = 0;
        let totalMoneySaved = 0;
        let activityList: any[] = [];
        
        if (allBuyerRequests && allBuyerRequests.length > 0) {
          const reqIds = allBuyerRequests.map(r => r.id);
          setLoadingState('Fetching bids...');
          const { data: bidsData, count: bidsCount } = await supabase.from('bids').select('id, request_id, created_at, price, status', { count: 'exact' }).in('request_id', reqIds);
        totalBids = bidsCount || 0;
        
        allBuyerRequests.forEach(r => {
          activityList.push({ type: 'request', text: `Published request "${r.title}"`, date: r.created_at });
        });
        
        if (bidsData) {
          bidsData.forEach(b => {
            activityList.push({ type: 'bid', text: `New bid received on a request`, date: b.created_at });
            if (b.status === 'accepted') {
               const req = allBuyerRequests.find(r => r.id === b.request_id);
               if (req && req.budget > b.price) {
                  totalMoneySaved += (req.budget - b.price);
               }
            }
          });
        }
      }
      
      activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activityList.slice(0, 10));
      
      // Mock saved sellers count until table is created
      const totalSavedSellers = 0; 

        setStats({ requests: requestsCount || 0, bids: totalBids, moneySaved: totalMoneySaved, savedSellers: totalSavedSellers });
      } catch (err: any) {
        setLoadingState('Error: ' + err.message);
        console.error("Dashboard load error:", err);
      } finally {
        setLoadingState(prev => prev.startsWith('Error') || prev.startsWith('Redirecting') ? prev : 'done');
      }
    }
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.role]);

  if (loadingState !== 'done' && !loadingState.startsWith('Error')) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>{loadingState}</div>;
  if (loadingState.startsWith('Error')) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center', color: 'red' }}>{loadingState}</div>;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      
      {/* Sidebar */}
      <BuyerSidebar active="dashboard" />

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <h1 className="heading-lg" style={{ marginBottom: '2rem' }}>Buyer Dashboard</h1>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-magenta)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Active Requests</span>
              <FileText size={20} color="var(--primary-magenta)" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem' }}>{stats.requests}</div>
          </motion.div>
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--ai-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Offers Received</span>
              <MessageSquare size={20} color="var(--ai-purple)" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem' }}>{stats.bids}</div>
          </motion.div>
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #2ecc71' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Money Saved</span>
              <DollarSign size={20} color="#2ecc71" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem', color: '#2ecc71' }}>${stats.moneySaved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </motion.div>
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #e74c3c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Saved Sellers</span>
              <Heart size={20} color="#e74c3c" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem' }}>{stats.savedSellers}</div>
          </motion.div>

        </div>

        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary-navy)', fontWeight: 600 }}>Recent Activity</h3>
          
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No recent activity to show.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {recentActivity.map((activity, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(30, 58, 95, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-navy)' }}>
                       {activity.type === 'bid' ? <MessageSquare size={20} /> : <ShoppingCart size={20} />}
                    </div>
                    <div>
                       <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{activity.text}</p>
                       <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
