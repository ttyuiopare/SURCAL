import React from 'react';

export const metadata = {
  title: 'Refund & Dispute Policy | Surcal',
};

export default function RefundPolicyPage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Refund & Dispute Policy</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <p>Surcal is an escrow-based marketplace, meaning funds are held securely until the transaction is successfully completed. Here is how refunds and disputes are handled.</p>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. Opening a Dispute</h2>
          <p>If a buyer claims that the delivery was not made, or the delivery significantly deviates from the accepted bid, the buyer may open a dispute via the dashboard before the auto-release period expires.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. Timeline & Resolution</h2>
          <p>Upon opening a dispute, the seller has 48 hours to respond. A Surcal mediator will review the correspondence and deliverables via the platform. Surcal aims to resolve all disputes within 7 business days.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Refunds</h2>
          <p>If the dispute resolves in favor of the buyer, the Escrow funds will be returned to the buyer&apos;s original payment method in full. The platform fee may still apply and is non-refundable in certain situations. Partial refunds may also be mutually agreed upon by the seller and buyer during the mediation process.</p>
        </section>
      </div>
    </div>
  );
}
