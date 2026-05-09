'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Settings, LogOut, TrendingUp, Sparkles, Activity } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SellerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ requests: 0, bids: 0, saved: 0, activeBids: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check for Stripe Subscription Success
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('subscription_success') === 'true') {
          const planName = urlParams.get('plan');
          const sessionId = urlParams.get('session_id');
          if (planName && sessionId) {
            await fetch('/api/checkout/subscribe/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, planName })
            });
            alert(`🎉 Subscription to ${planName} successful!`);
            window.history.replaceState({}, '', '/seller/dashboard');
          }
        }
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData?.role !== 'seller') {
        router.push('/buyer/dashboard');
        return;
      }
      setProfile(profileData);

      let activityList: any[] = [];
      const { count: sellerBidsCount } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('seller_id', user.id);
      const { data: sellerBids } = await supabase.from('bids').select('id, price, created_at, status').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5);
      
      let earned = 0;
      if (sellerBids && sellerBids.length > 0) {
        earned = sellerBids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + Number(b.price), 0);
        sellerBids.forEach(b => {
          activityList.push({ type: 'bid', text: `Submitted a bid for $${b.price}`, date: b.created_at });
        });
      }
      
      activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activityList.slice(0, 10));
      
      setStats({ requests: 0, bids: 0, saved: earned, activeBids: sellerBidsCount || 0 });
        
      setLoading(false);
    }
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSignout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: 'calc(100vh - 80px)', position: 'sticky', top: '80px' }}>
        <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(30, 58, 95, 0.1)', color: 'var(--primary-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase' }}>
            {profile?.name?.substring(0,2) || 'US'}
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary-navy)' }}>{profile?.name || 'User'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textTransform: 'capitalize' }}>Seller Profile</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/seller/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: 'var(--primary-navy)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>
            <LayoutDashboard size={20} /> Overview
          </Link>
          <Link href="/seller/offers" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 'var(--border-radius-md)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <MessageSquare size={20} /> My Bids
          </Link>
          <Link href="/seller/manage" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 'var(--border-radius-md)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <Activity size={20} /> Manage Orders
          </Link>
          <Link href="/seller/pricing" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 'var(--border-radius-md)', color: 'var(--primary-magenta)', fontWeight: 600, textDecoration: 'none', background: 'rgba(229, 0, 125, 0.05)' }}>
            <Sparkles size={20} /> Upgrade Plan
          </Link>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 'var(--border-radius-md)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleSignout} className="button-secondary" style={{ width: '100%', gap: '0.5rem', color: 'var(--danger-red)', borderColor: 'rgba(231, 76, 60, 0.2)', cursor: 'pointer', justifyContent: 'center' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <h1 className="heading-lg" style={{ marginBottom: '2rem' }}>Seller Dashboard</h1>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-magenta)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Active Bids Made</span>
              <MessageSquare size={20} color="var(--primary-magenta)" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem' }}>{stats.activeBids}</div>
          </motion.div>
          <motion.div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>Total Earned</span>
              <TrendingUp size={20} color="var(--success-green)" />
            </div>
            <div className="heading-lg" style={{ fontSize: '2.5rem', color: 'var(--success-green)' }}>${stats.saved.toLocaleString()}</div>
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
                       <MessageSquare size={20} />
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
