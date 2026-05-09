import React from 'react';

export const metadata = {
  title: 'Cookie Policy | Surcal',
};

export default function CookiePolicyPage() {
  return (
    <div style={{ padding: 'var(--container-padding)', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="bebas" style={{ fontSize: '3rem', color: 'var(--primary-navy)', marginBottom: '2rem' }}>Cookie Policy</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <p>Surcal uses cookies and similar tracking technologies to track the activity on our service and hold certain information.</p>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>1. What Are Cookies</h2>
          <p>Cookies are files with a small amount of data which may include an anonymous unique identifier. They are sent to your browser from a website and stored on your device.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>2. How We Use Cookies</h2>
          <p>We use essential cookies to keep you logged in to your account and functional cookies to remember your preferences (like dark/light mode). Surcal also uses analytics cookies (such as Google Analytics) to understand how visitors interact with our platform.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Managing Cookies</h2>
          <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept essential cookies, you will not be able to log in to your Surcal account.</p>
        </section>
      </div>
    </div>
  );
}
