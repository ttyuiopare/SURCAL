import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 40px', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="glass-card">
        <h1 className="heading-lg" style={{ marginBottom: '2rem' }}>Surcal Terms and Conditions</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.6 }}>
          <p><strong>Last Updated:</strong> March 20, 2026</p>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
            <p>Welcome to Surcal. By accessing our platform, you agree to be bound by these Terms and Conditions. Please read them carefully. If you do not agree with any part of these terms, you must not use our service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>2. Description of Service</h2>
            <p>Surcal is a reverse marketplace where buyers post requests for products, and verified sellers submit competing offers. We provide the platform, smart assistant tools, and secure payment escrow, but we do not directly sell or manufacture the physical goods.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>3. User Roles and Account Responsibilities</h2>
            <p><strong>Buyers</strong> may post requests and review offers. <strong>Sellers</strong> may submit competing offers on active requests. You must accurately represent your identity and maintain the confidentiality of your account credentials.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>4. Seller Verification and Conduct</h2>
            <p>To maintain marketplace integrity, Sellers must undergo a verification process. Sellers agree to provide accurate descriptions of item conditions, shipping timelines, and honor the prices they offer. Surcal reserves the right to suspend accounts that violate our safety guidelines or repeatedly fail to deliver.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>5. Surcal Smart Assistant Usage</h2>
            <p>The Surcal Smart Assistant tools are provided "as is" to help draft product descriptions and score seller offers. While we strive for accuracy, users must verify all details and not rely solely on the Smart Assistant's suggestions or scoring for final purchasing decisions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>6. Payments, Fees, and Escrow</h2>
            <p>All transactions must be completed on-platform. Payments are securely processed and held in Escrow via Stripe until the Buyer confirms delivery. Funds will only be released upon satisfactory completion of the transaction. Surcal charges a standard 5% platform fee on completed transactions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>7. Subscriptions</h2>
            <p>Sellers may subscribe to paid tiers for increased monthly bid limits and advanced features. Subscription fees are billed on a recurring basis and are non-refundable unless required by applicable law.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>8. Limitation of Liability and Scams</h2>
            <p><strong>Anti-Scam Disclaimer:</strong> Surcal is not actively monitoring every transaction for fraud and is not legally responsible or liable for any monetary or physical losses incurred by scammers, fraudulent sellers, or dishonest buyers on this platform. While we are committed to doing our best to remove malicious actors and suspend accounts that violate our trust policies, your use of the platform is strictly at your own risk. You agree that you cannot and will not sue Surcal for damages related to user-to-user scams.</p>
            <p style={{ marginTop: '0.5rem' }}>Furthermore, Surcal shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service, including disputes over the condition or delivery of items sourced through the platform.</p>
          </section>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
            <Link href="/login">
              <button className="button-primary">Accept & Return to Sign Up</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
