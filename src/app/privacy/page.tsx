import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Surcal',
};

export default function PrivacyPage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Privacy Policy</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <p>Your privacy is important to Surcal. This policy explains what data we collect, how we use it, and how you can manage your personal information in compliance with GDPR, CCPA, and COPPA.</p>
        
        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. Data We Collect</h2>
          <p>We collect information you provide directly to us (such as name, email) and data collected automatically (such as IP address, browser type). When making payments or receiving payouts, our payment processor, Stripe, securely collects and processes your financial information. Surcal does not store full credit card numbers on our servers.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. How We Use Your Data</h2>
          <p>We use your data to operate the marketplace, process transactions securely via Stripe, prevent fraud, communicate with you, and improve our services.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Data Deletion & Your Rights</h2>
          <p>Depending on your jurisdiction, you have the right to access, correct, or delete your personal data. You can request the deletion of your account and personal data at any time by contacting us.</p>
        </section>
      </div>
    </div>
  );
}
