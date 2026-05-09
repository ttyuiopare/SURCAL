'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, MessageSquare, Settings, LogOut, DollarSign, Heart, FileText, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function BuyerSidebar({ active }: { active: string }) {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  const handleSignout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  const getLinkStyle = (id: string) => {
    const isActive = active === id;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.8rem 1rem',
      background: isActive ? 'var(--primary-navy)' : 'transparent',
      borderRadius: 'var(--border-radius-md)',
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontWeight: isActive ? 500 : 400,
      textDecoration: 'none'
    };
  };

  return (
    <aside style={{ width: '280px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: 'calc(100vh - 80px)', position: 'sticky', top: '80px' }}>
      <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(30, 58, 95, 0.1)', color: 'var(--primary-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase' }}>
          {profile?.name?.substring(0,2) || 'US'}
        </div>
        <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary-navy)' }}>{profile?.name || 'User'}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textTransform: 'capitalize' }}>Buyer Profile</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link href="/buyer/dashboard" style={getLinkStyle('dashboard')}>
          <LayoutDashboard size={20} /> Overview
        </Link>
        <Link href="/buyer/my-requests" style={getLinkStyle('my-requests')}>
          <FileText size={20} /> My Requests
        </Link>
        <Link href="/buyer/offers" style={getLinkStyle('offers')}>
          <MessageSquare size={20} /> Received Offers
        </Link>
        <Link href="/buyer/orders" style={getLinkStyle('orders')}>
          <CheckCircle size={20} /> Orders & Escrow
        </Link>
        <Link href="/buyer/saved" style={getLinkStyle('saved')}>
          <Heart size={20} /> Saved Sellers
        </Link>
        <Link href="/buyer/post-request" style={getLinkStyle('post-request')}>
          <ShoppingCart size={20} /> Post Request
        </Link>
        <Link href="/settings" style={getLinkStyle('settings')}>
          <Settings size={20} /> Settings
        </Link>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button onClick={handleSignout} className="button-secondary" style={{ width: '100%', gap: '0.5rem', color: 'var(--danger-red)', borderColor: 'rgba(231, 76, 60, 0.2)', cursor: 'pointer', justifyContent: 'center' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
