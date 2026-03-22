import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: transaction } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
       return NextResponse.json({ error: 'Invalid transaction' }, { status: 403 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    
    // Capture the payment intent (funds move from buyer card authorization -> platform balance)
    if (transaction.stripe_payment_intent_id) {
      await stripe.paymentIntents.capture(transaction.stripe_payment_intent_id);
    }

    // Update DB
    await supabase.from('transactions').update({ status: 'released' }).eq('id', transactionId);
    await supabase.from('requests').update({ status: 'closed' }).eq('id', transaction.request_id);
    
    // Note: To wire to a specific seller's bank account, a Stripe Transfer to a Connect Account would go here.
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
