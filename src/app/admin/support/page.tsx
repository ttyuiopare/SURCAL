import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import AdminSupportList, { type TicketRow } from './AdminSupportList';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const filter = params?.status === 'closed' ? 'closed' : 'open';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!caller?.is_admin) redirect('/');

  const admin = createAdminClient();

  const { data: tickets, error } = await admin
    .from('support_tickets')
    .select('id, user_id, name, email, subject, message, status, created_at')
    .eq('status', filter)
    .order('created_at', { ascending: false })
    .limit(200);

  const ticketIds = (tickets ?? []).map((t) => t.id);
  const replyMap = new Map<string, { id: string; body: string; created_at: string }[]>();
  if (ticketIds.length > 0) {
    const { data: replies } = await admin
      .from('support_ticket_replies')
      .select('id, ticket_id, body, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });
    (replies ?? []).forEach((r) => {
      const arr = replyMap.get(r.ticket_id) ?? [];
      arr.push({ id: r.id, body: r.body, created_at: r.created_at });
      replyMap.set(r.ticket_id, arr);
    });
  }

  const rows: TicketRow[] = (tickets ?? []).map((t) => ({
    ...t,
    replies: replyMap.get(t.id) ?? [],
  }));

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Support Tickets</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
              Reply from <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>support@surcal.xyz</code> via Resend. Replies are logged below the original.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <a href="/admin/compose" style={{ textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
              Compose email
            </a>
            <a href="/admin" style={{ textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
              &larr; Back to users
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <FilterTab href="/admin/support?status=open" label="Open" active={filter === 'open'} />
          <FilterTab href="/admin/support?status=closed" label="Closed" active={filter === 'closed'} />
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1rem' }}>
            Failed to load tickets: {error.message}
          </div>
        )}

        <AdminSupportList tickets={rows} />
      </div>
    </div>
  );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '999px',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: active ? 'var(--primary-navy)' : 'rgba(0,0,0,0.04)',
        color: active ? '#fff' : 'var(--text-primary)',
      }}
    >
      {label}
    </a>
  );
}
