'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function VerificationGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function checkVerification() {
      // Don't block login, settings (which houses the verification form), or terms
      if (pathname.startsWith('/login') || pathname.startsWith('/settings') || pathname.startsWith('/terms')) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Enforce MFA (AAL2)
      const isBypassed = sessionStorage.getItem('mfa_bypassed') === 'true';
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (!isBypassed && !mfaError && mfaData) {
        if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
           // User enrolled but hasn't entered code (should have been caught by login, but just in case)
           router.push('/login');
           return;
        }
        if (mfaData.nextLevel === 'aal1') {
           // User is completely unenrolled, force them to setup
           router.push('/settings/security');
           return;
        }
      }

      // 2. Enforce Seller Verification
      const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', user.id).single();
      
      if (profile?.role === 'seller' && !profile.is_verified) {
        router.push('/settings');
      }
    }
    
    checkVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
