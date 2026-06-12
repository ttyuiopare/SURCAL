import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';

export async function POST(req: Request) {
  try {
    const { sessionId, bidId, requestId } = await req.json();
    if (!sessionId || !bidId || !requestId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Auth check — only a signed-in user can record their own escrow.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'unpaid' && session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    // Use the admin client for the rest: transactions has no client INSERT
    // policy, so the user-session client would be silently blocked by RLS.
    const admin = createAdminClient();

    const { data: bid, error: bidErr } = await admin
      .from('bids')
      .select('seller_id, price')
      .eq('id', bidId)
      .single();
    const { data: reqData, error: reqErr } = await admin
      .from('requests')
      .select('buyer_id')
      .eq('id', requestId)
      .single();

    if (bidErr || reqErr || !bid || !reqData) {
      return NextResponse.json({ error: 'Bid or request not found' }, { status: 404 });
    }

    // Authorize: only the buyer of the request can record escrow for it.
    if (reqData.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Idempotency — don't double-insert if the webhook already did it.
    const paymentIntentId = session.payment_intent as string;
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyRecorded: true });
    }

    // Parse shipping address from Stripe metadata.
    let shippingAddress: unknown = null;
    const rawAddr = session.metadata?.shippingAddress;
    if (rawAddr) {
      try { shippingAddress = JSON.parse(rawAddr); } catch { /* ignore malformed */ }
    }

    const { error: txErr } = await admin.from('transactions').insert([
      {
        request_id: requestId,
        bid_id: bidId,
        buyer_id: reqData.buyer_id,
        seller_id: bid.seller_id,
        amount: bid.price,
        stripe_payment_intent_id: paymentIntentId,
        status: 'escrow',
        shipping_address: shippingAddress,
      },
    ]);

    if (txErr) {
      console.error('[escrow/record] insert failed:', txErr);
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    await admin.from('bids').update({ status: 'accepted' }).eq('id', bidId);
    await admin.from('requests').update({ status: 'in_progress' }).eq('id', requestId);

    await postSystemMessage({
      requestId,
      senderId: reqData.buyer_id,
      receiverId: bid.seller_id,
      content: `💳 Buyer funded escrow for $${bid.price}. Funds are now held safely — ship to deliver.`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[escrow/record] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
