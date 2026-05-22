'use client';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RedirectDashboard() {
  useEffect(() => {
    async function doRedirect() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!user || userError) {
          window.location.href = '/login';
          return;
        }
        
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        
        if (data?.role === 'seller') {
          window.location.href = '/seller';
        } else {
          window.location.href = '/buyer';
        }
      } catch (err) {
        console.error("Dashboard redirect error:", err);
        window.location.href = '/buyer';
      }
    }
    doRedirect();
  }, []);
  
  return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading your dashboard...</div>;
}
