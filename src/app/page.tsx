'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, DollarSign, Shield, CheckCircle, TrendingUp, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';

export default function Home() {
  const { profile } = useAuth();
  void profile;
  const ctaHref = '/post-request';
  const ctaPrimary = 'Request a Product';
  const ctaFinal = 'Get Started for Free';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-color)', paddingTop: '120px' }}>
        
        {/* Clean, Bright Hero Section */}
        <section style={{ width: '100%', maxWidth: '1200px', padding: 'var(--container-padding)', textAlign: 'center', marginBottom: '6rem' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <div className="badge-ai" style={{ marginBottom: '2rem' }}>
              <Sparkles size={16} />
              Smart Assistant-Powered Reverse Marketplace
            </div>
            
            <h1 className="heading-xl" style={{ marginBottom: '1.5rem', lineHeight: 1.15 }}>
              Post what you want.<br/> Sellers compete.
            </h1>
            
            <p className="text-lead" style={{ margin: '0 auto 2.5rem', color: 'var(--text-secondary)', fontSize: '1.3rem' }}>
              Looking for a new iPhone? A vintage jacket? Post the exact item you want to buy. Verified sellers will send you competitive offers.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link href={ctaHref} style={{ textDecoration: 'none' }}>
                <button className="button-primary" style={{ gap: '0.5rem', fontSize: '1.1rem', padding: '1rem 2.5rem', boxShadow: '0 4px 14px 0 rgba(30, 58, 95, 0.39)', cursor: 'pointer' }}>
                  {ctaPrimary} <ArrowRight size={18} />
                </button>
              </Link>
            </div>

            <div style={{ width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)' }}>
              <img 
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2670&auto=format&fit=crop" 
                alt="High End Headphones Product" 
                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} 
              />
            </div>
          </motion.div>
        </section>

        {/* Value Proposition Cards */}
        <section style={{ width: '100%', maxWidth: '1200px', padding: 'var(--container-padding)', marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>Buying has evolved</h2>
            <p className="text-lead" style={{ margin: '0 auto' }}>Don&apos;t search for hours. Let the sellers come to you.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            
            {/* Buyer Focus */}
            <motion.div 
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ borderTop: '4px solid var(--primary-navy)' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(30, 58, 95, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>
                <DollarSign size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '1rem', fontWeight: 600 }}>Buyers hold the power</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Describe the exact item you want to buy. Set your target price and condition. Sit back while the market comes to you.</p>
            </motion.div>

            {/* Seller Focus */}
            <motion.div 
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              style={{ borderTop: '4px solid var(--secondary-blue)' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(46, 95, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--secondary-blue)' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '1rem', fontWeight: 600 }}>Sellers bid to win</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Don&apos;t wait for your items to sell. Browse real requests from ready-to-buy customers and make them an offer they can&apos;t refuse.</p>
            </motion.div>

            {/* Smart Assistant Focus */}
            <motion.div 
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              style={{ borderTop: '4px solid var(--ai-teal)' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(29, 158, 117, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--ai-teal)' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '1rem', fontWeight: 600 }}>Surcal Smart Assistant Quality Filtering</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Our Smart Assistant automatically scores every bid 1-10 and flags spam. Buyers never have to sift through low-quality offers.</p>
            </motion.div>

          </div>
        </section>

        {/* How it Works Section */}
        <section style={{ width: '100%', maxWidth: '1200px', padding: 'var(--container-padding)', marginBottom: '8rem', textAlign: 'center' }}>
          <h2 className="heading-lg" style={{ marginBottom: '3rem' }}>How Surcal Works</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
             {/* Step 1 */}
             <div style={{ flex: '1 1 250px', padding: '2rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-navy)', marginBottom: '1rem' }}>1</div>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Post your Request</h3>
               <p style={{ color: 'var(--text-secondary)' }}>Describe the product you want to buy and set your target price.</p>
             </div>
             {/* Step 2 */}
             <div style={{ flex: '1 1 250px', padding: '2rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-blue)', marginBottom: '1rem' }}>2</div>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Receive Offers</h3>
               <p style={{ color: 'var(--text-secondary)' }}>Sellers compete by offering their items at the best price and condition.</p>
             </div>
             {/* Step 3 */}
             <div style={{ flex: '1 1 250px', padding: '2rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--ai-teal)', marginBottom: '1rem' }}>3</div>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Pick the Best</h3>
               <p style={{ color: 'var(--text-secondary)' }}>Review AI-scored bids and choose the perfect match.</p>
             </div>
          </div>
        </section>

        {/* Features Deep Dive */}
        <section style={{ width: '100%', maxWidth: '1200px', padding: 'var(--container-padding)', marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="badge-ai" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <Shield size={16} /> Enterprise-Grade Reliability
            </div>
            <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>Everything you need to source smarter</h2>
            <p className="text-lead" style={{ margin: '0 auto', maxWidth: '700px' }}>Surcal goes beyond traditional marketplaces by equipping buyers with powerful Smart Assistant tools and sellers with a transparent playing field.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {/* Feature 1 */}
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(29, 158, 117, 0.1)', color: 'var(--ai-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Sparkles size={30} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Assistant-Assisted Product Details</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Not sure exactly what model or specs to ask for? Just write a quick summary, and Surcal Smart Assistant will instantly expand it into a highly detailed product request. This ensures sellers know exactly what condition and specifications you require.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--success-green)" /> Automatically formats requirements</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--success-green)" /> Suggests realistic budget ranges</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--success-green)" /> Highlights missing crucial details</li>
                </ul>
              </div>
              <motion.div 
                className="glass-card" 
                style={{ flex: '1 1 400px', padding: '2rem', height: '300px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(29, 158, 117, 0.2)' }}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                 <div style={{ position: 'absolute', top: '15%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(29,158,117,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
                 <div style={{ position: 'relative', zIndex: 1 }}>
                   <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--ai-teal)', marginBottom: '1rem' }}>&gt; Analysing request draft...</p>
                   <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>Improved Request:</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>"Looking for a Sony A7III Mirrorless Camera (Body Only). Must be in excellent condition with a shutter count under 20k, original box and charger included..."</p>
                   </div>
                 </div>
              </motion.div>
            </div>

            {/* Feature 2 */}
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
              <motion.div 
                className="glass-card" 
                style={{ flex: '1 1 400px', padding: '2rem', height: '300px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(46, 95, 163, 0.2)' }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                 <div style={{ position: 'absolute', top: '50%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(46,95,163,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', transform: 'translateY(-50%)' }}></div>
                 <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '4px solid var(--success-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>Verified Reseller</p>
                         <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.75rem', background: 'var(--ai-teal)', color: 'var(--text-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Assistant Match: 9.5</span>
                         </div>
                       </div>
                       <span style={{ fontWeight: 700, color: 'var(--app-purple)' }}>$820</span>
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>Marketplace Seller</p>
                         <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.75rem', background: 'var(--text-secondary)', color: 'var(--text-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Assistant Match: 6.2</span>
                         </div>
                       </div>
                       <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>$960</span>
                    </div>

                 </div>
              </motion.div>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(46, 95, 163, 0.1)', color: 'var(--secondary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <TrendingUp size={30} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Real-Time Market Pricing</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Stop guessing what an item should cost. By letting multiple sellers compete on your exact request, you see the true market price within hours — no resale markup, no scalper tax, no surprise fees at checkout.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Transparent, side-by-side seller offers</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Beat resale, eBay, and StockX markup</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Verified sellers with authentic stock</li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(83, 58, 183, 0.1)', color: 'var(--app-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Shield size={30} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Stripe Escrow on Every Order</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Powered by Stripe Connect, your payment is held safely in escrow until your item arrives. The seller only gets paid once you confirm delivery — so you never have to wire money to a stranger and hope.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> Funds held until delivery confirmed</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> Live USPS/UPS/FedEx tracking on every order</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> Shipping address never shared with losing bidders</li>
                </ul>
              </div>
              <motion.div 
                className="glass-card" 
                style={{ flex: '1 1 400px', padding: '2rem', height: '300px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(83, 58, 183, 0.2)' }}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                 <div style={{ position: 'absolute', top: '15%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(83,58,183,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
                 <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--success-green)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                         <CheckCircle size={24} />
                       </div>
                       <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>Payment Secured</p>
                       <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Funds are placed in escrow via Stripe.</p>
                       <div style={{ width: '100%', height: '4px', background: 'var(--border-light)', borderRadius: '2px', marginTop: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 1, delay: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--success-green)' }}></motion.div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={{ width: '100%', padding: '6rem var(--container-padding)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', marginBottom: '8rem' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>Trusted by Both Sides</h2>
                <p className="text-lead" style={{ margin: '0 auto', maxWidth: '600px' }}>Don&apos;t just take our word for it. Hear from buyers saving money and sellers scaling their businesses.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                 
                 {/* Testimonial 1 */}
                 <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', color: '#FFD700', marginBottom: '1rem' }}>
                      <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" />
                    </div>
                    <p style={{ color: 'var(--primary-navy)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "I&apos;d been hunting for a clean pair of Jordan 1 Chicagos in my size for months. Posted the exact pair I wanted on Surcal and had 6 verified sellers competing within a day. Got them $80 below resale and the escrow made me feel safe sending real money."
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>J</div>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>Jordan Reyes</p>
                         <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sneaker collector, buyer</p>
                       </div>
                    </div>
                 </div>

                 {/* Testimonial 2 */}
                 <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', color: '#FFD700', marginBottom: '1rem' }}>
                      <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" />
                    </div>
                    <p style={{ color: 'var(--primary-navy)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "I&apos;ve been flipping electronics for years and eBay fees were eating my margins. On Surcal buyers tell me exactly what they want, I quote, ship, and get paid out of escrow. The 5% flat fee is nothing compared to what I was losing before."
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ai-purple) 0%, #6d28d9 100%)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>D</div>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>Devin Park</p>
                         <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Electronics reseller, seller</p>
                       </div>
                    </div>
                 </div>

              </div>
           </div>
        </section>

        {/* FAQs Section */}
        <section style={{ width: '100%', maxWidth: '800px', padding: 'var(--container-padding)', marginBottom: '8rem', margin: '0 auto 8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>How does the Smart Assistant scoring work?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Surcal Smart Assistant analyzes the original buyer request against the seller's bid. It evaluates relevance, pricing realisticness, and seller communication. It filters out spam and gives each valid bid a score from 1-10 so buyers can quickly spot the highest quality offers.</p>
            </div>

            <div style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>What are the platform fees?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Posting requests is 100% free for buyers. For sellers, Surcal takes a flat 5% platform fee on all successfully completed and paid transactions. We do not charge per-bid, monthly subscription fees, or hidden payment surcharges.</p>
            </div>

            <div style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>What kind of items can I buy on Surcal?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Surcal is a marketplace for physical products. Buyers post requests for things like electronics, sneakers and streetwear, trading cards and collectibles, jewelry and watches, automotive parts, and home goods. Attach a reference photo to your request so sellers know the exact model, condition, and authenticity you&apos;re looking for.</p>
            </div>

          </div>
        </section>

        {/* Call to Action */}
        <section style={{ width: '100%', padding: '6rem var(--container-padding)', background: 'linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '24px', maxWidth: '1200px', marginBottom: '4rem' }}>
          <h2 className="heading-xl" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>Ready to get the item you want at your price?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>Skip the search. Post what you want, let sellers compete, and pay only when it shows up at your door.</p>
          <Link href={ctaHref} style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ background: '#FFFFFF', color: 'var(--primary-navy)', fontSize: '1.1rem', padding: '1rem 2.5rem', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 600 }}>
              {ctaFinal}
            </button>
          </Link>
        </section>

    </div>
  );
}
