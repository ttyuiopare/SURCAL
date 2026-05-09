import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

// Stripe requires the raw body to construct the event
// Next.js app router automatically parses the body, but Stripe requires the raw buffer.
// Alternatively, we can use req.text() to get the raw body.
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const adminClient = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // This means the buyer successfully placed a hold on their card
        const metadata = session.metadata;
        if (metadata && metadata.bidId && metadata.requestId) {
          // Update transaction or bid status to "escrow funded"
          console.log('Escrow funded for bid:', metadata.bidId);
          
          await adminClient
            .from('transactions')
            .insert([
              {
                request_id: metadata.requestId,
                bid_id: metadata.bidId,
                amount: (session.amount_total || 0) / 100,
                stripe_payment_intent_id: session.payment_intent,
                status: 'escrow'
              }
            ]);
        }
        break;
      }
      
      // When the funds are released from Escrow (Capture Payment Intent)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        break;
      }

      // Handle payout to seller connected account
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout paid to connected account:', payout.id);
        break;
      }
      
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled) {
           await adminClient
            .from('profiles')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
