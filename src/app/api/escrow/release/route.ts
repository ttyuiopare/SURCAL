import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    
    // Ensure the caller is an authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();

    // Skip RLS using admin root client to fetch/update transaction
    const { data: transaction } = await adminClient
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
       return NextResponse.json({ error: 'Invalid transaction' }, { status: 403 });
    }

    if (transaction.status !== 'escrow') {
      return NextResponse.json({ error: 'Transaction is not in escrow' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    
    // Capture the payment intent (because it was created with transfer_data, this automatically transfers funds to the Connect Account)
    if (transaction.stripe_payment_intent_id) {
      await stripe.paymentIntents.capture(transaction.stripe_payment_intent_id);
    }

    // Update DB securely bypassing RLS
    await adminClient.from('transactions').update({ status: 'released' }).eq('id', transactionId);
    await adminClient.from('requests').update({ status: 'closed' }).eq('id', transaction.request_id);

    await postSystemMessage({
      requestId: transaction.request_id,
      senderId: transaction.buyer_id,
      receiverId: transaction.seller_id,
      content: `🎉 Buyer confirmed delivery — $${transaction.amount} released from escrow to the seller. Order complete.`,
    });

    return NextResponse.json({ success: true, status: 'released' });
  } catch (err: any) {
    console.error('Escrow Release Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
