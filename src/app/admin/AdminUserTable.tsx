'use client';

import React, { useState, useTransition } from 'react';
import { Ban, UserX, ShieldCheck, ShieldOff, Trash2, RotateCcw, MoreVertical } from 'lucide-react';
import { banUser, unbanUser, kickUser, setAdmin, deleteUser } from '../actions/admin';

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_admin: boolean;
  banned_at: string | null;
  is_verified: boolean | null;
  created_at: string;
};

export default function AdminUserTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  function runAction(userId: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(userId);
    setError('');
    startTransition(async () => {
      const result = await fn();
      if (!result.ok && result.error) setError(result.error);
      setBusyId(null);
    });
  }

  function confirmAction(message: string, fn: () => void) {
    if (confirm(message)) fn();
  }

  if (users.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No users found.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ padding: '0.9rem 1rem', background: 'rgba(231,76,60,0.1)', color: 'var(--danger-red, #e74c3c)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Joined</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const banned = !!u.banned_at;
              const rowBusy = pending && busyId === u.id;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', opacity: banned ? 0.65 : 1 }}>
                  <Td>
                    <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                      {u.name || '(no name)'}
                      {isSelf && <Pill color="var(--primary-magenta, #e2117e)">you</Pill>}
                      {u.is_admin && <Pill color="var(--ai-purple, #8b5cf6)">admin</Pill>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </Td>
                  <Td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{u.role || '—'}</span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </Td>
                  <Td>
                    {banned ? (
                      <Pill color="var(--danger-red, #e74c3c)" filled>
                        banned
                      </Pill>
                    ) : u.is_verified ? (
                      <Pill color="var(--success-green, #1d9e75)" filled>
                        verified
                      </Pill>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {!isSelf && !banned && (
                        <ActionButton
                          tone="warning"
                          title="Kick (force sign-out)"
                          disabled={rowBusy}
                          onClick={() =>
                            confirmAction(
                              `Kick "${u.name || u.email}"? They'll be signed out everywhere but can sign back in.`,
                              () => runAction(u.id, () => kickUser(u.id))
                            )
                          }
                        >
                          <UserX size={14} /> Kick
                        </ActionButton>
                      )}
                      {!isSelf && !banned && (
                        <ActionButton
                          tone="danger"
                          title="Ban this user"
                          disabled={rowBusy}
                          onClick={() =>
                            confirmAction(
                              `Ban "${u.name || u.email}"? They will be signed out and can't sign in until you unban.`,
                              () => runAction(u.id, () => banUser(u.id))
                            )
                          }
                        >
                          <Ban size={14} /> Ban
                        </ActionButton>
                      )}
                      {!isSelf && banned && (
                        <ActionButton
                          tone="success"
                          title="Restore access"
                          disabled={rowBusy}
                          onClick={() => runAction(u.id, () => unbanUser(u.id))}
                        >
                          <RotateCcw size={14} /> Unban
                        </ActionButton>
                      )}
                      {!isSelf && (
                        <ActionButton
                          tone="muted"
                          title={u.is_admin ? 'Demote from admin' : 'Promote to admin'}
                          disabled={rowBusy}
                          onClick={() =>
                            confirmAction(
                              u.is_admin
                                ? `Demote "${u.name || u.email}" from admin?`
                                : `Promote "${u.name || u.email}" to admin? They will be able to ban/kick other users.`,
                              () => runAction(u.id, () => setAdmin(u.id, !u.is_admin))
                            )
                          }
                        >
                          {u.is_admin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                          {u.is_admin ? 'Demote' : 'Promote'}
                        </ActionButton>
                      )}
                      {!isSelf && (
                        <ActionButton
                          tone="ghost-danger"
                          title="Permanently delete this account"
                          disabled={rowBusy}
                          onClick={() =>
                            confirmAction(
                              `PERMANENTLY DELETE "${u.name || u.email}"? This wipes their auth user and cascades the profile row. Cannot be undone.`,
                              () => runAction(u.id, () => deleteUser(u.id))
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </ActionButton>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        padding: '0.8rem 1rem',
        textAlign: align ?? 'left',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', textAlign: align ?? 'left' }}>{children}</td>
  );
}

function Pill({
  children,
  color,
  filled,
}: {
  children: React.ReactNode;
  color: string;
  filled?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '0.4rem',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        background: filled ? color : `${color}1a`,
        color: filled ? '#fff' : color,
        border: `1px solid ${color}33`,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: 'warning' | 'danger' | 'success' | 'muted' | 'ghost-danger';
  title?: string;
}) {
  const tones: Record<typeof tone, React.CSSProperties> = {
    warning: { background: 'rgba(230,126,34,0.08)', color: '#d96f00', border: '1px solid rgba(230,126,34,0.25)' },
    danger:  { background: 'rgba(231,76,60,0.08)', color: 'var(--danger-red, #e74c3c)', border: '1px solid rgba(231,76,60,0.25)' },
    success: { background: 'rgba(29,158,117,0.08)', color: 'var(--success-green, #1d9e75)', border: '1px solid rgba(29,158,117,0.25)' },
    muted:   { background: 'rgba(0,0,0,0.04)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.08)' },
    'ghost-danger': { background: 'transparent', color: 'var(--danger-red, #e74c3c)', border: '1px solid rgba(231,76,60,0.15)' },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...tones[tone],
        padding: '0.4rem 0.65rem',
        borderRadius: '8px',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: disabled ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
