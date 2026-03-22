'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Check, Sparkles, Building2 } from 'lucide-react';

export default function PricingPage() {
  const [loading, setLoading] = useState('');
  const [role, setRole] = useState('');
  const supabase = createClient();

  React.useEffect(() => {
    async function checkRole() {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile) setRole(profile.role);
       }
    }
    checkRole();
  }, [supabase]);

  const handleSubscribe = async (planName: string) => {
    setLoading(planName);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Please log in to subscribe.');
      window.location.href = '/login';
      return;
    }

    if (role === 'buyer') {
      alert('Buyers do not need subscriptions! You can post items for free.');
      setLoading('');
      return;
    }

    try {
      const res = await fetch('/api/checkout/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, userId: user.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + data.error);
        setLoading('');
      }
    } catch {
      alert('Failed to initiate checkout.');
      setLoading('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem' }}>Simple, Transparent Pricing</h1>
          <p className="text-lead" style={{ margin: '0 auto', color: 'var(--text-secondary)' }}>
            Choose the plan that best fits your business needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* Free Tier */}
          <div className="glass-card" style={{ flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Free</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/mo</span></p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', minHeight: '50px' }}>Perfect for getting started and exploring the platform.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Up to 3 requests per month</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Up to 10 bids per month</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Standard support</span></li>
            </ul>
            
            <button className="button-secondary" style={{ width: '100%', padding: '1rem' }}>Current Plan</button>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div className="glass-card" style={{ flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column', position: 'relative', border: '2px solid var(--primary-magenta)', transform: 'scale(1.05)', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-magenta)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} /> Most Popular
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-magenta)' }}>Pro</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>$9.99<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/mo</span></p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', minHeight: '50px' }}>Advanced tools for professionals scaling their business.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Unlimited requests</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Unlimited bids</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>AI Description Enhancements</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Priority support</span></li>
            </ul>
            
            <button onClick={() => handleSubscribe('Pro')} disabled={loading === 'Pro'} className="button-primary" style={{ width: '100%', padding: '1rem' }}>
              {loading === 'Pro' ? 'Processing...' : 'Subscribe to Pro'}
            </button>
          </div>

          {/* Business Tier */}
          <div className="glass-card" style={{ flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Building2 size={24} color="var(--text-primary)" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Business</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>$29.99<span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/mo</span></p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', minHeight: '50px' }}>For agencies and high-volume enterprise sellers.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Everything in Pro</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Team management (Up to 5 seats)</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Custom API access</span></li>
              <li style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}><Check size={20} color="var(--success-green)" style={{ flexShrink: 0 }} /> <span>Dedicated account manager</span></li>
            </ul>
            
            <button onClick={() => handleSubscribe('Business')} disabled={loading === 'Business'} className="button-secondary" style={{ width: '100%', padding: '1rem' }}>
              {loading === 'Business' ? 'Processing...' : 'Subscribe to Business'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
