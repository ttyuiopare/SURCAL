'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { scoreBid, getSellerTrustScore } from '@/app/actions/ai';
import { moderateContent } from '@/app/actions/moderation';
import { Shield, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import ShippingAddressForm, { type ShippingAddress } from '@/app/components/ShippingAddressForm';
import { CARRIERS, trackingUrl, carrierLabel } from '@/utils/trackingLinks';

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile, supabase } = useAuth();
  const userId = user?.id ?? '';
  const userRole = profile?.role ?? '';
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  
  // NEW STATE: Logistics & Reviews
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitTrackLoading, setSubmitTrackLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  // Seller competition state (reverse auction)
  const [competingBids, setCompetingBids] = useState<{ id: string; price: number; seller_id: string }[]>([]);

  // Counter-offer state
  const [counteringBidId, setCounteringBidId] = useState<string | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterMessageInput, setCounterMessageInput] = useState('');
  const [counterLoading, setCounterLoading] = useState(false);
  const [sellerCountering, setSellerCountering] = useState(false);
  const [sellerCounterPrice, setSellerCounterPrice] = useState('');
  const [sellerCounterMessage, setSellerCounterMessage] = useState('');

  // Shipping address modal state for the buyer's "Pay Now" flow
  const [shippingModalForBidId, setShippingModalForBidId] = useState<string | null>(null);
  const [shippingModalLoading, setShippingModalLoading] = useState(false);
  const pendingPayBid = bids.find((b) => b.id === shippingModalForBidId);

  useEffect(() => {
    async function loadRequest() {
      const { data } = await supabase.from('requests').select('*').eq('id', id).single();
      
      // Check for Stripe Success Redirect
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          const acceptedBidId = urlParams.get('bid');
          const sessionId = urlParams.get('session_id');
          if (acceptedBidId && sessionId) {
            const recRes = await fetch('/api/escrow/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, bidId: acceptedBidId, requestId: id })
            });
            const recData = await recRes.json().catch(() => ({}));
            if (!recRes.ok) {
              alert('Payment recorded with Stripe but Surcal had a problem saving it: ' + (recData.error ?? recRes.status) + ' — refresh the page in a moment; the webhook may still resolve it.');
            } else {
              alert('🎉 Payment Authorized! The funds have been placed in Escrow via Stripe.');
            }
            window.history.replaceState({}, '', `/requests/${id}`);
            if (data) data.status = 'in_progress';
            // Mark accepted bid in local data so the rendered status flips.
            // The transaction will be fetched fresh below.
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

         // Load competing bids (reverse-auction visibility)
         const { data: allBids } = await supabase
           .from('bids')
           .select('id, price, seller_id, status')
           .eq('request_id', id);
         if (allBids) {
           setCompetingBids(allBids.filter(b => b.status === 'pending').map(b => ({ id: b.id, price: Number(b.price), seller_id: b.seller_id })));
         }
      }
      
      setLoading(false);
    }
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

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
      
      let newMsg = null;
      // Auto-send a notification message to the buyer
      if (request?.buyer_id) {
        const { data: msgData } = await supabase.from('messages').insert([{
          request_id: id,
          sender_id: userId,
          receiver_id: request.buyer_id,
          content: `Hi! I just placed an offer of $${price} for this item! Check out my offer details directly on the item page.`
        }]).select().single();
        if (msgData) newMsg = msgData;
      }

      // Trigger AI Scoring asynchronously
      if (bidData) {
        scoreBid(bidData.id, request.description, message, parseFloat(price), request.budget);
        moderateContent({
          type: 'bid',
          contentId: bidData.id,
          userId,
          text: `${timeline}\n\n${message}`,
          link: `/requests/${id}`,
        }).catch((err) => console.error('[bid] moderation failed:', err));

        // Update UI to show the chat interface
        setMyBid({
          id: bidData.id,
          request_id: id,
          seller_id: userId,
          price: parseFloat(price),
          message,
          timeline,
          status: 'pending'
        });
        if (newMsg) {
          setChatMessages([newMsg]);
        }
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

      const acceptedBid = bids.find(b => b.id === bidId);
      if (acceptedBid && userId) {
        await supabase.from('messages').insert([{
          request_id: id,
          sender_id: userId,
          receiver_id: acceptedBid.seller_id,
          content: `🤝 Buyer accepted your $${acceptedBid.price} offer. Awaiting escrow funding to begin fulfillment.`,
        }]);
      }

      alert('Offer accepted! You can now pay to fund the Escrow.');

      const updatedBids = bids.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b);
      setBids(updatedBids);
      setRequest({ ...request, status: 'in_progress' });
    } catch (err) {
      alert('Error accepting offer.');
    }
  };

  const submitCounter = async (bidId: string, price: number, message: string) => {
    setCounterLoading(true);
    try {
      const res = await fetch('/api/bids/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, counterPrice: price, message: message || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Counter failed: ' + (data.error || res.status));
        return false;
      }
      const counterBy = data.counterBy;
      const updated = {
        counter_price: price,
        counter_message: message || null,
        counter_by: counterBy,
        counter_at: new Date().toISOString(),
      };
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...updated } : b));
      if (myBid?.id === bidId) setMyBid({ ...myBid, ...updated });
      return true;
    } catch (err: any) {
      alert('Counter failed: ' + err.message);
      return false;
    } finally {
      setCounterLoading(false);
    }
  };

  const handleBuyerCounter = async (e: React.FormEvent, bidId: string) => {
    e.preventDefault();
    const price = parseFloat(counterPriceInput);
    if (!(price > 0)) { alert('Enter a valid price'); return; }
    const ok = await submitCounter(bidId, price, counterMessageInput);
    if (ok) {
      setCounteringBidId(null);
      setCounterPriceInput('');
      setCounterMessageInput('');
    }
  };

  const handleSellerCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myBid) return;
    const price = parseFloat(sellerCounterPrice);
    if (!(price > 0)) { alert('Enter a valid price'); return; }
    const ok = await submitCounter(myBid.id, price, sellerCounterMessage);
    if (ok) {
      setSellerCountering(false);
      setSellerCounterPrice('');
      setSellerCounterMessage('');
    }
  };

  const handleAcceptCounter = async (bidId: string) => {
    setCounterLoading(true);
    try {
      const res = await fetch('/api/bids/accept-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Accept counter failed: ' + (data.error || res.status));
        return;
      }
      const cleared = { price: data.newPrice, counter_price: null, counter_message: null, counter_by: null, counter_at: null };
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...cleared } : b));
      if (myBid?.id === bidId) setMyBid({ ...myBid, ...cleared });
    } catch (err: any) {
      alert('Accept counter failed: ' + err.message);
    } finally {
      setCounterLoading(false);
    }
  };

  const handlePayFund = async (bidId: string, _bidPrice: string) => {
    // Open the shipping address modal first. The actual checkout fires from
    // the modal's onConfirm callback below (proceedToCheckout).
    setShippingModalForBidId(bidId);
  };

  const proceedToCheckout = async (address: ShippingAddress) => {
    if (!pendingPayBid) return;
    setShippingModalLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: pendingPayBid.id,
          price: parseFloat(pendingPayBid.price),
          title: request.title,
          requestId: id,
          shippingAddress: address,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + data.error);
        setShippingModalLoading(false);
      }
    } catch (err) {
      alert('Failed to initiate checkout.');
      setShippingModalLoading(false);
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

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setSubmitTrackLoading(true);
    try {
      const res = await fetch('/api/shipping/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId: transaction.id, 
          carrier: trackingCarrier, 
          trackingNumber, 
          buyerId: request.buyer_id, 
          requestTitle: request.title 
        })
      });
      if (res.ok) {
        alert('Tracking added successfully!');
        setTransaction({...transaction, tracking_number: trackingNumber, shipping_carrier: trackingCarrier, status: 'shipped'});
      } else {
        alert('Failed to update tracking');
      }
    } catch(err) {
      alert('Error updating tracking');
    }
    setSubmitTrackLoading(false);
  };

  const handleSubmitReview = async (e: React.FormEvent, sellerId: string) => {
    e.preventDefault();
    if (!transaction) return;
    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId: transaction.id,
          revieweeId: sellerId,
          rating,
          comment
        })
      });
      if (res.ok) {
        setReviewDone(true);
        alert('Review submitted! Thank you.');
      } else {
        alert('Failed to submit review');
      }
    } catch(err) {
      alert('Error submitting review');
    }
    setReviewLoading(false);
  };

  if (loading) return <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading...</div>;
  if (!request) return <div style={{ padding: '120px 20px', textAlign: 'center' }}>Request not found.</div>;

  // Reverse-auction stats (seller-facing)
  const sortedCompeting = [...competingBids].sort((a, b) => a.price - b.price);
  const lowestCompetingOverall = sortedCompeting[0]?.price ?? null;
  const lowestCompetingByOthers = sortedCompeting.find(b => b.seller_id !== userId)?.price ?? null;
  const myRank = myBid && myBid.status === 'pending'
    ? sortedCompeting.findIndex(b => b.id === myBid.id) + 1
    : null;
  const sellersCompetingCount = competingBids.length;
  const isWinning = myRank === 1 && sellersCompetingCount > 0;

  const shipLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.3rem 0.7rem',
    background: 'rgba(46, 95, 163, 0.08)',
    color: 'var(--primary-navy)',
    borderRadius: '999px',
    textDecoration: 'none',
    fontSize: '0.78rem',
    fontWeight: 600,
    border: '1px solid rgba(46, 95, 163, 0.18)',
  };

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
                    <div key={bid.id} style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '12px', background: bid.ai_score >= 8 ? 'rgba(39, 174, 96, 0.05)' : 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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
                        <>
                          {bid.counter_price && bid.counter_by === 'seller' && (
                            <div style={{ marginTop: '0.5rem', padding: '0.8rem 1rem', background: 'rgba(155, 89, 182, 0.08)', border: '1px solid rgba(155, 89, 182, 0.3)', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Seller countered at</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ai-purple, #9b59b6)' }}>${bid.counter_price}</div>
                              {bid.counter_message && <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>&ldquo;{bid.counter_message}&rdquo;</p>}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                                <button disabled={counterLoading} className="button-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => handleAcceptCounter(bid.id)}>
                                  Accept ${bid.counter_price}
                                </button>
                                <button disabled={counterLoading} className="button-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setCounteringBidId(bid.id); setCounterPriceInput(String(bid.counter_price)); }}>
                                  Counter Back
                                </button>
                              </div>
                            </div>
                          )}
                          {bid.counter_price && bid.counter_by === 'buyer' && (
                            <div style={{ marginTop: '0.5rem', padding: '0.7rem 1rem', background: 'rgba(230, 126, 34, 0.08)', border: '1px solid rgba(230, 126, 34, 0.25)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              You countered at <strong style={{ color: 'var(--warning-orange, #e67e22)' }}>${bid.counter_price}</strong> — waiting on seller.
                            </div>
                          )}
                          {counteringBidId === bid.id ? (
                            <form onSubmit={(e) => handleBuyerCounter(e, bid.id)} style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(155, 89, 182, 0.05)', border: '1px solid rgba(155, 89, 182, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your counter price ($)</label>
                              <input type="number" step="0.01" min="1" required autoFocus value={counterPriceInput} onChange={e => setCounterPriceInput(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }} />
                              <textarea rows={2} placeholder="Optional note to seller..." value={counterMessageInput} onChange={e => setCounterMessageInput(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="button-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setCounteringBidId(null); setCounterPriceInput(''); setCounterMessageInput(''); }}>Cancel</button>
                                <button type="submit" disabled={counterLoading} className="button-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}>{counterLoading ? 'Sending...' : 'Send Counter'}</button>
                              </div>
                            </form>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              <button className="button-secondary" style={{ flex: 1, minWidth: '100px', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => handleMessageSeller(bid.seller_id)}>
                                Message
                              </button>
                              <button className="button-secondary" style={{ flex: 1, minWidth: '100px', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setCounteringBidId(bid.id); setCounterPriceInput(''); setCounterMessageInput(''); }}>
                                Counter
                              </button>
                              <button className="button-primary" style={{ flex: 1, minWidth: '100px', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => handleAcceptBid(bid.id)}>
                                Accept ${bid.price}
                              </button>
                            </div>
                          )}
                        </>
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
                               {transaction?.tracking_number && (() => {
                                 const url = trackingUrl(transaction.shipping_carrier, transaction.tracking_number);
                                 return (
                                   <div style={{ margin: '0.5rem 0', padding: '0.6rem 0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'left' }}>
                                     <div style={{ marginBottom: '0.4rem' }}>
                                       <strong>🚚 {carrierLabel(transaction.shipping_carrier)} Tracking:</strong>{' '}
                                       <span style={{ fontFamily: 'monospace' }}>{transaction.tracking_number}</span>
                                     </div>
                                     {url && (
                                       <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-navy)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
                                         Track on {carrierLabel(transaction.shipping_carrier)} <ExternalLink size={12} />
                                       </a>
                                     )}
                                   </div>
                                 );
                               })()}
                               {transaction?.status === 'escrow' && request.status === 'in_progress' ? (
                                 <button onClick={handleReleaseFunds} className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                                   Confirm Delivery & Release Funds
                                 </button>
                               ) : transaction?.status === 'released' || transaction?.status === 'shipped' ? (
                                 <div style={{ marginTop: '1rem' }}>
                                   {transaction?.status === 'released' ? (
                                     <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>Funds have been released to the seller.</p>
                                   ) : (
                                     <button onClick={handleReleaseFunds} className="button-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
                                       Confirm Delivery & Release Funds
                                     </button>
                                   )}
                                   
                                   {transaction?.status === 'released' && !reviewDone && (
                                     <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginTop: '1rem', border: '1px solid var(--border-light)' }}>
                                       <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-navy)' }}>Rate Your Experience</h5>
                                       <form onSubmit={e => handleSubmitReview(e, bid.seller_id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                         <select value={rating} onChange={e => setRating(parseInt(e.target.value))} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                                           <option value={5}>5 Stars - Excellent</option>
                                           <option value={4}>4 Stars - Good</option>
                                           <option value={3}>3 Stars - Average</option>
                                           <option value={2}>2 Stars - Poor</option>
                                           <option value={1}>1 Star - Terrible</option>
                                         </select>
                                         <textarea required placeholder="Write a quick comment..." value={comment} onChange={e => setComment(e.target.value)} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-light)' }} rows={2}></textarea>
                                         <button type="submit" disabled={reviewLoading} className="button-primary" style={{ padding: '0.5rem', justifyContent: 'center' }}>Submit Review</button>
                                       </form>
                                     </div>
                                   )}
                                   {reviewDone && <div style={{ fontSize: '0.9rem', color: 'var(--success-green)', fontWeight: 'bold', marginTop: '0.5rem' }}>Thank you for reviewing!</div>}
                                 </div>
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

                  {myBid.status === 'pending' && sellersCompetingCount > 1 && (
                    <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', background: isWinning ? 'rgba(39, 174, 96, 0.08)' : 'rgba(230, 126, 34, 0.08)', border: `1px solid ${isWinning ? 'rgba(39, 174, 96, 0.3)' : 'rgba(230, 126, 34, 0.3)'}`, borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Competition</div>
                          <div style={{ fontWeight: 700, color: isWinning ? 'var(--success-green)' : 'var(--warning-orange, #e67e22)', fontSize: '0.95rem' }}>
                            {isWinning ? '🏆 You’re winning' : `Rank #${myRank} of ${sellersCompetingCount}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lowest offer</div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>${lowestCompetingOverall}</div>
                        </div>
                      </div>
                      {!isWinning && lowestCompetingByOthers !== null && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Lower your price below <strong>${lowestCompetingByOthers}</strong> to take the lead.
                        </p>
                      )}
                    </div>
                  )}

                  {myBid.status === 'pending' && myBid.counter_price && myBid.counter_by === 'buyer' && (
                    <div style={{ marginTop: '1.2rem', padding: '1rem 1.2rem', background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.3)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Buyer countered at</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ai-purple, #9b59b6)' }}>${myBid.counter_price}</div>
                      {myBid.counter_message && (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>&ldquo;{myBid.counter_message}&rdquo;</p>
                      )}
                      {sellerCountering ? (
                        <form onSubmit={handleSellerCounter} style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <input required type="number" step="0.01" min="1" autoFocus placeholder="Your new price ($)" value={sellerCounterPrice} onChange={e => setSellerCounterPrice(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }} />
                          <textarea rows={2} placeholder="Optional note to buyer..." value={sellerCounterMessage} onChange={e => setSellerCounterMessage(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="button-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setSellerCountering(false); setSellerCounterPrice(''); setSellerCounterMessage(''); }}>Cancel</button>
                            <button type="submit" disabled={counterLoading} className="button-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}>{counterLoading ? 'Sending...' : 'Send Counter'}</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                          <button disabled={counterLoading} className="button-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => handleAcceptCounter(myBid.id)}>
                            Accept ${myBid.counter_price}
                          </button>
                          <button disabled={counterLoading} className="button-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setSellerCountering(true); setSellerCounterPrice(String(myBid.counter_price)); }}>
                            Counter Back
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {myBid.status === 'pending' && myBid.counter_price && myBid.counter_by === 'seller' && (
                    <div style={{ marginTop: '1.2rem', padding: '0.7rem 1rem', background: 'rgba(230, 126, 34, 0.08)', border: '1px solid rgba(230, 126, 34, 0.25)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      You countered at <strong style={{ color: 'var(--warning-orange, #e67e22)' }}>${myBid.counter_price}</strong> — waiting on buyer.
                    </div>
                  )}

                  {myBid.status === 'pending' && !myBid.counter_price && !sellerCountering && (
                    <button type="button" className="button-secondary" style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setSellerCountering(true); setSellerCounterPrice(String(myBid.price)); }}>
                      Adjust My Price
                    </button>
                  )}

                  {myBid.status === 'pending' && !myBid.counter_price && sellerCountering && (
                    <form onSubmit={handleSellerCounter} style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(155, 89, 182, 0.05)', border: '1px solid rgba(155, 89, 182, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New offer price ($)</label>
                      <input required type="number" step="0.01" min="1" autoFocus value={sellerCounterPrice} onChange={e => setSellerCounterPrice(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }} />
                      <textarea rows={2} placeholder="Optional note to buyer..." value={sellerCounterMessage} onChange={e => setSellerCounterMessage(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="button-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => { setSellerCountering(false); setSellerCounterPrice(''); setSellerCounterMessage(''); }}>Cancel</button>
                        <button type="submit" disabled={counterLoading} className="button-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}>{counterLoading ? 'Sending...' : 'Send New Price'}</button>
                      </div>
                    </form>
                  )}


                  {transaction?.shipping_address && (
                    <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(30, 58, 95, 0.04)', border: '1px solid rgba(30, 58, 95, 0.15)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', fontWeight: 600, marginBottom: '0.6rem' }}>
                        <MapPin size={16} /> Ship to
                      </div>
                      <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                        <div style={{ fontWeight: 600 }}>{transaction.shipping_address.name}</div>
                        <div>{transaction.shipping_address.line1}</div>
                        {transaction.shipping_address.line2 && <div>{transaction.shipping_address.line2}</div>}
                        <div>
                          {transaction.shipping_address.city}, {transaction.shipping_address.state} {transaction.shipping_address.postal_code}
                        </div>
                        {transaction.shipping_address.phone && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            ☎ {transaction.shipping_address.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {transaction && transaction.status === 'escrow' && !transaction.tracking_number && (
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(46, 95, 163, 0.05)', border: '1px solid rgba(46, 95, 163, 0.2)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)' }}>Provide Shipping Details</h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The buyer has funded Escrow. Please ship the item and provide tracking.</p>
                      <form onSubmit={handleUpdateTracking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select required value={trackingCarrier} onChange={e => setTrackingCarrier(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                          <option value="">Select carrier...</option>
                          {CARRIERS.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                        <input required type="text" placeholder="Tracking Number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                        <button type="submit" disabled={submitTrackLoading} className="button-primary" style={{ justifyContent: 'center' }}>{submitTrackLoading ? 'Saving...' : 'Submit Tracking'}</button>
                      </form>
                      <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px dashed rgba(46, 95, 163, 0.25)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--primary-navy)' }}>Need a label?</strong> Get discounted commercial rates from any of these — print, ship, then paste the tracking number above.
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                          <a href="https://pirateship.com" target="_blank" rel="noopener noreferrer" style={shipLinkStyle}>Pirate Ship</a>
                          <a href="https://www.usps.com/ship/online-shipping.htm" target="_blank" rel="noopener noreferrer" style={shipLinkStyle}>USPS Click-N-Ship</a>
                          <a href="https://www.ups.com/ship/guided" target="_blank" rel="noopener noreferrer" style={shipLinkStyle}>UPS</a>
                          <a href="https://www.fedex.com/en-us/shipping/online.html" target="_blank" rel="noopener noreferrer" style={shipLinkStyle}>FedEx</a>
                        </div>
                      </div>
                    </div>
                  )}
                  {transaction && transaction.tracking_number && (() => {
                    const url = trackingUrl(transaction.shipping_carrier, transaction.tracking_number);
                    return (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(39, 174, 96, 0.1)', borderRadius: '8px', border: '1px solid rgba(39, 174, 96, 0.3)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Tracking Provided:</strong> {carrierLabel(transaction.shipping_carrier)} —{' '}
                          <span style={{ fontFamily: 'monospace' }}>{transaction.tracking_number}</span>
                        </div>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-navy)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                            Track on {carrierLabel(transaction.shipping_carrier)} <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                  {transaction && transaction.status === 'released' && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(39, 174, 96, 0.1)', borderRadius: '8px', border: '1px solid rgba(39, 174, 96, 0.3)', color: 'var(--success-green)', fontWeight: 'bold' }}>
                      Funds Released! Check your earnings.
                    </div>
                  )}
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
            ) : userRole === 'buyer' ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Buyer Account</h3>
                <p style={{ color: 'var(--text-secondary)' }}>You are logged in as a <strong>Buyer</strong>. Only Sellers can make offers on requests.</p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-magenta)' }}>Make an Offer</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Offer to sell your item for this request.</p>

                {sellersCompetingCount > 0 && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem 1.2rem', background: 'rgba(46, 95, 163, 0.06)', border: '1px solid rgba(46, 95, 163, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Auction</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.3rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {sellersCompetingCount} seller{sellersCompetingCount === 1 ? '' : 's'} competing
                      </div>
                      {lowestCompetingOverall !== null && (
                        <div style={{ color: 'var(--text-primary)' }}>
                          Lowest offer: <strong style={{ color: 'var(--success-green)' }}>${lowestCompetingOverall}</strong>
                        </div>
                      )}
                    </div>
                    {lowestCompetingOverall !== null && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Beat ${lowestCompetingOverall} to lead the auction.
                      </p>
                    )}
                  </div>
                )}

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

      {shippingModalForBidId && (
        <ShippingAddressForm
          loading={shippingModalLoading}
          onClose={() => {
            if (!shippingModalLoading) setShippingModalForBidId(null);
          }}
          onConfirm={proceedToCheckout}
        />
      )}
    </div>
  );
}
