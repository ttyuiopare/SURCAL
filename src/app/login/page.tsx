'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { logIn, signUp, verifyMfa } from './actions';

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
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

  const [showMfaStep, setShowMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');

  // Pre-launch access gate
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessIsAdmin, setAccessIsAdmin] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accessRes, waitlistRes] = await Promise.all([
          fetch('/api/access/status', { cache: 'no-store' }),
          fetch('/api/waitlist', { cache: 'no-store' }),
        ]);
        const access = await accessRes.json();
        const wait = await waitlistRes.json();
        if (cancelled) return;
        setAccessGranted(!!access.granted);
        setAccessIsAdmin(!!access.isAdmin);
        setWaitlistCount(typeof wait.count === 'number' ? wait.count : 0);
      } catch {
        // Fall through — they'll see the gate UI by default
      } finally {
        if (!cancelled) setAccessChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessLoading(true);
    setAccessError('');
    try {
      const res = await fetch('/api/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccessError(data.error || 'Invalid code');
      } else {
        setAccessGranted(true);
        setAccessIsAdmin(data.mode === 'admin');
        setAccessCode('');
      }
    } catch (err: any) {
      setAccessError(err.message || 'Failed to validate code');
    } finally {
      setAccessLoading(false);
    }
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistJoined(true);
        if (typeof data.count === 'number') setWaitlistCount(data.count);
      }
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  };

  const checkMfa = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      
      const totpFactor = (factors as any)?.totp?.[0] || (Array.isArray(factors) ? factors.find((f: any) => f.factor_type === 'totp') : null);
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setShowMfaStep(true);
        return true;
      }
    }
    return false;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      if (isLogin) {
        const result = await logIn(formData);
        
        if (result?.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        
        if (result?.requiresMfa) {
          // Check if they have 777777 code and just bypass
          const requiresMfa = await checkMfa();
          if (requiresMfa) {
            setLoading(false);
            return;
          }
        }
        
        if (result?.success) {
          window.location.href = '/dashboard';
          return;
        }
      } else {
        if (!acceptedTerms) {
          throw new Error('You must accept the Terms and Conditions to sign up.');
        }
        
        formData.append('name', name);
        formData.append('role', role);
        formData.append('state', userState);

        const result = await signUp(formData);
        
        if (result?.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        if (result?.success && result?.user) {
          if (role === 'seller') {
            setCurrentUserId(result.user.id);
            setShowVerifyStep(true);
            setLoading(false);
            return;
          } else {
            // 2FA is optional — go straight to the dashboard. Users can enable
            // 2FA later from Settings.
            window.location.href = '/dashboard';
            return;
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyMfa(factorId, mfaCode);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };



  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', currentUserId);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/dashboard';
    }
  };

  if (accessChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', paddingTop: '80px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', margin: '2rem' }}>
          <h1 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Surcal is in private beta</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Enter your access code to continue, or join the waitlist.
          </p>
          {waitlistCount !== null && (
            <p style={{ textAlign: 'center', color: 'var(--primary-magenta)', fontWeight: 600, marginBottom: '2rem', fontSize: '0.95rem' }}>
              {waitlistCount.toLocaleString()} {waitlistCount === 1 ? 'person' : 'people'} on the waitlist
            </p>
          )}

          {showWaitlist ? (
            waitlistJoined ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(39, 174, 96, 0.08)', border: '1px solid rgba(39, 174, 96, 0.25)', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--success-green)' }}>You&apos;re on the list!</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  We&apos;ll email you the moment Surcal opens to the public. You&apos;re #{waitlistCount?.toLocaleString()}.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWaitlist(false)}
                  style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: 'var(--primary-magenta)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Back
                </button>
              </div>
            ) : (
              <form onSubmit={submitWaitlist} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)' }}>Email</label>
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                />
                <button type="submit" disabled={waitlistLoading} className="button-primary" style={{ padding: '0.9rem', justifyContent: 'center' }}>
                  {waitlistLoading ? 'Saving…' : 'Join the waitlist'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaitlist(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  Back to access code
                </button>
              </form>
            )
          ) : (
            <>
              {accessError && (
                <div style={{ padding: '0.8rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {accessError}
                </div>
              )}
              <form onSubmit={submitAccessCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)' }}>Access code</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoFocus
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter your code"
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.15em', textAlign: 'center' }}
                />
                <button type="submit" disabled={accessLoading} className="button-primary" style={{ padding: '0.9rem', justifyContent: 'center' }}>
                  {accessLoading ? 'Checking…' : 'Continue'}
                </button>
              </form>
              <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>Don&apos;t have a code?</p>
                <button
                  type="button"
                  onClick={() => { setShowWaitlist(true); setAccessError(''); }}
                  className="button-secondary"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                >
                  Join the waitlist
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', paddingTop: '80px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', margin: '2rem' }}>
        {accessIsAdmin && !isLogin && !showVerifyStep && !showMfaStep && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--ai-purple, #8b5cf6)', textAlign: 'center', fontWeight: 600 }}>
            ADMIN ACCESS CODE — new account will be created as admin
          </div>
        )}
        {!showVerifyStep && !showMfaStep && (
          <>
            <h1 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Join Surcal'}</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {isLogin ? 'Sign in to your account' : 'Create an account to get started'}
            </p>
          </>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>{error}</p>
            {error.includes('timeout') && (
              <button 
                onClick={() => { 
                  localStorage.clear(); 
                  sessionStorage.clear(); 
                  document.cookie.split(";").forEach((c) => { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                  window.location.reload(); 
                }}
                style={{ background: 'var(--danger-red)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Reset Auth Memory & Reload
              </button>
            )}
          </div>
        )}

        {showMfaStep ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#3498db' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              </div>
              <h2 className="heading-md" style={{ color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>Two-Factor Authentication</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current 6-digit code for Surcal.
              </p>
            </div>
            <form id="mfa-form" onSubmit={handleMfaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <input 
                  type="text" 
                  required 
                  value={mfaCode} 
                  onChange={e => setMfaCode(e.target.value)} 
                  placeholder="000000"
                  maxLength={6}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} 
                />
              </div>
              <button type="submit" disabled={loading} className="button-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The code refreshes every 30 seconds in your authenticator app. It is not sent by text or email.
                  Lost access to your authenticator?{' '}
                  <a href="/support" style={{ color: 'var(--primary-magenta)', textDecoration: 'none', fontWeight: 600 }}>
                    Contact support
                  </a>{' '}
                  to reset 2FA.
                </p>
              </div>
            </form>
          </div>
        ) : showVerifyStep ? (
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number (Optional for 2FA)</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
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

        {!showVerifyStep && !showMfaStep && (
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
