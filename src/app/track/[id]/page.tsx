'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Package, Truck, ShieldCheck, ExternalLink, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  trackingUrl,
  carrierLabel,
  stageFromTransaction,
  STAGE_INDEX,
  type FulfillmentStage,
} from '@/utils/trackingLinks';

export default function TrackOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/track/${id}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function load() {
    setLoading(true);
    const { data: bidData, error: bidErr } = await supabase
      .from('bids')
      .select('id, price, status, request_id, seller_id, created_at, profiles!bids_seller_id_fkey(name)')
      .eq('id', id as string)
      .maybeSingle();

    if (bidErr || !bidData) {
      setError('Order not found or you do not have access to view it.');
      setLoading(false);
      return;
    }
    setBid(bidData);

    const { data: reqData } = await supabase
      .from('requests')
      .select('id, title, buyer_id, profiles!requests_buyer_id_fkey(name)')
      .eq('id', bidData.request_id)
      .maybeSingle();
    setRequest(reqData);

    const { data: txData } = await supabase
      .from('transactions')
      .select('id, status, tracking_number, shipping_carrier, created_at')
      .eq('bid_id', bidData.id)
      .maybeSingle();
    setTransaction(txData);

    setLoading(false);
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', padding: '120px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading order...</div>;
  }

  if (error || !bid || !request) {
    return (
      <div style={{ minHeight: '100vh', padding: '120px 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <Package size={40} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Order unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'This tracking link could not be loaded.'}</p>
          <Link href="/buyer/orders" className="button-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.2rem' }}>Back to orders</Link>
        </div>
      </div>
    );
  }

  const stage: FulfillmentStage = stageFromTransaction(transaction);
  const stageIdx = STAGE_INDEX[stage];
  const carrierUrl = trackingUrl(transaction?.shipping_carrier, transaction?.tracking_number);
  const isBuyer = user?.id === request.buyer_id;
  const counterparty = isBuyer ? (bid.profiles?.name || 'Seller') : (request.profiles?.name || 'Buyer');

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '4rem', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 var(--container-padding)' }}>
        <Link href={isBuyer ? '/buyer/orders' : '/seller/manage'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to {isBuyer ? 'orders' : 'manage'}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '2.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Order #{(bid.id as string).slice(0, 8)}</span>
              <h1 style={{ fontSize: '1.8rem', margin: '0.3rem 0 0.5rem 0', color: 'var(--primary-navy)' }}>{request.title}</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {isBuyer ? 'Sold by' : 'Purchased by'}{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{counterparty}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success-green)' }}>${bid.price}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
            </div>
          </div>

          {/* Progress tracker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: '2rem 0 1rem 0' }}>
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
              const dotBg = done ? (current ? 'var(--primary-navy)' : '#2ecc71') : 'var(--border-light)';
              const dotColor = done ? 'white' : 'var(--text-secondary)';
              const textColor = done ? (current ? 'var(--primary-navy)' : '#2ecc71') : 'var(--text-secondary)';
              return (
                <div key={label} className="order-tracker-stage" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0 0.5rem', opacity: done ? 1 : 0.6 }}>
                  <div className="order-tracker-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', background: dotBg, color: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} />
                  </div>
                  <span className="order-tracker-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: textColor, textAlign: 'center' }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Tracking number + carrier deeplink */}
          {transaction?.tracking_number ? (
            <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(46, 95, 163, 0.06)', borderRadius: '8px', border: '1px solid rgba(46, 95, 163, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={22} color="var(--primary-navy)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {carrierLabel(transaction.shipping_carrier)} Tracking Number
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {transaction.tracking_number}
                  </div>
                </div>
              </div>
              {carrierUrl && (
                <a href={carrierUrl} target="_blank" rel="noopener noreferrer" className="button-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Track on {carrierLabel(transaction.shipping_carrier)} <ExternalLink size={14} />
                </a>
              )}
            </div>
          ) : stage === 'escrow' ? (
            <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(230, 126, 34, 0.06)', borderRadius: '8px', border: '1px solid rgba(230, 126, 34, 0.25)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Awaiting shipment. The seller will add a tracking number here once your item ships.
            </div>
          ) : null}

          {/* Status footer */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={22} color="#2ecc71" />
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', color: '#2ecc71', fontSize: '0.95rem' }}>
                {stage === 'delivered' ? 'Order Complete' : 'Funds Secured in Escrow'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {stage === 'delivered'
                  ? 'Funds have been released to the seller.'
                  : 'Payment will only be released to the seller once the buyer confirms delivery.'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Link href={`/requests/${request.id}`} className="button-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none' }}>
              Open full request
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
