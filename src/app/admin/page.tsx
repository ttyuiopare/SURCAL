import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import AdminUserTable, { type AdminUserRow } from './AdminUserTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const search = (params?.q ?? '').trim();

  // Auth: must be signed in AND is_admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!caller?.is_admin) redirect('/');

  // Use the admin client so we can see banned/admin columns for everyone.
  const admin = createAdminClient();
  let query = admin
    .from('profiles')
    .select('id, name, email, role, is_admin, banned_at, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, error } = await query;

  const stats = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', true),
    admin.from('profiles').select('id', { count: 'exact', head: true }).not('banned_at', 'is', null),
    admin.from('waitlist').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsers = stats[0].count ?? 0;
  const adminCount = stats[1].count ?? 0;
  const bannedCount = stats[2].count ?? 0;
  // Waitlist may error if the migration hasn't been applied yet — treat as 0.
  const waitlistCount = stats[3].count ?? 0;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Admin</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>Moderate users, promote admins, kick or ban accounts.</p>
            <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <a href="/admin/moderation" style={{ color: 'var(--ai-purple, #8b5cf6)', fontWeight: 600, textDecoration: 'none' }}>
                Moderation queue &rarr;
              </a>
              <a href="/admin/support" style={{ color: 'var(--primary-magenta)', fontWeight: 600, textDecoration: 'none' }}>
                Support tickets &rarr;
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <Stat label="Total users" value={totalUsers} />
            <Stat label="Admins" value={adminCount} />
            <Stat label="Banned" value={bannedCount} color="var(--danger-red, #e74c3c)" />
            <Stat label="Waitlist" value={waitlistCount} color="var(--primary-magenta, #e5007d)" />
          </div>
        </div>

        <form action="/admin" method="get" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            name="q"
            placeholder="Search by name or email..."
            defaultValue={search}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: '0.95rem',
              background: '#fff',
            }}
          />
        </form>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red, #e74c3c)', borderRadius: '8px', marginBottom: '1rem' }}>
            Failed to load users: {error.message}
          </div>
        )}

        <AdminUserTable users={(users ?? []) as AdminUserRow[]} currentUserId={user.id} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color ?? 'var(--primary-navy)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}
