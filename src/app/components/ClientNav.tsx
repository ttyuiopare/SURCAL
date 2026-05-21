'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ClientNav({ initialProfile }: { initialProfile?: any }) {
  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) {
          setProfile(data);
        }
      }
      setLoading(false);
    }
    loadUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If loading or not logged in, show default links
  if (loading || !profile) {
    return (
      <div className="nav-links">
        <Link href="/pricing" style={{ textDecoration: 'none' }}>Pricing</Link>
        <Link href="/about" style={{ textDecoration: 'none' }}>About</Link>
        <Link href="/login" className="button-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none', opacity: loading ? 0.7 : 1 }}>Login</Link>
      </div>
    );
  }

  const isBuyer = profile.role === 'buyer';
  const isSeller = profile.role === 'seller';

  return (
    <div className="nav-links">
      <Link href="/requests" style={{ textDecoration: 'none' }}>Requests</Link>
      
      {isSeller && (
        <>
          <Link href="/seller/offers" style={{ textDecoration: 'none' }}>My Offers</Link>
          <Link href="/seller/earnings" style={{ textDecoration: 'none' }}>Earnings</Link>
          <Link href="/seller/manage" style={{ textDecoration: 'none' }}>Manage</Link>
        </>
      )}

      {/* Both can message and access settings/dashboard */}
      <Link href="/messages" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Inbox</Link>
      <Link href="/settings" style={{ textDecoration: 'none' }}>Settings</Link>
      <Link href={isSeller ? "/seller/dashboard" : "/buyer/dashboard"} className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Dashboard</Link>
    </div>
  );
}
