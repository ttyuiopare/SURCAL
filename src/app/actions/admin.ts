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

/** Permanently deletes the auth user + cascades the profile row. */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const callerId = await requireAdmin();
    if (callerId === userId) return { ok: false, error: 'You cannot delete yourself.' };
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Delete failed' };
  }
}
