import React from 'react';

export const metadata = {
  title: 'Terms of Service | Surcal',
};

export default function TermsPage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Terms of Service</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. Introduction</h2>
          <p>Welcome to Surcal. By accessing or using our platform, you agree to be bound by these Terms of Service. These Terms constitute a binding legal agreement between you and Surcal regarding your use of our reverse marketplace, escrow system, and services.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. Acceptable Use & Account Rules</h2>
          <p>Users must be 18 years or older to register an account. You agree not to use the platform for any illegal activities, fraud, or the sale of prohibited items. If your account violates our community guidelines, Surcal reserves the right to suspend or terminate your account without notice. For more details, review our <a href="/acceptable-use" style={{ color: 'var(--surcal-magenta)' }}>Acceptable Use Policy</a>.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Escrow and Payments</h2>
          <p>Surcal uses a secure Escrow system to protect both buyers and sellers. When a bid is accepted, the buyer&apos;s funds are held in Escrow via our payment partner (Stripe). Funds are only released to the seller once the buyer confirms delivery or a set auto-release period expires. Please read our specific <a href="/escrow-policy" style={{ color: 'var(--surcal-magenta)' }}>Escrow & Payment Policy</a> for full details.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>4. Buyer & Seller Responsibilities</h2>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Buyers:</strong> Responsible for paying into escrow promptly upon accepting a bid, accurately describing requests, and confirming delivery within 3 days of receipt.</li>
            <li><strong>Sellers:</strong> Responsible for fulfilling the accepted request exactly as described, maintaining a connected Stripe account for payouts, and communicating any delays in advance.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>5. Disputes & Refunds</h2>
          <p>If an issue arises regarding delivery or quality, buyers may open a dispute before the funds are released from Escrow. Surcal mediation will investigate the claims based on platform communication and evidence. For full procedures, review our <a href="/refund-policy" style={{ color: 'var(--surcal-magenta)' }}>Refund & Dispute Policy</a>.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>6. Platform Fees</h2>
          <p>Surcal charges a platform fee (typically 5%) deducted from total payouts for the facilitation of the marketplace and escrow. This fee is non-refundable in the event a transaction is completed and later disputed. Sellers must read and accept Stripe&apos;s Connected Account agreement.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>7. Account Termination</h2>
          <p>We may suspend or terminate your access to our Services at any time, for any reason, particularly if you violate these Terms or pose a risk to the community.</p>
        </section>
      </div>
    </div>
  );
}
