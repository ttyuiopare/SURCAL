import React from 'react';

export const metadata = {
  title: 'FAQ | Surcal',
  description: 'Frequently Asked Questions about Surcal.',
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Surcal?",
      answer: "Surcal is a premium reverse marketplace where buyers can post their specific needs, and sellers compete to offer the best solution. Instead of searching through products, products find you."
    },
    {
      question: "How do I make a request?",
      answer: "Once logged in, simply click on 'Post a Request'. Fill out the form with your requirements, budget, and timeframe, and our AI-powered system will begin matching you with top-rated sellers."
    },
    {
      question: "Are there fees for buyers?",
      answer: "No, posting a request is completely free. We just ask that you have a genuine intent to buy the product or service you're requesting."
    },
    {
      question: "How do I become a seller?",
      answer: "Click on 'Become a Seller' from your dashboard or upgrade your account. Sellers must verify their identity to maintain our premium marketplace standards before they can send offers."
    },
    {
      question: "How is payment handled?",
      answer: "We use a secure escrow system. The buyer's payment is held securely until the order is fulfilled and accepted, ensuring both parties are protected throughout the transaction."
    }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem' }}>Frequently Asked Questions</h1>
          <p className="text-lead" style={{ color: 'var(--text-secondary)' }}>
            Find answers to common questions about buying and selling on Surcal.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {faqs.map((faq, index) => (
            <div key={index} style={{ 
              backgroundColor: '#fff', 
              padding: '2rem', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: 'var(--primary-navy)' 
              }}>
                {faq.question}
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Still have questions?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We're always here to help. Reach out to our support team.</p>
          <a href="/support" style={{
            display: 'inline-block',
            backgroundColor: 'var(--primary-navy)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500'
          }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
