import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { sessionId, planName } = await req.json();
    if (!sessionId || !planName) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid' && session.payment_status !== 'unpaid' && session.status !== 'complete') {
       return NextResponse.json({ error: 'Subscription not successful' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'User not logged in' }, { status: 401 });

    // Fetch Plan ID
    const { data: plan } = await supabase.from('subscription_plans').select('id').eq('name', planName).single();
    
    if (plan) {
      // Upsert Subscription
      await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        plan_id: plan.id,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // estimate 1 month for MVP
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
