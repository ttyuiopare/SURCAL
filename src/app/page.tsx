'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, DollarSign, Shield, CheckCircle, TrendingUp, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
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
              <Link href="/post-request" style={{ textDecoration: 'none' }}>
                <button className="button-primary" style={{ gap: '0.5rem', fontSize: '1.1rem', padding: '1rem 2.5rem', boxShadow: '0 4px 14px 0 rgba(30, 58, 95, 0.39)', cursor: 'pointer' }}>
                  Request a Product <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/requests" style={{ textDecoration: 'none' }}>
                <button className="button-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', cursor: 'pointer' }}>
                  Browse Wanted Items
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
            <p className="text-lead" style={{ margin: '0 auto' }}>Don't search for hours. Let the sellers come to you.</p>
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
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Don't wait for your items to sell. Browse real requests from ready-to-buy customers and make them an offer they can't refuse.</p>
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
                   <div style={{ background: 'var(--text-primary)', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
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
                    
                    <div style={{ background: 'var(--text-primary)', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '4px solid var(--success-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>Modern Spaces</p>
                         <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.75rem', background: 'var(--ai-teal)', color: 'var(--text-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Assistant Match: 9.5</span>
                         </div>
                       </div>
                       <span style={{ fontWeight: 700, color: 'var(--app-purple)' }}>$11,800</span>
                    </div>

                    <div style={{ background: 'var(--text-primary)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>Budget Office Co.</p>
                         <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.75rem', background: 'var(--text-secondary)', color: 'var(--text-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Assistant Match: 6.2</span>
                         </div>
                       </div>
                       <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>$14,000</span>
                    </div>

                 </div>
              </motion.div>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(46, 95, 163, 0.1)', color: 'var(--secondary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <TrendingUp size={30} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Instant Market Pricing</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Stop guessing what things should cost. By letting multiple sellers bid on your exact specifications, you discover the true market rate within hours. No more endless haggling or hidden fees.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Transparent bidding environment</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Avoid overpriced enterprise agency rates</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--secondary-blue)" /> Access to hidden-gem independent talent</li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(83, 58, 183, 0.1)', color: 'var(--app-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Shield size={30} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>Secure Payments & Privacy</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Powered by Stripe Connect, all payments are securely held until milestones are met. Your contact details remain private until you explicitly accept a seller's bid.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> Stripe encrypted transactions</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> No spam or unsolicited emails</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} color="var(--app-purple)" /> Automated split payouts</li>
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
                    <div style={{ background: 'var(--text-primary)', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
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
                <p className="text-lead" style={{ margin: '0 auto', maxWidth: '600px' }}>Don't just take our word for it. Hear from buyers saving money and sellers scaling their businesses.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                 
                 {/* Testimonial 1 */}
                 <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', color: '#FFD700', marginBottom: '1rem' }}>
                      <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" />
                    </div>
                    <p style={{ color: 'var(--primary-navy)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "I needed a complete rebranding for my logistics company. Posting on Surcal got me 8 highly qualified bids within 24 hours. Surcal Smart Assistant's score pointed exactly to the agency I ended up hiring. It saved me weeks of vendor searching."
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>Sarah Jenkins</p>
                         <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operations Director, buyer</p>
                       </div>
                    </div>
                 </div>

                 {/* Testimonial 2 */}
                 <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', color: '#FFD700', marginBottom: '1rem' }}>
                      <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" /> <Star size={16} fill="currentColor" />
                    </div>
                    <p style={{ color: 'var(--primary-navy)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', fontStyle: 'italic' }}>
                      "As a freelance developer, I used to hate doing outreach and paying upwork fees. Surcal feels like a cheat code. I log on, scan the requests, drop a competitive bid, and win work. The 5% flat fee is unbelievably fair."
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ai-purple) 0%, #6d28d9 100%)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>M</div>
                       <div>
                         <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>Marcus Lin</p>
                         <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Software Engineer, seller</p>
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
            
            <div style={{ padding: '1.5rem', background: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>How does the Smart Assistant scoring work?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Surcal Smart Assistant analyzes the original buyer request against the seller's bid. It evaluates relevance, pricing realisticness, and seller communication. It filters out spam and gives each valid bid a score from 1-10 so buyers can quickly spot the highest quality offers.</p>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>What are the platform fees?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Posting requests is 100% free for buyers. For sellers, Surcal takes a flat 5% platform fee on all successfully completed and paid transactions. We do not charge per-bid, monthly subscription fees, or hidden payment surcharges.</p>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', margin: '0 0 0.8rem 0' }}>Can I use Surcal for physical products?</h4>
               <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Yes! While many users source digital services, bulk orders, custom hardware, or localized services are very common. Buyers can attach photos directly to their request to show exactly what physical product they need sourced or manufactured.</p>
            </div>

          </div>
        </section>

        {/* Call to Action */}
        <section style={{ width: '100%', padding: '6rem var(--container-padding)', background: 'linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '24px', maxWidth: '1200px', marginBottom: '4rem' }}>
          <h2 className="heading-xl" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>Ready to transform your sourcing?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>Join thousands of buyers and sellers already using Surcal to work smarter.</p>
          <Link href="/post-request" style={{ textDecoration: 'none' }}>
            <button className="button-primary" style={{ background: 'var(--text-primary)', color: 'var(--primary-navy)', fontSize: '1.1rem', padding: '1rem 2.5rem', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 600 }}>
              Get Started for Free
            </button>
          </Link>
        </section>

    </div>
  );
}
