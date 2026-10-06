import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';
import { sendEmailNotification } from '@/utils/notifications';
import { sendEmail } from '@/utils/email';

export const dynamic = 'force-dynamic';

/**
 * Ship-deadline watchdog: buyers pay into escrow, sellers must ship within
 * SHIP_DEADLINE_DAYS (default 3). Run daily by Vercel Cron (see vercel.json):
 *
 *  - 24h before the deadline (2 days after payment) the seller gets one
 *    warning email ("ship within 24 hours or the order auto-refunds").
 *  - Past the deadline with no shipment, the uncaptured payment intent is
 *    cancelled — the buyer was never actually charged, so "refund" here is a
 *    void of the authorization — and both sides are notified. The request
 *    re-opens and the bid returns to pending so the buyer can pick another
 *    offer.
 *
 * Column ship_reminder_sent_at (migration 23) makes the warning fire exactly
 * once per order even if a cron run is missed.
 */
const TX_SELECT =
  'id, request_id, bid_id, buyer_id, seller_id, amount, stripe_payment_intent_id, created_at, ship_reminder_sent_at, requests(title), buyer:profiles!transactions_buyer_id_fkey(name, email), seller:profiles!transactions_seller_id_fkey(name, email)';


// PostgREST types the embedded request row loosely; accept object or array.
function txTitle(tx: any): string {
  const r = tx.requests;
  const t = Array.isArray(r) ? r[0]?.title : r?.title;
  return t ?? 'your order';
}

// Embedded rows can be typed as object or array depending on inference.
function party(p: any): { name?: string; email?: string } | null {
  return Array.isArray(p) ? p[0] ?? null : p ?? null;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = Number(process.env.SHIP_DEADLINE_DAYS ?? 3);
  const now = Date.now();
  const refundCutoff = new Date(now - days * 86_400_000).toISOString();
  const reminderCutoff = new Date(now - (days - 1) * 86_400_000).toISOString();

  const admin = createAdminClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });

  const baseQuery = () =>
    admin
      .from('transactions')
      .select(TX_SELECT)
      .eq('status', 'escrow')
      .is('shipped_at', null);

  // --- 1. 24-hour warnings ----------------------------------------------------
  const { data: dueWarning, error: warnErr } = await baseQuery()
    .lt('created_at', reminderCutoff)
    .gte('created_at', refundCutoff)
    .is('ship_reminder_sent_at', null);

  if (warnErr) {
    console.error('[ship-deadline] warning query failed:', warnErr.message);
    return NextResponse.json({ error: warnErr.message }, { status: 500 });
  }

  let warned = 0;
  for (const tx of dueWarning ?? []) {
    try {
      await sendEmailNotification(
        tx.seller_id,
        '⏰ 24 hours left to ship — or the order auto-refunds',
        `The buyer paid for "${txTitle(tx)}" 2 days ago and it hasn't shipped yet. You have 24 hours to add tracking and mark it shipped, otherwise the order is automatically refunded and the sale is cancelled.`
      ).catch(() => {});
      const warnSellerEmail = party(tx.seller)?.email;
      if (warnSellerEmail) {
        await sendEmail({
          to: warnSellerEmail,
          subject: `⏰ Ship "${txTitle(tx)}" within 24 hours or it auto-refunds`,
          text: `Hi ${party(tx.seller)?.name ?? 'there'},\n\nThe buyer already paid into escrow for "${txTitle(tx)}", but it hasn't shipped after 2 days.\n\nYou have 24 hours to add tracking and mark the order shipped — otherwise the payment is automatically cancelled and the buyer refunded, and the sale is lost.\n\n— The Surcal Team`,
        }).catch(() => {});
      }
      await admin
        .from('transactions')
        .update({ ship_reminder_sent_at: new Date().toISOString() })
        .eq('id', tx.id);
      warned++;
    } catch (err: any) {
      console.error('[ship-deadline] warning failed for', tx.id, err?.message);
    }
  }

  // --- 2. Past the deadline: void the escrow and refund -----------------------
  const { data: due, error: refundErr } = await baseQuery().lt('created_at', refundCutoff);

  if (refundErr) {
    console.error('[ship-deadline] refund query failed:', refundErr.message);
    return NextResponse.json({ error: refundErr.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const tx of due ?? []) {
    try {
      // The payment intent was created manual-capture, so "refund" = cancel
      // the authorization: the buyer is never charged and no fees move.
      if (tx.stripe_payment_intent_id) {
        try {
          await stripe.paymentIntents.cancel(tx.stripe_payment_intent_id);
        } catch (cancelErr: any) {
          // Already expired/cancelled is fine — nothing can be captured anyway.
          if (!/already|expired|cannot/i.test(cancelErr.message ?? '')) throw cancelErr;
        }
      }

      await admin.from('transactions').update({ status: 'refunded' }).eq('id', tx.id);
      // Give the buyer their options back: re-open the request and un-accept
      // the winning bid so they can pick another offer.
      await admin.from('requests').update({ status: 'open' }).eq('id', tx.request_id);
      if (tx.bid_id) {
        await admin.from('bids').update({ status: 'pending' }).eq('id', tx.bid_id);
      }

      const title = txTitle(tx);
      await postSystemMessage({
        requestId: tx.request_id,
        senderId: tx.buyer_id,
        receiverId: tx.seller_id,
        content: `↩️ Auto-refunded: the order wasn't shipped within ${days} days of payment, so the escrow payment was cancelled and the buyer's money released back. The request is open again.`,
      }).catch(() => {});
      await sendEmailNotification(
        tx.buyer_id,
        'Your order was auto-refunded',
        `The seller didn't ship "${title}" within ${days} days, so your payment was cancelled and you were not charged. The request is open again — you can accept another offer or post a new one.`
      ).catch(() => {});
      await sendEmailNotification(
        tx.seller_id,
        'Order auto-refunded — shipment window missed',
        `The order "${title}" was auto-refunded because it wasn't shipped within ${days} days of payment. The buyer's authorization was cancelled before any money moved.`
      ).catch(() => {});

      const buyerEmail = party(tx.buyer)?.email;
      if (buyerEmail) {
        sendEmail({
          to: buyerEmail,
          subject: `Refunded: "${title}" wasn't shipped in time`,
          text: `Hi ${party(tx.buyer)?.name ?? 'there'},\n\nThe seller didn't ship "${title}" within ${days} days of your payment, so the escrow payment was cancelled — you were never charged.\n\nYour request is open again on Surcal, and other sellers can still send offers.\n\n— The Surcal Team`,
        }).catch(() => {});
      }
      const sellerEmail = party(tx.seller)?.email;
      if (sellerEmail) {
        sendEmail({
          to: sellerEmail,
          subject: `Order auto-refunded: "${title}"`,
          text: `Hi ${party(tx.seller)?.name ?? 'there'},\n\nThe order "${title}" was cancelled and the buyer auto-refunded because it wasn't shipped within ${days} days of payment.\n\nFast shipping keeps buyers (and their money) on Surcal — future orders auto-refund the same way if tracking isn't added in time.\n\n— The Surcal Team`,
        }).catch(() => {});
      }

      results.push({ id: tx.id, ok: true });
    } catch (err: any) {
      console.error('[ship-deadline] refund failed for', tx.id, err?.message);
      results.push({ id: tx.id, ok: false, error: err?.message });
    }
  }

  return NextResponse.json({
    warned,
    checked: (due ?? []).length,
    refunded: results.filter((r) => r.ok).length,
    results,
  });
}
