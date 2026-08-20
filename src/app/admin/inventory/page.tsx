import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import AdminInventoryBrowser, {
  type InventoryRow,
  type MatchRow,
} from './AdminInventoryBrowser';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  // Auth: signed in AND is_admin — same gate as the other admin pages.
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

  const [{ data: inventory }, { data: categories }, { data: matches }] = await Promise.all([
    admin
      .from('seller_inventory')
      .select('id, seller_id, title, description, category_id, condition, asking_price, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    admin.from('categories').select('id, name'),
    // The match log may not exist yet if migration 21 hasn't been applied —
    // the page still works, the Matches tab just comes up empty.
    admin
      .from('inventory_match_log')
      .select('id, request_id, seller_id, inventory_id, score, outcome, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const invRows = inventory ?? [];
  const matchRows = matches ?? [];

  // Resolve seller names/emails and request titles in bulk.
  const userIds = new Set<string>();
  invRows.forEach((i) => i.seller_id && userIds.add(i.seller_id));
  matchRows.forEach((m) => m.seller_id && userIds.add(m.seller_id));

  const requestIds = new Set<string>();
  matchRows.forEach((m) => m.request_id && requestIds.add(m.request_id));

  const inventoryIds = new Set<string>();
  matchRows.forEach((m) => m.inventory_id && inventoryIds.add(m.inventory_id));

  const [{ data: profiles }, { data: requests }, { data: matchedItems }] = await Promise.all([
    userIds.size
      ? admin.from('profiles').select('id, name, email').in('id', Array.from(userIds))
      : Promise.resolve({ data: [] as { id: string; name: string | null; email: string | null }[] }),
    requestIds.size
      ? admin.from('requests').select('id, title, budget').in('id', Array.from(requestIds))
      : Promise.resolve({ data: [] as { id: string; title: string; budget: number | null }[] }),
    inventoryIds.size
      ? admin.from('seller_inventory').select('id, title').in('id', Array.from(inventoryIds))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const requestMap = new Map((requests ?? []).map((r) => [r.id, r]));
  const itemMap = new Map((matchedItems ?? []).map((i) => [i.id, i.title]));

  const items: InventoryRow[] = invRows.map((i) => {
    const p = profileMap.get(i.seller_id);
    return {
      id: i.id,
      title: i.title,
      description: i.description,
      condition: i.condition,
      askingPrice: i.asking_price,
      isActive: i.is_active,
      createdAt: i.created_at,
      category: i.category_id ? categoryMap.get(i.category_id) ?? null : null,
      sellerId: i.seller_id,
      sellerName: p?.name || 'Unknown seller',
      sellerEmail: p?.email || null,
    };
  });

  const matchList: MatchRow[] = matchRows.map((m) => {
    const p = m.seller_id ? profileMap.get(m.seller_id) : null;
    const r = requestMap.get(m.request_id);
    return {
      id: m.id,
      requestId: m.request_id,
      requestTitle: r?.title || '(deleted request)',
      requestBudget: r?.budget ?? null,
      outcome: m.outcome,
      score: m.score,
      createdAt: m.created_at,
      sellerName: p?.name || null,
      sellerEmail: p?.email || null,
      itemTitle: m.inventory_id ? itemMap.get(m.inventory_id) ?? null : null,
    };
  });

  const sellersWithStock = new Set(items.filter((i) => i.isActive).map((i) => i.sellerId)).size;
  const activeCount = items.filter((i) => i.isActive).length;
  const noMatchCount = matchList.filter((m) => m.outcome === 'no_match').length;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Seller Inventory</h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', maxWidth: '60ch' }}>
              Everything sellers say they have on hand. Search it to find who can fill a
              buyer&apos;s request, then reach out directly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <Stat label="Active items" value={activeCount} />
            <Stat label="Sellers stocked" value={sellersWithStock} />
            <Stat label="Unmatched" value={noMatchCount} color="var(--danger-red, #e74c3c)" />
          </div>
        </div>

        <a href="/admin" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none', color: 'var(--primary-navy)', fontWeight: 600 }}>
          &larr; Back to admin
        </a>

        <AdminInventoryBrowser items={items} matches={matchList} />
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
