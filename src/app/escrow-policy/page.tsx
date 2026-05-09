import React from 'react';

export const metadata = {
  title: 'Escrow & Payment Policy | Surcal',
};

export default function EscrowPolicyPage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Escrow & Payment Policy</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <p>Surcal uses a strict Escrow system to ensure buyers get what they paid for, and sellers get paid for their hard work. In plain English, here is how our ecosystem processes payments:</p>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. How Escrow Works</h2>
          <p>When a buyer accepts a seller&apos;s bid, the buyer must pay the full amount upfront. This money does not go directly to the seller; instead, it is securely held in an Escrow account managed by our payment partner, Stripe. The seller is instantly notified that the funds are secured and they can confidently begin work.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. When Are Funds Released?</h2>
          <p>Funds are released to the seller&apos;s connected Stripe account when the buyer explicitly confirms delivery in their Surcal dashboard. If the buyer does not confirm delivery, funds will be auto-released exactly 3 days after the seller marks the request as "Delivered," unless the buyer opens a dispute.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. What Happens in a Dispute?</h2>
          <p>We pause the delivery timer and Escrow release process as soon as a dispute is opened. The funds will remain safely held in Escrow while a Surcal mediation team member works with both parties to reach a resolution.</p>
        </section>
      </div>
    </div>
  );
}
