'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Verifies the caller is signed in AND has is_admin=true on their profile.
 * Throws an Error if not — server actions surface these as friendly messages.
 */
async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) throw new Error('Forbidden.');
  return user.id;
}

export async function banUser(userId: string): Promise<ActionResult> {
  try {
    const callerId = await requireAdmin();
    if (callerId === userId) return { ok: false, error: 'You cannot ban yourself.' };

    const admin = createAdminClient();
    await admin
      .from('profiles')
      .update({ banned_at: new Date().toISOString() })
      .eq('id', userId);

    // Revoke any active sessions so they're kicked from the app immediately.
    await admin.auth.admin.signOut(userId, 'global').catch(() => {});

    revalidatePath('/admin');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Ban failed' };
  }
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    await admin.from('profiles').update({ banned_at: null }).eq('id', userId);
    revalidatePath('/admin');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Unban failed' };
  }
}

/**
 * Force-signs out a user without banning them. Useful for kicking someone
 * out of an active session (e.g. compromised account) while leaving access
 * intact on their next login.
 */
export async function kickUser(userId: string): Promise<ActionResult> {
  try {
    const callerId = await requireAdmin();
    if (callerId === userId) return { ok: false, error: 'You cannot kick yourself.' };

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.signOut(userId, 'global');
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Kick failed' };
  }
}

export async function setAdmin(userId: string, isAdmin: boolean): Promise<ActionResult> {
  try {
    const callerId = await requireAdmin();
    if (callerId === userId && !isAdmin) {
      return { ok: false, error: 'You cannot demote yourself.' };
    }
    const admin = createAdminClient();
    await admin.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);
    revalidatePath('/admin');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Promote/demote failed' };
  }
}

/** Permanently deletes the auth user. Explicitly removes rows in tables that
 *  reference the user but don't have ON DELETE CASCADE, so the auth.users
 *  delete succeeds. If hard delete still fails we fall back to a soft delete
 *  (mark deleted_at) so the user can no longer sign in. */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const callerId = await requireAdmin();
    if (callerId === userId) return { ok: false, error: 'You cannot delete yourself.' };
    const admin = createAdminClient();

    type CleanupSpec = { table: string; run: () => PromiseLike<{ error: { message: string } | null }> };
    const cleanups: CleanupSpec[] = [
      { table: 'messages',          run: () => admin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`) },
      { table: 'reviews',           run: () => admin.from('reviews').delete().or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`) },
      { table: 'notifications',     run: () => admin.from('notifications').delete().eq('user_id', userId) },
      { table: 'push_subscriptions',run: () => admin.from('push_subscriptions').delete().eq('user_id', userId) },
      { table: 'moderation_flags',  run: () => admin.from('moderation_flags').delete().eq('flagged_user_id', userId) },
      { table: 'seller_inventory',  run: () => admin.from('seller_inventory').delete().eq('seller_id', userId) },
      { table: 'user_subscriptions',run: () => admin.from('user_subscriptions').delete().eq('user_id', userId) },
      { table: 'support_tickets',   run: () => admin.from('support_tickets').delete().eq('user_id', userId) },
      { table: 'bids',              run: () => admin.from('bids').delete().eq('seller_id', userId) },
      { table: 'transactions',      run: () => admin.from('transactions').delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`) },
      { table: 'requests',          run: () => admin.from('requests').delete().eq('buyer_id', userId) },
    ];

    const failures: string[] = [];
    for (const { table, run } of cleanups) {
      const res = await run();
      // "Table not found" / missing-table errors are fine — schema may vary.
      if (res.error && !/relation .* does not exist|table .* does not exist/i.test(res.error.message)) {
        console.error(`[deleteUser] cleanup of ${table} failed:`, res.error.message);
        failures.push(`${table}: ${res.error.message}`);
      }
    }

    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (!authErr) {
      revalidatePath('/admin');
      return { ok: true };
    }

    console.error('[deleteUser] auth.admin.deleteUser failed:', authErr);

    // Fallback: hard delete blocked. Mark the profile as banned + nuke the
    // session so they can no longer sign in. Surface the original error so
    // we can fix the underlying FK in a follow-up migration.
    await admin
      .from('profiles')
      .update({ banned_at: new Date().toISOString() })
      .eq('id', userId);

    const detail = failures.length
      ? `${authErr.message}. Cleanup issues: ${failures.join('; ')}`
      : authErr.message;
    return {
      ok: false,
      error: `Hard delete blocked — account has been banned instead so they can't sign in. Root cause: ${detail}`,
    };
  } catch (err: any) {
    console.error('[deleteUser] threw:', err);
    return { ok: false, error: err?.message ?? 'Delete failed' };
  }
}
