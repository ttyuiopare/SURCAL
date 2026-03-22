import React from 'react';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="heading-xl" style={{ marginBottom: '2rem' }}>About Surcal</h1>
        <p className="text-lead" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Surcal is a premium reverse marketplace. We flip the traditional sourcing model on its head by allowing buyers to post their specific needs, while sellers compete to offer the best simply and transparently.
        </p>
        <p className="text-lead" style={{ color: 'var(--text-secondary)' }}>
          Powered by Claude AI, we ensure every bid is quality-scored so you only see the most relevant and competitive offers.
        </p>
      </div>
    </div>
  );
}
