import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SUPPORT_FROM } from '@/utils/email';
import ComposeEmail from './ComposeEmail';

export const dynamic = 'force-dynamic';

export default async function AdminComposePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!caller?.is_admin) redirect('/');

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Compose Email</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
              Send a one-off email from Surcal Support via Resend.
            </p>
          </div>
          <a href="/admin/support" style={{ textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
            &larr; Support tickets
          </a>
        </div>

        <ComposeEmail fromLabel={SUPPORT_FROM} />
      </div>
    </div>
  );
}
