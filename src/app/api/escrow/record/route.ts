import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { sessionId, bidId, requestId } = await req.json();
    if (!sessionId || !bidId || !requestId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'unpaid' && session.payment_status !== 'paid') {
       return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: bid } = await supabase.from('bids').select('seller_id, price').eq('id', bidId).single();
    const { data: reqData } = await supabase.from('requests').select('buyer_id').eq('id', requestId).single();

    if (bid && reqData) {
      const { data: existing } = await supabase.from('transactions').select('id').eq('stripe_payment_intent_id', session.payment_intent as string).single();
      
      if (!existing) {
        await supabase.from('transactions').insert([{
          request_id: requestId,
          bid_id: bidId,
          buyer_id: reqData.buyer_id,
          seller_id: bid.seller_id,
          amount: bid.price,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'escrow'
        }]);
        
        await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
        await supabase.from('requests').update({ status: 'in_progress' }).eq('id', requestId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
