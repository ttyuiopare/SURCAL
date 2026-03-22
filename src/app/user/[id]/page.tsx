'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, ShoppingCart, MessageSquare, Award, Shield } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UserProfilePage() {
  const { id } = useParams() as { id: string };
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ requests: 0, bids: 0 });
  const [recentBids, setRecentBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase.from('profiles').select('*').limit(1);
      
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        const searchName = id.replace(/-/g, ' ');
        query = query.ilike('name', searchName);
      }
      
      const { data: userProfile } = await query.single();

      if (!userProfile) {
        setLoading(false);
        return;
      }
      setProfileData(userProfile);

      // Fetch Stats
      const { count: reqCount } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('buyer_id', userProfile.id);
      const { count: bidCount } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('seller_id', userProfile.id);
      
      setStats({ requests: reqCount || 0, bids: bidCount || 0 });

      // Fetch recent public activity (bids on open requests)
      const { data: bids } = await supabase.from('bids')
        .select('id, price, message, created_at, requests(id, title)')
        .eq('seller_id', userProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBids(bids || []);
      setLoading(false);
    }
    fetchUser();
  }, [id, supabase]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Profile...</div>;

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>User Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>We couldn't locate a profile matching "{id}".</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 40px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: '3rem', marginBottom: '2rem', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-magenta), var(--ai-purple))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700, border: '4px solid rgba(255,255,255,0.1)' }}>
            {profileData.name?.substring(0, 2).toUpperCase()}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 className="heading-lg" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                {profileData.name}
                {profileData.is_verified && <span title="Verified Seller" style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}><Shield size={24} color="var(--success-green)" /></span>}
              </h1>
              {stats.bids > 5 && (
                 <span title="Experienced Seller" style={{ background: 'rgba(229, 0, 125, 0.1)', color: 'var(--primary-magenta)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                   <Award size={14} /> Top Bidder
                 </span>
              )}
            </div>
            
            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Calendar size={16} /> Member since {new Date(profileData.created_at || Date.now()).toLocaleDateString()}
            </p>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(30, 58, 95, 0.1)', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Requests Posted</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.requests}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--ai-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bids Submitted</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.bids}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Public Activity */}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Recent Active Bids</h2>
        {recentBids.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            This user hasn't made any recent public bids.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {recentBids.map((bid, i) => (
              <motion.div 
                key={bid.id}
                className="glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(bid.created_at).toLocaleDateString()}</span>
                   <span style={{ fontWeight: 700, color: 'var(--success-green)' }}>${bid.price}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{bid.message}"
                </p>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <Link href={`/requests/${bid.requests?.id}`} style={{ textDecoration: 'none', color: 'var(--primary-magenta)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    View Request
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
