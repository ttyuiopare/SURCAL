'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, ShoppingCart, MessageSquare, Award, Shield, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Review = {
  rating: number;
  comment: string | null;
  created_at: string;
  reviewerName: string;
};

/** Row of 5 stars, filling `value` (supports halves) at the given pixel size. */
function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n - 0.5;
        return (
          <Star
            key={n}
            size={size}
            color="#FFB800"
            fill={filled ? '#FFB800' : 'none'}
          />
        );
      })}
    </span>
  );
}

export default function UserProfilePage() {
  const { id } = useParams() as { id: string };
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ requests: 0, bids: 0 });
  const [recentBids, setRecentBids] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
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

      // Reviews this user has received. The `reviews` table + submit flow
      // already exist (buyers leave a review from the request page); here we
      // surface them. Reviewer names are fetched in a second query so we don't
      // depend on a specific foreign-key relationship name.
      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, reviewer_id')
        .eq('reviewee_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (reviewRows && reviewRows.length > 0) {
        const reviewerIds = [...new Set(reviewRows.map((r: any) => r.reviewer_id))];
        const { data: reviewers } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', reviewerIds);
        const nameById: Record<string, string> = Object.fromEntries(
          (reviewers || []).map((p: any) => [p.id, p.name])
        );

        const withNames: Review[] = reviewRows.map((r: any) => ({
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewerName: nameById[r.reviewer_id] || 'Surcal user',
        }));
        setReviews(withNames);
        setAvgRating(
          withNames.reduce((sum, r) => sum + (r.rating || 0), 0) / withNames.length
        );
      }

      setLoading(false);
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Profile...</div>;

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>User Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>We couldn&apos;t locate a profile matching "{id}".</p>
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
            
            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Calendar size={16} /> Member since {new Date(profileData.created_at || Date.now()).toLocaleDateString()}
            </p>

            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <StarRow value={avgRating} size={18} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {avgRating.toFixed(1)}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
            
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

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              Reviews
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {reviews.map((review, i) => (
                <motion.div
                  key={i}
                  className="glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <StarRow value={review.rating} size={16} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                      "{review.comment}"
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <User size={14} /> {review.reviewerName}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Public Activity */}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Recent Active Bids</h2>
        {recentBids.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            This user hasn&apos;t made any recent public bids.
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
