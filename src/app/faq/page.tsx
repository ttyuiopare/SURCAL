import React from 'react';

export const metadata = {
  title: 'FAQ | Surcal',
  description: 'Frequently Asked Questions about Surcal.',
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Surcal?",
      answer: "Surcal is a reverse marketplace for physical products. Instead of searching through listings, you post what you want to buy — sneakers, electronics, collectibles, watches, automotive parts, home goods — and verified sellers compete to send you offers."
    },
    {
      question: "How do I make a request?",
      answer: "Once logged in, click 'Post Request' in the top nav. Describe what you want, attach a reference photo, set a target price and deadline, and our Smart Assistant will start matching you with sellers who have similar items."
    },
    {
      question: "Are there fees for buyers?",
      answer: "No. Posting a request is 100% free, and you only pay when you accept a seller's offer — at the price you agreed on. There are no buyer-side service fees, hidden surcharges, or membership tiers."
    },
    {
      question: "How do I become a seller?",
      answer: "Sign up and choose 'Seller' as your role. To start sending offers, you'll need to complete identity and bank verification through Stripe Connect (our payments partner). This usually takes a few minutes and keeps the marketplace safe for buyers."
    },
    {
      question: "How does payment work, step by step?",
      answer: "1) You accept a seller's offer. 2) You pay through Stripe checkout (credit, debit, or Apple/Google Pay). 3) The money goes into escrow — held safely, not sent to the seller yet. 4) The seller ships the item and adds a tracking number. 5) When it arrives, you click 'Confirm Delivery & Release Funds'. 6) Stripe releases the money to the seller, minus the 5% platform fee."
    },
    {
      question: "Why is my payment held in escrow?",
      answer: "So you don't have to trust a stranger with your money. Until you confirm the item arrived and matches the description, the seller doesn't see a cent. If something goes wrong, the funds are still under your control. Stripe Connect powers this — the same escrow technology used by major marketplaces."
    },
    {
      question: "When does the seller actually get paid?",
      answer: "The seller's Stripe balance updates the moment you confirm delivery. Stripe then pays out to their connected bank account on a rolling schedule — usually within 2-7 business days for U.S. accounts, depending on Stripe's payout schedule. Sellers can check their balance anytime from their Stripe Express dashboard."
    },
    {
      question: "What if the item never arrives or isn't what was promised?",
      answer: "Don't confirm delivery. As long as escrow isn't released, the seller hasn't been paid. You can dispute the order from your Orders page, and our support team will investigate. If the dispute is upheld, we'll refund you in full through Stripe — no chargebacks needed."
    },
    {
      question: "What payment methods can I use?",
      answer: "All major credit and debit cards (Visa, Mastercard, American Express, Discover), plus Apple Pay and Google Pay where supported. Everything is processed by Stripe — Surcal never sees or stores your card number."
    },
    {
      question: "What's the platform fee?",
      answer: "A flat 5% deducted from the seller's payout when escrow is released. Buyers pay exactly the price they agreed to with the seller — the fee comes out of the seller's side. No subscriptions, no per-bid fees, no payment processing surcharges."
    },
    {
      question: "Is my payment information safe?",
      answer: "Yes. Surcal uses Stripe for all payment processing — the same company trusted by Amazon, Shopify, Lyft, and millions of other businesses. Your card details go directly to Stripe and are never stored on Surcal's servers. We're PCI-DSS compliant by design."
    },
    {
      question: "Will my address be shared with all sellers?",
      answer: "No. Your shipping address is only shared with the one seller whose offer you accept and pay for. Losing bidders never see your address, name, or contact info."
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
