'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ClientFooterLinks() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
  }, []);

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', color: 'var(--text-secondary)' }}>
        <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
        <Link href="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQ</Link>
        <Link href="/support" style={{ textDecoration: 'none', color: 'inherit' }}>Help & Support</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', color: 'var(--text-secondary)' }}>
      <Link href="/requests" style={{ textDecoration: 'none', color: 'inherit' }}>Requests</Link>
      <Link href="/offers" style={{ textDecoration: 'none', color: 'inherit' }}>Offers</Link>
      <Link href="/messages" style={{ textDecoration: 'none', color: 'inherit' }}>Inbox</Link>
      <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
      <Link href="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQ</Link>
      <Link href="/support" style={{ textDecoration: 'none', color: 'inherit' }}>Help & Support</Link>
    </div>
  );
}
