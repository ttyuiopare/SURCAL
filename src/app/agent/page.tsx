'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Send, Bot } from 'lucide-react';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; created_at: string };

// Owner-only chat with the PC-side agent. Messages flow: this page inserts a
// `user` row; the bridge service on the owner's computer runs the OpenClaw
// agent on it and writes back an `assistant` row, which we pick up by polling.
export default function AgentPage() {
  const { user, profile, supabase } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOwner = !!profile?.is_admin;

  const fetchMessages = useCallback(async () => {
    if (!user || !isOwner) return;
    const { data } = await supabase
      .from('agent_messages')
      .select('id, role, content, created_at')
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as Msg[]);
    setLoaded(true);
  }, [user, isOwner, supabase]);

  useEffect(() => {
    if (!user) return;
    if (!profile) return; // still loading — wait until we know ownership
    if (!isOwner) {
      setLoaded(true);
      return;
    }
    fetchMessages();
    const t = setInterval(fetchMessages, 3000);
    return () => clearInterval(t);
  }, [user, profile, isOwner, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user || !isOwner) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    const { data, error } = await supabase
      .from('agent_messages')
      .insert({ user_id: user.id, role: 'user', content })
      .select('id, role, content, created_at')
      .single();
    if (!error && data) setMessages((prev) => [...prev, data as Msg]);
    if (error) alert('Could not send: ' + error.message);
    setSending(false);
  }

  if (!user || !profile || !loaded) {
    return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading…</div>;
  }

  if (!isOwner) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        This page is private.
      </div>
    );
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';
  const working = lastIsUser && !sending ? true : false; // agent still composing

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <header style={{ padding: '1rem var(--container-padding)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Bot size={22} color="var(--primary-magenta)" />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>PC Agent</div>
          <div style={{ fontSize: '0.75rem', color: working ? 'var(--success-green)' : 'var(--text-secondary)' }}>
            {working ? 'working…' : 'connected to your computer'}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem var(--container-padding)', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem', fontSize: '0.95rem' }}>
            Text instructions for the agent on your PC — e.g. “check the surcal repo, run the tests, fix anything broken and push”.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                ...(m.role === 'user'
                  ? { background: 'var(--primary-magenta)', color: '#fff', borderBottomRightRadius: '4px' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderBottomLeftRadius: '4px' }),
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {working && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>agent is working…</div>
        )}
        <div ref={bottomRef} />
      </main>

      <form onSubmit={send} style={{ padding: '1rem var(--container-padding)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem', maxWidth: '800px', width: '100%', margin: '0 auto', background: 'var(--bg-color)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your agent…"
          style={{ flex: 1, padding: '0.9rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '24px', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
        />
        <button type="submit" className="button-primary" disabled={sending || !input.trim()} style={{ borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: !input.trim() ? 0.5 : 1 }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
