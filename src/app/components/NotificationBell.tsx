'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const { user, supabase } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  // Initial load + realtime subscription.
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      if (!cancelled && data) setItems(data as NotificationRow[]);
    })();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new as NotificationRow, ...prev].slice(0, 15));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as NotificationRow;
          setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!user) return null;

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '0.4rem',
          cursor: 'pointer',
          position: 'relative',
          color: 'var(--primary-navy)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: 'translate(35%, -35%)',
              background: 'var(--primary-magenta, #e2117e)',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '0.65rem',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.5rem)',
            width: '360px',
            maxHeight: '520px',
            overflow: 'hidden',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '0.9rem 1rem',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-magenta, #e2117e)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '2rem 1rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                You're all caught up.
              </div>
            ) : (
              items.map((n) => {
                const content = (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: n.is_read ? 'transparent' : 'rgba(226, 17, 126, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                      cursor: n.link ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary-navy)' }}>
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '999px',
                            background: 'var(--primary-magenta, #e2117e)',
                            flexShrink: 0,
                            marginTop: '0.4rem',
                          }}
                        />
                      )}
                    </div>
                    {n.body && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.body}</span>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.75 }}>
                      {new Date(n.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        markOneRead(n.id);
                        setOpen(false);
                      }}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      {content}
                    </Link>
                  );
                }
                return <div key={n.id} onClick={() => markOneRead(n.id)}>{content}</div>;
              })
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            style={{
              padding: '0.7rem 1rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary-navy)',
              textDecoration: 'none',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              background: 'rgba(0,0,0,0.02)',
            }}
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
