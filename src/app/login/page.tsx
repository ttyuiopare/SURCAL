'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userState, setUserState] = useState('');
  const [role, setRole] = useState('buyer');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyStep, setShowVerifyStep] = useState(false);
  const [verifyData, setVerifyData] = useState({ fullName: '', address: '', routingNumber: '', accountNumber: '' });
  const [currentUserId, setCurrentUserId] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', authData.user.id).single();
        if (profile?.role === 'seller' && !profile.is_verified) {
          setCurrentUserId(authData.user.id);
          setShowVerifyStep(true);
        } else {
          router.refresh(); // Forces Next.js to fetch the new Auth cookie immediately
          router.push('/');
        }
      }
    } else {
      if (!acceptedTerms) {
        setError('You must accept the Terms and Conditions to sign up.');
        setLoading(false);
        return;
      }
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            state: userState,
          },
        },
      });
      if (error) setError(error.message);
      else if (authData.user) {
        if (role === 'seller') {
          setCurrentUserId(authData.user.id);
          setShowVerifyStep(true);
        } else {
          router.refresh();
          router.push('/');
        }
      }
    }
    
    setLoading(false);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', currentUserId);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.refresh();
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', paddingTop: '80px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', margin: '2rem' }}>
        {!showVerifyStep && (
          <>
            <h1 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Join Surcal'}</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {isLogin ? 'Sign in to your account' : 'Create an account to get started'}
            </p>
          </>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {showVerifyStep ? (
          <div>
            <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>Complete Seller Verification</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>As a seller, you must verify your identity to receive payouts.</p>
            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Legal Full Name</label>
                  <input type="text" required value={verifyData.fullName} onChange={e => setVerifyData({...verifyData, fullName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
               </div>
               <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Residential Address</label>
                  <input type="text" required value={verifyData.address} onChange={e => setVerifyData({...verifyData, address: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
               </div>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Bank Routing Number</label>
                     <input type="text" required value={verifyData.routingNumber} onChange={e => setVerifyData({...verifyData, routingNumber: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} pattern="\d{9}" title="9 digit routing number" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Account Number</label>
                     <input type="text" required value={verifyData.accountNumber} onChange={e => setVerifyData({...verifyData, accountNumber: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                  </div>
               </div>
               <button type="submit" disabled={loading} className="button-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  {loading ? 'Verifying...' : 'Submit Identity & Continue'}
               </button>
            </form>
          </div>
        ) : (
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>I want to...</label>
                <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="radio" name="role" value="buyer" checked={role === 'buyer'} onChange={() => setRole('buyer')} />
                    Be a Buyer
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} />
                    Be a Seller
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
                  required={!isLogin}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>State (US)</label>
                <select 
                  value={userState}
                  onChange={(e) => setUserState(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg-surface)' }} 
                  required={!isLogin}
                >
                  <option value="" disabled>Select your state...</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
              required
            />
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required />
              <label htmlFor="terms" style={{ color: 'var(--text-secondary)' }}>
                I agree to the <Link href="/terms" target="_blank" style={{ color: 'var(--primary-magenta)', textDecoration: 'none', fontWeight: 600 }}>Terms & Conditions</Link>
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} className="button-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        )}

        {!showVerifyStep && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-navy)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
