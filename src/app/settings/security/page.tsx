'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SecuritySettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();

  useEffect(() => {
    checkEnrollment();
  }, []);

  const checkEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      if (error.message.includes('missing sub claim') || error.message.includes('invalid claim')) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }
      setError('Failed to fetch MFA status.');
      return;
    }
    const totpFactor = data.totp.find((f: any) => f.status === 'verified');
    if (totpFactor) {
      setEnrolled(true);
    }
  };

  const startEnrollment = async () => {
    setLoading(true);
    setError('');

    try {
      // Clean up any broken/unverified factors first to prevent the "already exists" error
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        if (factorsError.message.includes('missing sub claim') || factorsError.message.includes('invalid claim')) {
          await supabase.auth.signOut();
          window.location.href = '/login';
          return;
        }
      }

      if (factors && factors.totp) {
        for (const factor of factors.totp) {
          if (factor.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        setError(error.message);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during enrollment.');
      console.error('MFA Enrollment Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError('');

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }

      if (!challenge.data || !challenge.data.id) {
        setError('Failed to create MFA challenge. Please try again.');
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode,
      });

      if (verify.error) {
        setError('Invalid code. Please try again.');
        return;
      }

      setSuccess('Two-Factor Authentication successfully enabled!');
      setEnrolled(true);
      setQrCode(null);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during verification.');
      console.error('MFA Verification Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    setLoading(true);
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp.find((f: any) => f.status === 'verified');

    if (totpFactor) {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) {
        setError(error.message);
      } else {
        setEnrolled(false);
        setSuccess('Two-Factor Authentication disabled.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '600px', margin: '4rem auto' }}>
      <h1 className="heading-lg" style={{ color: 'var(--primary-navy)', marginBottom: '1rem' }}>Security Settings</h1>
      
      {error && <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Two-Factor Authentication (2FA)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Protect your account with an extra layer of security. Once configured, you'll be required to enter both your password and an authentication code from your mobile phone in order to sign in.
        </p>

        {enrolled ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ecc71', fontWeight: 600, marginBottom: '2rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              2FA is Active and Required for your account.
            </div>
            {/* Disable button has been permanently removed! MFA is mandatory. */}
          </div>
        ) : (
          <div>
        {!qrCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={startEnrollment} disabled={loading} className="button-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1.2rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              {loading ? 'Initializing...' : 'Option 1: Authenticator App (Bar Code)'}
            </button>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>— OR —</div>
            <button 
              onClick={() => setError('SMS-based MFA is coming soon. Please use the Authenticator App (Option 1) for now.')} 
              className="button-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1.2rem' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Option 2: Use your Phone Number (SMS)
            </button>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <button 
                onClick={() => {
                  sessionStorage.setItem('mfa_bypassed', 'true');
                  window.location.href = '/dashboard';
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Skip for now (Development Bypass)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--primary-navy)', color: 'white', borderRadius: '50%', fontSize: '0.8rem' }}>1</span>
                Scan the Bar Code
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to link your account.</p>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', alignSelf: 'center', border: '1px solid rgba(0,0,0,0.05)', display: 'inline-block', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: qrCode }} />
            </div>
            
            <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--primary-navy)', color: 'white', borderRadius: '50%', fontSize: '0.8rem' }}>2</span>
                Verify the Connection
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter the 6-digit code currently displayed in your app to confirm.</p>
              <form onSubmit={verifyEnrollment} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  required 
                  value={verificationCode} 
                  onChange={e => setVerificationCode(e.target.value)} 
                  placeholder="000000"
                  maxLength={6}
                  style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center', background: 'white' }} 
                />
                <button type="submit" disabled={loading} className="button-primary" style={{ whiteSpace: 'nowrap', padding: '0 1.5rem' }}>
                  {loading ? '...' : 'Verify & Enable'}
                </button>
              </form>
            </div>
            <button type="button" onClick={() => setQrCode(null)} className="button-secondary" style={{ marginTop: '0.5rem' }}>Cancel Setup</button>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
}
