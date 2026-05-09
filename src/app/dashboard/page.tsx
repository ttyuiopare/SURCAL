'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RedirectDashboard() {
  const router = useRouter();
  useEffect(() => {
    async function doRedirect() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      router.replace(data?.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
    }
    doRedirect();
  }, [router]);
  return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading your dashboard...</div>;
}
