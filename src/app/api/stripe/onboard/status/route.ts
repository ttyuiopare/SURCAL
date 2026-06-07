import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Checks the live Stripe account status and syncs stripe_onboarding_complete.
// Used when a seller returns from Stripe onboarding, since the account.updated
// webhook may not have arrived yet.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_onboarding_complete) {
      return NextResponse.json({ complete: true });
    }
    if (!profile?.stripe_account_id) {
      return NextResponse.json({ complete: false, started: false });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const stripe = new Stripe(secret, { apiVersion: '2023-10-16' as any });
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const complete = !!account.charges_enabled && !!account.details_submitted;

    if (complete) {
      await admin
        .from('profiles')
        .update({ stripe_onboarding_complete: true, is_verified: true })
        .eq('id', user.id);
    }

    return NextResponse.json({ complete });
  } catch (err: any) {
    console.error('[stripe/onboard/status] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
