'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

type ActionResult = { ok: true } | { ok: false; error: string };

/** Resolves the signed-in caller and whether they're an admin. Throws if not signed in. */
async function getCaller(): Promise<{ userId: string; isAdmin: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return { userId: user.id, isAdmin: !!profile?.is_admin };
}

/** Deletes rows, tolerating "table doesn't exist" so schema drift doesn't block us. */
async function safeDelete(run: () => PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await run();
  if (error && !/relation .* does not exist|table .* does not exist/i.test(error.message)) {
    throw new Error(error.message);
  }
}

/**
 * Deletes a request. Allowed for the request's owner (buyer) or any admin.
 * Non-admins cannot delete a request that already has a funded order.
 * Removes dependent bids/messages (and transactions, for admins) first, since
 * the schema doesn't cascade.
 */
export async function deleteRequest(requestId: string): Promise<ActionResult> {
  try {
    if (!requestId) return { ok: false, error: 'Missing request id.' };
    const { userId, isAdmin } = await getCaller();
    const admin = createAdminClient();

    const { data: req, error: reqErr } = await admin
      .from('requests')
      .select('id, buyer_id')
      .eq('id', requestId)
      .maybeSingle();
    if (reqErr) return { ok: false, error: reqErr.message };
    if (!req) return { ok: false, error: 'Request not found.' };

    if (!isAdmin && req.buyer_id !== userId) {
      return { ok: false, error: 'You can only delete your own requests.' };
    }

    const { data: tx } = await admin
      .from('transactions')
      .select('id')
      .eq('request_id', requestId)
      .maybeSingle();
    if (tx && !isAdmin) {
      return {
        ok: false,
        error: 'This request already has an active order, so it can’t be deleted. Contact support.',
      };
    }

    await safeDelete(() => admin.from('bids').delete().eq('request_id', requestId));
    await safeDelete(() => admin.from('messages').delete().eq('request_id', requestId));
    if (isAdmin) {
      await safeDelete(() => admin.from('transactions').delete().eq('request_id', requestId));
    }

    const { error: delErr } = await admin.from('requests').delete().eq('id', requestId);
    if (delErr) return { ok: false, error: delErr.message };

    revalidatePath('/buyer/my-requests');
    revalidatePath('/requests');
    revalidatePath('/admin/content');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Delete failed' };
  }
}

/**
 * Deletes a bid. Allowed for the bid's owner (seller) or any admin.
 * Non-admins cannot withdraw a bid that has already been accepted.
 */
export async function deleteBid(bidId: string): Promise<ActionResult> {
  try {
    if (!bidId) return { ok: false, error: 'Missing bid id.' };
    const { userId, isAdmin } = await getCaller();
    const admin = createAdminClient();

    const { data: bid, error: bidErr } = await admin
      .from('bids')
      .select('id, seller_id, status')
      .eq('id', bidId)
      .maybeSingle();
    if (bidErr) return { ok: false, error: bidErr.message };
    if (!bid) return { ok: false, error: 'Offer not found.' };

    if (!isAdmin && bid.seller_id !== userId) {
      return { ok: false, error: 'You can only remove your own offers.' };
    }
    if (bid.status === 'accepted' && !isAdmin) {
      return {
        ok: false,
        error: 'This offer was already accepted and can’t be withdrawn. Contact support.',
      };
    }

    const { error: delErr } = await admin.from('bids').delete().eq('id', bidId);
    if (delErr) return { ok: false, error: delErr.message };

    revalidatePath('/seller/offers');
    revalidatePath('/buyer/offers');
    revalidatePath('/admin/content');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Remove failed' };
  }
}
