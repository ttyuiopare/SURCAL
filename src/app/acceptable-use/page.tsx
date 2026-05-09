import React from 'react';

export const metadata = {
  title: 'Acceptable Use Policy | Surcal',
};

export default function AcceptableUsePage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Acceptable Use Policy</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <p>This Acceptable Use Policy defines what buyers and sellers are permitted and prohibited from doing on Surcal. This protects our community and ensures lawful use of the platform.</p>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. Prohibited Requests and Bids</h2>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Illegal goods or services under applicable local, state, or federal law.</li>
            <li>Adult content, pornography, or explicitly sexual services.</li>
            <li>Weapons, explosives, firearms, or related materials.</li>
            <li>Malware, hacking services, or stolen data.</li>
            <li>Fraudulent or misleading services designed to deceive users.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. Conduct</h2>
          <p>Users must not engage in harassment, bullying, or hate speech towards other members. Do not attempt to bypass the platform's escrow and fee structure by requesting offline payments or off-platform communication. </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Enforcement</h2>
          <p>Surcal reserves the right to immediately suspend or permanently terminate the account of any user in violation of this policy, and forfeit associated escrow funds if unlawful behavior is proven.</p>
        </section>
      </div>
    </div>
  );
}
