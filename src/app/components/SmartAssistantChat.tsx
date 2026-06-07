'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { smartAssistantReply, type ChatTurn } from '../actions/chat';
import { useAuth } from '../providers/AuthProvider';

const STORAGE_KEY = 'surcal:assistant:thread';
const MAX_HISTORY = 24;

const INITIAL_GREETING: ChatTurn = {
  role: 'assistant',
  content:
    "Hey, I'm the Surcal Smart Assistant. Ask me anything about posting a request, writing a bid, pricing, escrow, or how matches work.",
};

export default function SmartAssistantChat() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore history per-session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatTurn[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {
      /* noop */
    }
  }, [messages]);

  // Scroll to bottom on new message.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Don't render the launcher on the login page — feels spammy.
  if (pathname?.startsWith('/login')) return null;

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userTurn: ChatTurn = { role: 'user', content: trimmed };
    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    const result = await smartAssistantReply({ messages: nextHistory, pagePath: pathname ?? undefined });
    setSending(false);

    if (result.error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.error ?? 'Something went wrong.' },
      ]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    }
  }

  function reset() {
    setMessages([INITIAL_GREETING]);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  const greeting =
    profile?.role === 'seller'
      ? "Selling? I can help you write competitive bids or set up inventory for instant match alerts."
      : "Looking to buy? I can sharpen your request so sellers can bid faster and better.";

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Smart Assistant"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 999,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #e2117e 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            padding: '0.9rem 1.2rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
            fontWeight: 600,
          }}
        >
          <Sparkles size={18} />
          <span style={{ fontSize: '0.95rem' }}>Smart Assistant</span>
        </button>
      )}

      {/* Slide-in panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 999,
            width: 'min(92vw, 400px)',
            height: 'min(76vh, 600px)',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.2rem',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #8b5cf6 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.18)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Smart Assistant</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Powered by Claude</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.3rem' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body / messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#fafafa' }}>
            {messages.length === 1 && user && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '0.5rem 1rem 1rem',
                }}
              >
                {greeting}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  marginBottom: '0.7rem',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.7rem 0.95rem',
                    borderRadius:
                      m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? '#1e3a5f' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#1a2238',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', padding: '0.4rem 0.2rem', fontSize: '0.85rem' }}>
                <Loader2 size={14} className="spin" /> thinking…
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '0.7rem',
              background: '#fff',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Surcal..."
              style={{
                flex: 1,
                padding: '0.7rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: '0.92rem',
                outline: 'none',
                background: '#fafafa',
              }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #e2117e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: sending || input.trim().length === 0 ? 'not-allowed' : 'pointer',
                opacity: sending || input.trim().length === 0 ? 0.6 : 1,
              }}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={reset}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'center',
                borderTop: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              Clear conversation
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
