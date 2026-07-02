import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import AdminContentManager, { type RequestRow, type BidRow } from './AdminContentManager';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
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

  const [{ data: requests }, { data: bids }] = await Promise.all([
    admin
      .from('requests')
      .select('id, title, budget, status, created_at, buyer_id')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('bids')
      .select('id, price, status, created_at, seller_id, request_id')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Resolve display names and request titles in bulk.
  const userIds = new Set<string>();
  (requests ?? []).forEach((r) => r.buyer_id && userIds.add(r.buyer_id));
  (bids ?? []).forEach((b) => b.seller_id && userIds.add(b.seller_id));

  const bidReqIds = new Set<string>();
  (bids ?? []).forEach((b) => b.request_id && bidReqIds.add(b.request_id));

  const [{ data: profiles }, { data: reqTitles }] = await Promise.all([
    userIds.size
      ? admin.from('profiles').select('id, name').in('id', Array.from(userIds))
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    bidReqIds.size
      ? admin.from('requests').select('id, title').in('id', Array.from(bidReqIds))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const titleMap = new Map((reqTitles ?? []).map((r) => [r.id, r.title]));

  const requestRows: RequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    budget: r.budget,
    status: r.status,
    createdAt: r.created_at,
    buyerName: nameMap.get(r.buyer_id) || 'Unknown',
  }));

  const bidRows: BidRow[] = (bids ?? []).map((b) => ({
    id: b.id,
    price: b.price,
    status: b.status,
    createdAt: b.created_at,
    sellerName: nameMap.get(b.seller_id) || 'Unknown',
    requestTitle: titleMap.get(b.request_id) || '—',
    requestId: b.request_id,
  }));

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Requests &amp; Bids</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
              Remove any request or offer from the marketplace. Deleting a request also removes its offers.
            </p>
          </div>
          <a href="/admin" style={{ textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
            &larr; Back to users
          </a>
        </div>

        <AdminContentManager requests={requestRows} bids={bidRows} />
      </div>
    </div>
  );
}
