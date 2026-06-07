import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import ModerationQueue, { type FlagRow } from './ModerationQueue';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
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

  const admin = createAdminClient();
  const { data: flags } = await admin
    .from('moderation_flags')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200);

  // Join the flagged users' names/emails for display.
  const userIds = Array.from(new Set((flags ?? []).map((f) => f.flagged_user_id).filter(Boolean)));
  const userMap = new Map<string, { name: string | null; email: string | null; banned_at: string | null }>();
  if (userIds.length > 0) {
    const { data: users } = await admin
      .from('profiles')
      .select('id, name, email, banned_at')
      .in('id', userIds);
    (users ?? []).forEach((u) => userMap.set(u.id, { name: u.name, email: u.email, banned_at: u.banned_at }));
  }

  const rows: FlagRow[] = (flags ?? []).map((f) => ({
    ...f,
    user_name: f.flagged_user_id ? userMap.get(f.flagged_user_id)?.name ?? null : null,
    user_email: f.flagged_user_id ? userMap.get(f.flagged_user_id)?.email ?? null : null,
    user_banned: f.flagged_user_id ? !!userMap.get(f.flagged_user_id)?.banned_at : false,
  }));

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Moderation Queue</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
              AI-flagged content awaiting review. {rows.length} pending.
            </p>
          </div>
          <a href="/admin" style={{ textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
            &larr; Back to users
          </a>
        </div>

        <ModerationQueue flags={rows} />
      </div>
    </div>
  );
}
