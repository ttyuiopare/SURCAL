import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { SITE_URL } from '@/lib/seo';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  used: 'Used',
  for_parts: 'For parts',
};

function formatPrice(price: number | null): string {
  if (price == null) return 'Ask for price';
  return `$${Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, business_description')
    .eq('id', id)
    .eq('account_type', 'business')
    .maybeSingle();

  const name = profile?.business_name || 'Store';
  return {
    title: `${name} — Surcal Store`,
    description:
      profile?.business_description ||
      `Browse inventory from ${name} on Surcal, the reverse marketplace where sellers compete for your order.`,
    alternates: { canonical: `${SITE_URL}/store/${id}` },
    openGraph: { url: `${SITE_URL}/store/${id}` },
  };
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, name, account_type, business_name, business_description, business_category, business_link, created_at'
    )
    .eq('id', id)
    .maybeSingle();

  // Only business accounts have a public store page.
  if (!profile || profile.account_type !== 'business') notFound();

  const { data: inventory } = await supabase
    .from('seller_inventory')
    .select('id, title, description, asking_price, condition, image_url, updated_at')
    .eq('seller_id', id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(48);

  const businessName = profile.business_name || `${profile.name ?? 'Seller'}'s Store`;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', padding: '100px 1.5rem 4rem', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Store header */}
        <div
          className="glass-card"
          style={{ padding: '2.5rem', display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              flexShrink: 0,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary-magenta), var(--ai-purple))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
            }}
          >
            {businessName.trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-magenta)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 700,
                margin: '0 0 0.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Store size={13} /> Surcal Store{profile.business_category ? ` · ${profile.business_category}` : ''}
            </p>
            <h1 className="heading-lg" style={{ marginBottom: '0.35rem' }}>
              {businessName}
            </h1>
            {profile.business_description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>
                {profile.business_description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.9rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {memberSince && <span>On Surcal since {memberSince}</span>}
              {profile.business_link && (
                <a
                  href={profile.business_link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: 'var(--primary-magenta)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Visit website <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <h2 className="heading-md" style={{ color: 'var(--primary-navy)', margin: '2.5rem 0 1.25rem' }}>
          Available now {inventory && inventory.length > 0 ? `(${inventory.length})` : ''}
        </h2>

        {!inventory || inventory.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            <p style={{ margin: 0 }}>
              This store hasn&apos;t listed anything yet. Check back soon — or post a request and
              let them come to you.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '1.1rem',
            }}
          >
            {inventory.map((item) => (
              <div
                key={item.id}
                className="glass-card"
                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  style={{
                    aspectRatio: '4 / 3',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--border-light)',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    overflow: 'hidden',
                  }}
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    item.title.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ padding: '1rem 1.1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.35 }}>
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.condition ? CONDITION_LABELS[item.condition] ?? item.condition : ' '}
                  </p>
                  <p
                    style={{
                      margin: 'auto 0 0',
                      paddingTop: '0.4rem',
                      fontWeight: 800,
                      color: 'var(--primary-navy)',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {formatPrice(item.asking_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buyer CTA */}
        <div
          className="glass-card"
          style={{
            marginTop: '2.5rem',
            padding: '2rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.3rem', color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
              Can&apos;t find what you want?
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Post exactly what you&apos;re looking for and let sellers compete with their best offer.
            </p>
          </div>
          <Link href="/requests" className="button-primary" style={{ padding: '0.9rem 1.5rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Post a request
          </Link>
        </div>
      </div>
    </div>
  );
}
