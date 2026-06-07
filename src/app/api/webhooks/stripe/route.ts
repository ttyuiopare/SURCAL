import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

// Stripe webhooks require the raw request body to validate the signature.
// next/server's Request gives us req.text() which is exactly that.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !endpointSecret) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' as any });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const adminClient = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        if (!metadata.bidId || !metadata.requestId || !paymentIntentId) {
          // Not one of our checkout flows; nothing to do.
          break;
        }

        // Idempotency: Stripe retries webhooks on non-2xx, and the success-page
        // redirect (/api/escrow/record) may also have written this transaction.
        const { data: existing } = await adminClient
          .from('transactions')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (existing) {
          break;
        }

        // Look up the buyer + seller so we can persist them on the transaction.
        const [{ data: bid }, { data: request }] = await Promise.all([
          adminClient.from('bids').select('seller_id, price').eq('id', metadata.bidId).single(),
          adminClient.from('requests').select('buyer_id').eq('id', metadata.requestId).single(),
        ]);

        if (!bid || !request) {
          console.error('[stripe-webhook] bid or request missing for session', session.id);
          break;
        }

        let shippingAddress: unknown = null;
        if (metadata.shippingAddress) {
          try { shippingAddress = JSON.parse(metadata.shippingAddress); } catch { /* ignore malformed */ }
        }

        await adminClient.from('transactions').insert([
          {
            request_id: metadata.requestId,
            bid_id: metadata.bidId,
            buyer_id: request.buyer_id,
            seller_id: bid.seller_id,
            amount: (session.amount_total ?? Math.round(Number(bid.price) * 100)) / 100,
            stripe_payment_intent_id: paymentIntentId,
            status: 'escrow',
            shipping_address: shippingAddress,
          },
        ]);

        await adminClient.from('bids').update({ status: 'accepted' }).eq('id', metadata.bidId);
        await adminClient.from('requests').update({ status: 'in_progress' }).eq('id', metadata.requestId);

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[stripe-webhook] Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('[stripe-webhook] Payout paid to connected account:', payout.id);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.details_submitted) {
          // Mark both flags: stripe_onboarding_complete gates platform access,
          // is_verified drives the "Verified Seller" badge.
          await adminClient
            .from('profiles')
            .update({ stripe_onboarding_complete: true, is_verified: true })
            .eq('stripe_account_id', account.id);
        }
        break;
      }

      default:
        // No-op for events we don't care about. Always 200 so Stripe stops retrying.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[stripe-webhook] handler error:', err);
    // Return 500 so Stripe retries — but only for our own DB/runtime failures,
    // not for unknown event types (handled above).
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
