import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as any,
    });

    const { bidId, title, price, requestId, shippingAddress } = await req.json();

    if (!bidId || !price) {
      return NextResponse.json({ error: 'Missing bid details' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get the seller ID from the bid
    const { data: bid, error: bidError } = await adminClient
      .from('bids')
      .select('seller_id')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Get the seller's Stripe account ID
    const { data: sellerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', bid.seller_id)
      .single();

    if (profileError || !sellerProfile?.stripe_account_id) {
      return NextResponse.json({ error: 'Seller has not set up Stripe Connect' }, { status: 400 });
    }

    const sellerStripeAccountId = sellerProfile.stripe_account_id;

    // Platform fee calculation (5%)
    const amountInCents = Math.round(price * 100);
    const platformFee = Math.round(amountInCents * 0.05);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Services for: ${title}`,
              description: `Payment for accepted bid on Surcal.`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual', // Hold funds in Escrow
        transfer_data: {
          destination: sellerStripeAccountId,
        },
        application_fee_amount: platformFee, // 5% fee
      },
      success_url: `${req.headers.get('origin')}/requests/${requestId}?success=true&bid=${bidId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/requests/${requestId}?canceled=true`,
      metadata: {
        bidId: bidId,
        requestId: requestId,
        sellerId: bid.seller_id,
        // JSON-stringified buyer shipping address. Stripe metadata values
        // are capped at 500 chars; a typical address fits comfortably.
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress).slice(0, 480) : '',
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
