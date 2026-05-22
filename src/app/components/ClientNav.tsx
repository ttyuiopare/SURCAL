'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ClientNav({ initialProfile }: { initialProfile: any }) {
  const [profile, setProfile] = useState<any>(initialProfile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we already have the profile from the server, we don't need to load it again.
    // We only need to listen for auth changes.
    const supabase = createClient();
    
    // Always sync state with the server prop on mount
    setProfile(initialProfile);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        setProfile(data || { role: 'buyer', id: session.user.id });
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialProfile]);

  // If loading or not logged in, show default links
  if (loading || !profile) {
    return (
      <div className="nav-links">

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
      <Link href={isSeller ? "/seller" : "/buyer"} className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>{isSeller ? "Seller Hub" : "Buyer Hub"}</Link>
    </div>
  );
}
