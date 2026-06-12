'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, CreditCard, ShieldCheck, ExternalLink, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BuyerSidebar from '../BuyerSidebar';
import { useAuth } from '../../providers/AuthProvider';
import {
  trackingUrl,
  carrierLabel,
  stageFromTransaction,
  STAGE_INDEX,
  type FulfillmentStage,
} from '../../../utils/trackingLinks';

export default function OrdersPage() {
  const { user, supabase } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadOrders() {
    if (!user) return;

    const { data: requests } = await supabase
      .from('requests')
      .select('id, title')
      .eq('buyer_id', user.id);

    if (requests && requests.length > 0) {
      const requestIds = requests.map(r => r.id);

      const { data: bids } = await supabase
        .from('bids')
        .select(`
          *,
          seller:seller_id(name)
        `)
        .eq('status', 'accepted')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

      const { data: txs } = await supabase
        .from('transactions')
        .select('id, bid_id, status, tracking_number, shipping_carrier')
        .in('request_id', requestIds);

      if (bids) {
        const enrichedOrders = bids.map(bid => {
          const req = requests.find(r => r.id === bid.request_id);
          const tx = txs?.find(t => t.bid_id === bid.id) ?? null;
          return { ...bid, request: req, transaction: tx };
        });
        setOrders(enrichedOrders);
      }
    }
    setLoading(false);
  }

  function copyShareLink(orderId: string) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/track/${orderId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      <BuyerSidebar active="orders" />

      <main style={{ flex: 1, padding: '3rem var(--container-padding)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">Orders & Escrow</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Track your active purchases and escrow payments.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
            <ShieldCheck size={18} /> Stripe Escrow Active
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Package size={48} color="var(--primary-navy)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No active orders</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You haven&apos;t accepted any offers yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {orders.map((order, i) => {
              const tx = order.transaction;
              const stage: FulfillmentStage = stageFromTransaction(tx);
              const stageIdx = STAGE_INDEX[stage];
              const carrierUrl = trackingUrl(tx?.shipping_carrier, tx?.tracking_number);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card"
                  style={{ padding: '2rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.3rem' }}>
                        {order.request?.title}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sold by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.seller?.name || 'Seller'}</span>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-green)' }}>${order.price}</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Paid</span>
                    </div>
                  </div>

                  {/* Progress Tracker (driven by real transaction status) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '2rem' }}>
                    <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', background: 'var(--border-light)', zIndex: 0 }}></div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '24px',
                        left: '0',
                        width: `${(stageIdx / 3) * 100}%`,
                        height: '2px',
                        background: '#2ecc71',
                        zIndex: 0,
                        transition: 'width 0.4s ease',
                      }}
                    />

                    {[
                      { label: 'Offer Accepted', Icon: CheckCircle, idx: 0 },
                      { label: 'Payment in Escrow', Icon: CreditCard, idx: 1 },
                      { label: 'Shipped', Icon: Package, idx: 2 },
                      { label: 'Delivered', Icon: Truck, idx: 3 },
                    ].map(({ label, Icon, idx }) => {
                      const done = stageIdx >= idx;
                      const current = stageIdx === idx;
                      const dotBg = done
                        ? current
                          ? 'var(--primary-navy)'
                          : '#2ecc71'
                        : 'var(--border-light)';
                      const dotColor = done ? 'white' : 'var(--text-secondary)';
                      const textColor = done
                        ? current
                          ? 'var(--primary-navy)'
                          : '#2ecc71'
                        : 'var(--text-secondary)';
                      return (
                        <div
                          key={label}
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--bg-surface)',
                            padding: '0 0.5rem',
                            opacity: done ? 1 : 0.6,
                          }}
                        >
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: dotBg, color: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={24} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: textColor }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracking number + carrier deeplink */}
                  {tx?.tracking_number && (
                    <div style={{ marginTop: '2.5rem', padding: '1rem 1.25rem', background: 'rgba(46, 95, 163, 0.06)', borderRadius: '8px', border: '1px solid rgba(46, 95, 163, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Truck size={20} color="var(--primary-navy)" />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {carrierLabel(tx.shipping_carrier)} Tracking
                          </div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {tx.tracking_number}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {carrierUrl && (
                          <a href={carrierUrl} target="_blank" rel="noopener noreferrer" className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            Track on {carrierLabel(tx.shipping_carrier)} <ExternalLink size={14} />
                          </a>
                        )}
                        <Link href={`/track/${order.id}`} className="button-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                          Order page
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Escrow status footer + share link */}
                  <div style={{ marginTop: tx?.tracking_number ? '1rem' : '2.5rem', padding: '1rem', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <ShieldCheck size={24} color="#2ecc71" />
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 0.2rem 0', color: '#2ecc71', fontSize: '0.95rem' }}>
                        {stage === 'delivered' ? 'Order Complete' : 'Funds Secured'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {stage === 'delivered'
                          ? 'Funds have been released to the seller.'
                          : 'Your payment is held safely in Escrow. It will only be released to the seller once you confirm delivery.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyShareLink(order.id)}
                      className="button-secondary"
                      style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Link2 size={14} /> {copiedId === order.id ? 'Copied!' : 'Share tracking'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
