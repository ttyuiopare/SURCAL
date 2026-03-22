'use client';
import React from 'react';

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="heading-xl" style={{ marginBottom: '1.5rem' }}>Contact Us</h1>
        <p className="text-lead" style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          Have questions? We'd love to hear from you.
        </p>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
            <input type="text" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="Your name" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <input type="email" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="your@email.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
            <textarea rows={5} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit' }} placeholder="How can we help?"></textarea>
          </div>
          <button type="button" onClick={() => alert('Message Sent')} className="button-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
