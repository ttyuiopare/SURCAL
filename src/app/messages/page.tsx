'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Clock, User, ImagePlus, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Conversation = {
  id: string; // Combined request_id + counterparty_id
  requestId: string;
  requestTitle: string;
  counterpartyId: string;
  counterpartyName: string;
  latestMessageAt: Date;
  messages: any[];
};

export default function MessagesInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [relatedBid, setRelatedBid] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBuyer, setIsBuyer] = useState(false);
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadInbox() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch all messages involving this user
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select(`
          *,
          request:requests!messages_request_id_fkey(title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (msgs && msgs.length > 0) {
        // Collect all unique user IDs to fetch their profiles manually
        const uniqueUserIds = Array.from(new Set(msgs.flatMap(m => [m.sender_id, m.receiver_id])));
        
        const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', uniqueUserIds);
        const profileMap = new Map();
        if (profiles) {
          profiles.forEach(p => profileMap.set(p.id, p));
        }

        // Group into conversations
        const convoMap = new Map<string, Conversation>();

        msgs.forEach(m => {
          const isSender = m.sender_id === user.id;
          const counterpartyId = isSender ? m.receiver_id : m.sender_id;
          const counterpartyName = profileMap.get(counterpartyId)?.name || 'Unknown User';
          
          const convoId = `${m.request_id}_${counterpartyId}`;
          
          if (!convoMap.has(convoId)) {
            convoMap.set(convoId, {
              id: convoId,
              requestId: m.request_id,
              requestTitle: (m.request as any)?.title || 'Unknown Item',
              counterpartyId,
              counterpartyName: counterpartyName || 'Unknown User',
              latestMessageAt: new Date(m.created_at),
              messages: []
            });
          }
          
          const convo = convoMap.get(convoId)!;
          convo.messages.push(m);
          
          const msgDate = new Date(m.created_at);
          if (msgDate > convo.latestMessageAt) {
            convo.latestMessageAt = msgDate;
          }
        });

        const sortedConvos = Array.from(convoMap.values()).sort((a, b) => b.latestMessageAt.getTime() - a.latestMessageAt.getTime());
        setConversations(sortedConvos);
        if (sortedConvos.length > 0) {
          setSelectedConvoId(sortedConvos[0].id);
        }
      }
      setLoading(false);
    }
    
    loadInbox();
  }, [supabase, router]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConvoId, conversations]);

  // Lookup related bid and roles when conversation is selected
  useEffect(() => {
    async function loadBid() {
      if (!selectedConvoId || !currentUser) return;
      const [reqId, sellerId] = selectedConvoId.split('_');

      const { data: req } = await supabase.from('requests').select('buyer_id').eq('id', reqId).single();
      if (req && req.buyer_id === currentUser.id) {
        setIsBuyer(true);
        const { data: bid } = await supabase.from('bids').select('*').eq('request_id', reqId).eq('seller_id', sellerId).single();
        setRelatedBid(bid || null);
      } else {
        setIsBuyer(false);
        setRelatedBid(null);
      }
    }
    loadBid();
  }, [selectedConvoId, currentUser, supabase]);

  const handleInboxAcceptAndPay = async () => {
    if (!relatedBid || !selectedConvo) return;
    try {
      // Accept bid and escalate request
      await supabase.from('bids').update({ status: 'accepted' }).eq('id', relatedBid.id);
      await supabase.from('requests').update({ status: 'in_progress' }).eq('id', relatedBid.request_id);

      // Trigger Stripe Session Checkout
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: relatedBid.id,
          price: parseFloat(relatedBid.price),
          title: selectedConvo.requestTitle,
          requestId: selectedConvo.requestId
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + data.error);
        setShowConfirmModal(false);
      }
    } catch (err) {
      alert('Error initiating checkout.');
      setShowConfirmModal(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !selectedConvoId || !currentUser) return;

    const convo = conversations.find(c => c.id === selectedConvoId);
    if (!convo) return;

    setUploadingImage(true);
    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `messages/${currentUser.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('request_images').upload(filePath, imageFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('request_images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
    }

    const msgText = newMessage.trim() || '📸 Sent a photo';
    setNewMessage('');
    setImageFile(null);
    setImagePreview('');
    setUploadingImage(false);

    // Optimistically update UI
    const tempMsg = {
      id: Math.random().toString(),
      request_id: convo.requestId,
      sender_id: currentUser.id,
      receiver_id: convo.counterpartyId,
      content: msgText,
      image_url: imageUrl,
      created_at: new Date().toISOString()
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvoId) {
        return {
          ...c,
          messages: [...c.messages, tempMsg],
          latestMessageAt: new Date()
        };
      }
      return c;
    }));

    // Save to DB
    await supabase.from('messages').insert([{
      request_id: convo.requestId,
      sender_id: currentUser.id,
      receiver_id: convo.counterpartyId,
      content: msgText,
      image_url: imageUrl
    }]);
  };

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Inbox...</div>;

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar: Chat List */}
      <aside style={{ width: '320px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', position: 'sticky', top: '80px' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>Inbox</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No messages yet.
            </div>
          ) : (
            conversations.map(convo => (
              <div 
                key={convo.id}
                onClick={() => setSelectedConvoId(convo.id)}
                style={{ 
                  padding: '1.2rem', 
                  borderBottom: '1px solid var(--border-light)', 
                  cursor: 'pointer',
                  background: selectedConvoId === convo.id ? 'rgba(30, 58, 95, 0.05)' : 'transparent',
                  borderLeft: selectedConvoId === convo.id ? '4px solid var(--primary-navy)' : '4px solid transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{convo.counterpartyName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {convo.latestMessageAt.toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-magenta)', fontWeight: 500, marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Item: {convo.requestTitle}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {convo.messages[convo.messages.length - 1]?.content || 'Say hello!'}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
        {!selectedConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Banner Info */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{selectedConvo.counterpartyName}</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Regarding: <strong>{selectedConvo.requestTitle}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {isBuyer && relatedBid && (relatedBid.status === 'pending' || relatedBid.status === 'accepted') && (
                  <button 
                    onClick={() => setShowConfirmModal(true)}
                    className="button-primary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'var(--success-green)' }}
                  >
                    Accept & Pay (${relatedBid.price})
                  </button>
                )}
                <Link href={`/user/${selectedConvo.counterpartyId}`}>
                  <button className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View Profile</button>
                </Link>
                <Link href={`/requests/${selectedConvo.requestId}`}>
                  <button className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View Item</button>
                </Link>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)' }}>
              {selectedConvo.messages.map((msg: any) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '70%', 
                      padding: '1rem', 
                      borderRadius: '16px',
                      background: isMine ? 'var(--primary-navy)' : 'var(--bg-surface)',
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      border: isMine ? 'none' : '1px solid var(--border-light)',
                      borderBottomRightRadius: isMine ? '4px' : '16px',
                      borderBottomLeftRadius: isMine ? '16px' : '4px'
                    }}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="attached" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />
                      )}
                      <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', marginLeft: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {imagePreview && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-color)' }}>
                 <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                   <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--primary-navy)' }} />
                   <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger-red)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                     <X size={14} />
                   </button>
                 </div>
              </div>
            )}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange} 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <ImagePlus size={24} />
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '30px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
                <button type="submit" disabled={(!newMessage.trim() && !imageFile) || uploadingImage} className="button-primary" style={{ padding: '0 1.5rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={18} /> {uploadingImage ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && relatedBid && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Confirm Action</h3>
                   <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                     Are you sure you want to officially accept this offer for <strong>${relatedBid.price}</strong>? You will be redirected to securely fund the escrow via Stripe.
                   </p>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <button onClick={() => setShowConfirmModal(false)} className="button-secondary" style={{ flex: 1, padding: '0.8rem' }}>Cancel</button>
                     <button onClick={handleInboxAcceptAndPay} className="button-primary" style={{ flex: 1, padding: '0.8rem', background: 'var(--success-green)', border: 'none' }}>Confirm & Pay</button>
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}
