'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
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

export default function NotificationsPage() {
  const { user, supabase } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!cancelled) {
        setItems((data as NotificationRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase, router]);

  async function markAllRead() {
    if (!user) return;
    const unread = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unread);
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(30, 58, 95, 0.08)',
                color: 'var(--primary-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={22} />
            </div>
            <div>
              <h1 className="heading-lg" style={{ margin: 0 }}>Notifications</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {unreadCount === 0 ? 'All caught up.' : `${unreadCount} unread`}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="button-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Inbox size={48} color="var(--primary-navy)" style={{ opacity: 0.25, marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Nothing here yet</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You'll see matches, offers, and order updates here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {items.map((n) => {
              const card = (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.1rem 1.3rem',
                    background: n.is_read ? 'var(--bg-surface, #fff)' : 'rgba(226, 17, 126, 0.05)',
                    borderLeft: n.is_read ? '4px solid transparent' : '4px solid var(--primary-magenta, #e2117e)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>{n.title}</div>
                      {n.body && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>{n.body}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(n.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );

              if (n.link) {
                return (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => markOneRead(n.id)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {card}
                  </Link>
                );
              }
              return (
                <div key={n.id} onClick={() => markOneRead(n.id)}>
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
