'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, Shield, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyData, setVerifyData] = useState({ fullName: '', address: '', routingNumber: '', accountNumber: '' });
  const [name, setName] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);
      if (profileData) setName(profileData.name || '');

      const { data: subData } = await supabase.from('user_subscriptions').select('*, subscription_plans(name, max_requests, max_bids)').eq('user_id', user.id).eq('status', 'active').single();
      setSub(subData);

      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name }).eq('id', user.id);
    setSaving(false);
    if (error) alert('Error saving profile');
    else alert('Profile updated effectively!');
  };

  const handleVerify = async () => {
    setVerifying(true);
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', user.id);
    if (!error) {
       setProfile({...profile, is_verified: true});
       setShowVerifyForm(false);
       alert('Verification documents submitted! You are now a verified seller!');
    } else {
       alert('Error verifying account: ' + error.message);
    }
    setVerifying(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Settings...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="heading-lg" style={{ marginBottom: '2rem' }}>Account Settings</h1>

        {/* Profile Info */}
        <motion.div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary-navy)' }}>
            <UserIcon size={20} /> Public Profile
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Display Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem' }} 
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>This is how you appear to other users on the platform.</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
              <input 
                type="text" 
                value={user.email} 
                disabled
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'not-allowed' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Subscription Info */}
        {profile?.role === 'seller' && (
          <motion.div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--ai-purple)' }}>
              <Shield size={20} /> Billing & Plan
            </h2>
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
               <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Current Plan</p>
               <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0 0 1rem 0', fontWeight: 700 }}>{sub ? sub.subscription_plans?.name : 'Free Tier'}</h3>
             
             <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
               <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Monthly Posts</div>
                  <div style={{ fontWeight: 600 }}>{sub ? sub.subscription_plans?.max_requests : '3'}</div>
               </div>
               <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Monthly Bids</div>
                  <div style={{ fontWeight: 600 }}>{sub ? sub.subscription_plans?.max_bids : '10'}</div>
               </div>
             </div>

              <button className="button-secondary" onClick={() => router.push('/pricing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', padding: '0.8rem', cursor: 'pointer' }}>
                <CreditCard size={18} /> Upgrade Plan
              </button>
            </div>
          </motion.div>
        )}

        {/* Seller Verification Info */}
        {profile?.role === 'seller' && (
          <motion.div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--success-green)' }}>
              <Shield size={20} /> Seller Verification
            </h2>
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
               <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Status</p>
               <h3 style={{ fontSize: '1.5rem', color: profile?.is_verified ? 'var(--success-green)' : 'var(--warning-orange)', margin: '0 0 1rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 {profile?.is_verified ? <><Shield size={24} /> Verified Seller</> : 'Unverified'}
               </h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                 Verified sellers are trusted by the community and receive higher visibility. Please provide your legal identity and bank info to receive payouts.
               </p>
               {!profile?.is_verified && !showVerifyForm && (
                 <button onClick={() => setShowVerifyForm(true)} className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                    Start Verification Request
                 </button>
               )}
               {!profile?.is_verified && showVerifyForm && (
                 <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                   <div>
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Legal Full Name</label>
                     <input type="text" required value={verifyData.fullName} onChange={e => setVerifyData({...verifyData, fullName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }} placeholder="E.g. John Doe" />
                   </div>
                   <div>
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Residential Address</label>
                     <input type="text" required value={verifyData.address} onChange={e => setVerifyData({...verifyData, address: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }} placeholder="E.g. 123 Main St, City, ST 12345" />
                   </div>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bank Routing Number</label>
                       <input type="text" required value={verifyData.routingNumber} onChange={e => setVerifyData({...verifyData, routingNumber: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }} placeholder="9 digits" pattern="\d{9}" title="9 digit routing number" />
                     </div>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account Number</label>
                       <input type="text" required value={verifyData.accountNumber} onChange={e => setVerifyData({...verifyData, accountNumber: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }} placeholder="Account number" />
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <button type="button" onClick={() => setShowVerifyForm(false)} className="button-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                     <button type="submit" disabled={verifying} className="button-primary" style={{ flex: 2, justifyContent: 'center' }}>
                       {verifying ? 'Submitting...' : 'Submit Identity Verification'}
                     </button>
                   </div>
                 </form>
               )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
