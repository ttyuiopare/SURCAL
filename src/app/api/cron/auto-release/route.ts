import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';
import { sendEmailNotification } from '@/utils/notifications';

export const dynamic = 'force-dynamic';

/**
 * Auto-releases escrow for shipped orders whose confirmation window has passed.
 *
 * Called by Vercel Cron (see vercel.json). Vercel includes
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project
 * env, which we verify below so nobody else can trigger releases.
 *
 * Window length: AUTO_RELEASE_DAYS (default 7 days after shipping).
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = Number(process.env.AUTO_RELEASE_DAYS ?? 7);
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

  const admin = createAdminClient();
  const { data: due, error } = await admin
    .from('transactions')
    .select('*')
    .eq('status', 'shipped')
    .not('tracking_number', 'is', null)
    .not('shipped_at', 'is', null)
    .lt('shipped_at', cutoff);

  if (error) {
    console.error('[auto-release] query failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const tx of due ?? []) {
    try {
      // Capturing the payment intent (created with transfer_data) pays the seller.
      if (tx.stripe_payment_intent_id) {
        await stripe.paymentIntents.capture(tx.stripe_payment_intent_id);
      }
      await admin.from('transactions').update({ status: 'released' }).eq('id', tx.id);
      await admin.from('requests').update({ status: 'closed' }).eq('id', tx.request_id);

      await postSystemMessage({
        requestId: tx.request_id,
        senderId: tx.buyer_id,
        receiverId: tx.seller_id,
        content: `⏱️ Auto-released: the ${days}-day confirmation window passed after shipping, so $${tx.amount} was released from escrow to the seller. Order complete.`,
      }).catch(() => {});
      await sendEmailNotification(
        tx.buyer_id,
        'Your order was auto-completed',
        `Your order was automatically completed ${days} days after it shipped, and payment was released to the seller. If something went wrong, contact support.`
      ).catch(() => {});

      results.push({ id: tx.id, ok: true });
    } catch (err: any) {
      console.error('[auto-release] failed for', tx.id, err?.message);
      results.push({ id: tx.id, ok: false, error: err?.message });
    }
  }

  return NextResponse.json({
    checked: (due ?? []).length,
    released: results.filter((r) => r.ok).length,
    results,
  });
}
