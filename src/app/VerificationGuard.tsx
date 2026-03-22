'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function VerificationGuard() {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkVerification() {
      // Don't block login, settings (which houses the verification form), or terms
      if (pathname.startsWith('/login') || pathname.startsWith('/settings') || pathname.startsWith('/terms')) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', user.id).single();
      
      if (profile?.role === 'seller' && !profile.is_verified) {
        router.push('/settings');
      }
    }
    
    checkVerification();
  }, [pathname, router, supabase]);

  return null;
}
