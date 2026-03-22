'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { scoreBid, getSellerTrustScore } from '@/app/actions/ai';
import { Shield } from 'lucide-react';

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [bids, setBids] = useState<any[]>([]);
  const [transaction, setTransaction] = useState<any>(null);

  // Bid form state
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [timeline, setTimeline] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Chat / Existing Bid variables
  const [myBid, setMyBid] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    async function loadRequest() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }

      const { data } = await supabase.from('requests').select('*').eq('id', id).single();
      
      // Check for Stripe Success Redirect
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          const acceptedBidId = urlParams.get('bid');
          const sessionId = urlParams.get('session_id');
          if (acceptedBidId && sessionId) {
            await fetch('/api/escrow/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, bidId: acceptedBidId, requestId: id })
            });
            alert('🎉 Payment Authorized! The funds have been placed in Escrow via Stripe.');
            window.history.replaceState({}, '', `/requests/${id}`);
            if (data) data.status = 'in_progress';
          }
        }
      }

      setRequest(data);
      
      if (user && data && data.buyer_id === user.id) {
         const { data: bidsData } = await supabase.from('bids').select('*, profiles(name, is_verified)').eq('request_id', id).order('ai_score', { ascending: false });
         
         if (bidsData) {
           const scores: Record<string, any> = {};
           for (const b of bidsData) {
             if (!scores[b.seller_id]) {
               try {
                 scores[b.seller_id] = await getSellerTrustScore(b.seller_id);
               } catch (err) {
                 console.error("AI Trust Check Failed:", err);
                 scores[b.seller_id] = { score: 50, reason: "Trust analysis temporarily unavailable." };
               }
             }
             b.trustScore = scores[b.seller_id];
           }
         }
         
         setBids(bidsData || []);

         const { data: tx } = await supabase.from('transactions').select('*').eq('request_id', id).single();
         if (tx) setTransaction(tx);
      } else if (user && data && data.buyer_id !== user.id) {
         // Seller view: check if they already bid
         const { data: existingBid } = await supabase.from('bids').select('*').eq('request_id', id).eq('seller_id', user.id).single();
         if (existingBid) {
           setMyBid(existingBid);
           // Fetch chat messages
           const { data: msgs } = await supabase.from('messages').select('*').eq('request_id', id).order('created_at', { ascending: true });
           if (msgs) setChatMessages(msgs);
         }
      }
      
      setLoading(false);
    }
    loadRequest();
  }, [id, supabase]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidding(true);
    setError('');

    if (!userId) {
      setError('You must be logged in to submit bids.');
      setBidding(false);
      return;
    }

    // Enforce Usage Limits
    const { count } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('seller_id', userId);
    const { data: sub } = await supabase.from('user_subscriptions').select('plan_id, subscription_plans(limits_bids)').eq('user_id', userId).eq('status', 'active').single();
    
    // Default free limit = 10 bids
    const limit = (sub?.subscription_plans as any)?.limits_bids ?? 10;
    if (limit !== -1 && (count || 0) >= limit) {
      setError('You have reached your monthly bid limit. Please upgrade your subscription.');
      setBidding(false);
      return;
    }

    const { data: bidData, error: insertError } = await supabase.from('bids').insert([{
      request_id: id,
      seller_id: userId,
      price: parseFloat(price),
      message,
      timeline
    }]).select('id').single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setBidSuccess(true);
      
      // Auto-send a notification message to the buyer
      if (request?.buyer_id) {
        await supabase.from('messages').insert([{
          request_id: id,
          sender_id: userId,
          receiver_id: request.buyer_id,
          content: `Hi! I just placed an offer of $${price} for this item! Check out my offer details directly on the item page.`
        }]);
      }

      // Trigger AI Scoring asynchronously
      if (bidData) {
        scoreBid(bidData.id, request.description, message, parseFloat(price), request.budget);
      }
      setPrice('');
      setMessage('');
      setTimeline('');
    }
    setBidding(false);
  };

  const handleMessageSeller = async (sellerId: string) => {
    if (!userId) return;
    const { data: existingMsgs } = await supabase.from('messages')
      .select('id')
      .eq('request_id', id)
      .or(`sender_id.eq.${sellerId},receiver_id.eq.${sellerId}`)
      .limit(1);
      
    if (!existingMsgs || existingMsgs.length === 0) {
       await supabase.from('messages').insert([{
         request_id: id,
         sender_id: userId,
         receiver_id: sellerId,
         content: 'Hi! I just saw your offer. Can we discuss some details?'
       }]);
    }
    router.push('/messages');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myBid) return;

    try {
      const { data, error: msgError } = await supabase.from('messages').insert([{
        request_id: id,
        sender_id: userId,
        receiver_id: request.buyer_id,
        content: newMessage
      }]).select().single();

      if (!msgError && data) {
        setChatMessages([...chatMessages, data]);
        setNewMessage('');
      } else {
        alert('Could not send message. Please ensure the migration is applied.');
      }
    } catch(err) {
      alert('Error sending message.');
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const { error: bidErr } = await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
      if (bidErr) {
        alert('Failed to accept offer: ' + bidErr.message);
        return;
      }
      
      const { error: reqErr } = await supabase.from('requests').update({ status: 'in_progress' }).eq('id', id);
      if (reqErr) {
        alert('Failed to update request: ' + reqErr.message);
        return;
      }

      alert('Offer accepted! You can now pay to fund the Escrow.');
      
      const updatedBids = bids.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b);
      setBids(updatedBids);
      setRequest({ ...request, status: 'in_progress' });
    } catch (err) {
      alert('Error accepting offer.');
    }
  };

  const handlePayFund = async (bidId: string, bidPrice: string) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId,
          price: parseFloat(bidPrice),
          title: request.title,
          requestId: id
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to initiate checkout.');
    }
  };

  const handleReleaseFunds = async () => {
    if (!transaction) return;
    try {
      const res = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id })
      });
      const data = await res.json();
      if (data.success) {
        alert('Funds released successfully! The request is now closed.');
        setRequest({ ...request, status: 'closed' });
        setTransaction({ ...transaction, status: 'released' });
      } else {
        alert('Error releasing funds: ' + data.error);
      }
    } catch(err) {
      alert('Failed to release funds.');
    }
  };

  if (loading) return <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading...</div>;
  if (!request) return <div style={{ padding: '120px 20px', textAlign: 'center' }}>Request not found.</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        
        {/* Request Details */}
        <div style={{ flex: '1 1 500px' }}>
          <h1 className="heading-xl" style={{ marginBottom: '1rem' }}>{request.title}</h1>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ padding: '0.4rem 1rem', background: 'rgba(30, 58, 95, 0.1)', color: 'var(--primary-navy)', borderRadius: '20px', fontWeight: 600 }}>Target Price: ${request.budget}</span>
            <span style={{ padding: '0.4rem 1rem', background: 'rgba(46, 95, 163, 0.1)', color: 'var(--secondary-blue)', borderRadius: '20px', fontWeight: 600 }}>Delivery Needed By: {new Date(request.deadline).toLocaleDateString()}</span>
            <span style={{ padding: '0.4rem 1rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '20px', fontWeight: 600 }}>Status: {request.status}</span>
          </div>
          
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Condition & Specifications</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {request.description}
            </p>
            {request.image_url && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Reference Image</h4>
                <img src={request.image_url} alt="Reference" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div style={{ flex: '1 1 350px' }}>
          {userId === request.buyer_id ? (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>Offers from Sellers</h3>
              {bids.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No offers yet. Sellers will see this request shortly.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bids.map((bid, index) => (
                    <div key={bid.id} style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '12px', background: bid.ai_score >= 8 ? 'rgba(39, 174, 96, 0.05)' : 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center' }}>
                            {bid.profiles?.name || 'Seller'}
                            {bid.profiles?.is_verified && <span title="Verified Seller" style={{ display: 'flex', alignItems: 'center' }}><Shield size={16} color="var(--success-green)" style={{ marginLeft: '5px' }} /></span>}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{bid.timeline}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--app-purple)' }}>${bid.price}</p>
                          {bid.ai_score && (
                            <span style={{ fontSize: '0.75rem', background: bid.ai_score >= 8 ? 'var(--success-green)' : 'var(--text-secondary)', color: 'var(--text-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.3rem' }}>
                              Smart Assistant Quality: {bid.ai_score}/10
                            </span>
                          )}
                          {bid.trustScore && (
                            <span title={bid.trustScore.reason} style={{ fontSize: '0.75rem', background: bid.trustScore.score >= 80 ? 'var(--primary-magenta)' : 'var(--warning-orange)', color: 'var(--text-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.3rem', marginLeft: '0.5rem' }}>
                              Trust: {bid.trustScore.score}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{bid.message}"</p>
                      {bid.ai_reason && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--ai-teal)', background: 'rgba(29, 158, 117, 0.1)', padding: '0.8rem', borderRadius: '4px', borderLeft: '2px solid var(--ai-teal)' }}>
                          <strong>Surcal Smart Assistant Analysis:</strong> {bid.ai_reason}
                        </div>
                      )}
                      {bid.status === 'pending' && request.status === 'open' && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                          <button className="button-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', justifyContent: 'center' }} onClick={() => handleMessageSeller(bid.seller_id)}>
                            Message Seller
                          </button>
                          <button className="button-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', justifyContent: 'center' }} onClick={() => handleAcceptBid(bid.id)}>
                            Accept Offer
                          </button>
                        </div>
                      )}
                      {bid.status === 'accepted' && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: !transaction ? 'rgba(230, 126, 34, 0.1)' : 'rgba(39, 174, 96, 0.1)', color: !transaction ? 'var(--warning-orange)' : 'var(--success-green)', borderRadius: '8px', textAlign: 'center', border: !transaction ? '1px solid rgba(230, 126, 34, 0.2)' : '1px solid rgba(39, 174, 96, 0.2)' }}>
                          {!transaction ? (
                             <>
                               <p style={{ margin: '0 0 0.8rem 0', fontWeight: 'bold' }}>Offer Accepted (Unfunded)</p>
                               <button onClick={() => handlePayFund(bid.id, bid.price)} className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                                 Pay Now (Fund Escrow)
                               </button>
                             </>
                          ) : (
                             <>
                               <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Offer Accepted & Funded (Escrow)</p>
                               {transaction?.status === 'escrow' && request.status === 'in_progress' ? (
                                 <button onClick={handleReleaseFunds} className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                                   Confirm Delivery & Release Funds
                                 </button>
                               ) : transaction?.status === 'released' ? (
                                 <p style={{ margin: 0, fontSize: '0.85rem' }}>Funds have been released to the seller.</p>
                               ) : null}
                             </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : userId ? (
            myBid ? (
              <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: 'var(--primary-navy)' }}>Your Offer</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-green)' }}>${myBid.price}</span>
                    <span style={{ fontSize: '0.8rem', background: myBid.status === 'accepted' ? 'var(--success-green)' : 'var(--text-secondary)', color: 'var(--text-primary)', padding: '0.3rem 0.8rem', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 600 }}>
                      {myBid.status}
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.01)' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto 0' }}>
                      <p>No messages yet.</p>
                      <p style={{ fontSize: '0.85rem' }}>Send a message to the client outlining why you are the best fit for this project.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isMe = msg.sender_id === userId;
                      return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', background: isMe ? 'var(--primary-magenta)' : 'var(--bg-surface)', color: isMe ? 'white' : 'var(--text-primary)', padding: '0.8rem 1rem', borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0', border: isMe ? 'none' : '1px solid var(--border-light)' }}>
                          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.content}</p>
                          <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', marginTop: '0.4rem', textAlign: isMe ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message to the client..." style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '20px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }} />
                    <button type="submit" disabled={!newMessage.trim()} className="button-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', opacity: !newMessage.trim() ? 0.6 : 1 }}>Send</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-magenta)' }}>Make an Offer</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Offer to sell your item for this request.</p>

              {bidSuccess && (
                <div style={{ padding: '1rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(39, 174, 96, 0.2)' }}>
                  Offer submitted successfully!
                </div>
              )}

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleBid} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Offer Price ($)</label>
                  <input type="number" step="0.01" min="1" required value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Item Condition & Shipping Speed</label>
                  <input type="text" required value={timeline} onChange={e => setTimeline(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="e.g. Brand New, Ships in 2 days" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Offer Details & Specs</label>
                  <textarea rows={4} required value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit' }} placeholder="Describe the exact condition of your item and what's included..."></textarea>
                </div>
                <button type="submit" disabled={bidding} className="button-primary" style={{ padding: '1rem', justifyContent: 'center' }}>
                  {bidding ? 'Submitting...' : 'Submit Offer'}
                </button>
              </form>
            </div>
            )
          ) : (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Login Required</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You must be <strong>logged in</strong> to submit offers on this request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
