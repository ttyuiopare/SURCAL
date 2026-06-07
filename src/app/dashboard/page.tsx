'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

export default function RedirectDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    // Wait until we know the role before bouncing — otherwise a seller
    // briefly lands on /buyer while the profile loads.
    if (profile === null) return;
    router.replace(profile?.role === 'seller' ? '/seller' : '/buyer');
  }, [user, profile, router]);

  return (
    <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>
      Loading your dashboard...
    </div>
  );
}
