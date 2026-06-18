'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, ChevronDown, CheckCircle } from 'lucide-react';

const faqs = [
  {
    question: "How does the Smart Assistant scoring work?",
    answer: "Surcal Smart Assistant analyzes the original buyer request against the seller's bid. It evaluates relevance, pricing realisticness, and seller communication. It filters out spam and gives each valid bid a score from 1-10 so buyers can quickly spot the highest quality offers."
  },
  {
    question: "What are the platform fees?",
    answer: "Posting requests is 100% free for buyers. For sellers, Surcal takes a flat 5% platform fee on all successfully completed and paid transactions. We do not charge per-bid, monthly subscription fees, or hidden payment surcharges."
  },
  {
    question: "Can I use Surcal for physical products?",
    answer: "Yes! While many users source digital services, bulk orders, custom hardware, or localized services are very common. Buyers can attach photos directly to their request to show exactly what physical product they need sourced or manufactured."
  },
  {
    question: "How does Escrow and Stripe work?",
    answer: "When a buyer accepts a seller's bid, their payment is immediately captured but held securely in Escrow via our Stripe Connect platform. It is only released to the seller once the buyer has marked the request as fully delivered and completed."
  },
  {
    question: "How do disputes work?",
    answer: "If an item arrives significantly not-as-described, click the 'Dispute' button on the order page. The funds will be locked in Escrow while a Surcal administrator reviews the case, communication history, and any photos provided to reach a fair resolution."
  }
];

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [ticket, setTicket] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket.');

      setSuccess(true);
      setTicket({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your ticket.');
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-color)', paddingTop: '100px', paddingBottom: '6rem' }}>
      
      <div style={{ width: '100%', maxWidth: '1200px', padding: 'var(--container-padding)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Help & Support Center</h1>
          <p className="text-lead" style={{ margin: '0 auto', maxWidth: '700px' }}>Whether you have a quick question or need assistance with an active order, our dedicated team is here to help.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '4rem', alignItems: 'start' }}>
          
          {/* FAQ Section */}
          <section>
            <h2 className="heading-md" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)' }}>
              <MessageSquare size={24} color="var(--primary-magenta)" /> Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="glass-card" 
                  style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease', border: activeFaq === index ? '1px solid var(--primary-magenta)' : undefined }}
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>{faq.question}</h3>
                    <motion.div animate={{ rotate: activeFaq === index ? 180 : 0 }}>
                      <ChevronDown size={20} color="var(--text-secondary)" />
                    </motion.div>
                  </div>
                  {activeFaq === index && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {faq.answer}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="glass-card" style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(83, 58, 183, 0.05) 0%, rgba(226, 37, 120, 0.05) 100%)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>Still need help?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Use the form on the right, or email us directly. We reply by email within 24 hours.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a href="mailto:support@surcal.xyz" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary-navy)', textDecoration: 'none', fontWeight: 500 }}>
                  <Mail size={18} color="var(--primary-magenta)" /> support@surcal.xyz
                </a>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@surcal.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'underline', marginLeft: '1.8rem' }}
                >
                  Open in Gmail instead
                </a>
              </div>
            </div>
          </section>

          {/* Support Ticket Section */}
          <section>
            <h2 className="heading-md" style={{ marginBottom: '2rem', color: 'var(--primary-navy)' }}>
              Open a Support Ticket
            </h2>
            
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              {success ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <CheckCircle size={60} color="var(--success-green)" style={{ margin: '0 auto 1.5rem' }} />
                  <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Message Sent Successfully!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We've received your support ticket and our team will get back to you via email within 24 hours.</p>
                  <button onClick={() => setSuccess(false)} className="button-secondary">Submit Another Question</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {error && <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px' }}>{error}</div>}
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-navy)' }}>Name</label>
                      <input 
                        type="text" 
                        required 
                        value={ticket.name}
                        onChange={e => setTicket({...ticket, name: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-navy)' }}>Email</label>
                      <input 
                        type="email" 
                        required 
                        value={ticket.email}
                        onChange={e => setTicket({...ticket, email: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-navy)' }}>Subject / Order ID</label>
                    <input 
                      type="text" 
                      required 
                      value={ticket.subject}
                      onChange={e => setTicket({...ticket, subject: e.target.value})}
                      placeholder="e.g. Issue with Order #1234 or General Question"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-navy)' }}>How can we help?</label>
                    <textarea 
                      required 
                      value={ticket.message}
                      onChange={e => setTicket({...ticket, message: e.target.value})}
                      rows={6}
                      placeholder="Please provide as much detail as possible..."
                      style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', resize: 'vertical' }} 
                    />
                  </div>

                  <button type="submit" disabled={loading} className="button-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}>
                    {loading ? 'Sending Message...' : 'Send Secure Message'}
                  </button>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>Average response time: 2-4 hours</p>
                </form>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
