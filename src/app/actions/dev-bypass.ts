'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * DEV ONLY: marks the current signed-in seller as fully Stripe-onboarded
 * without going through Stripe. Locked to NODE_ENV !== 'production' so it
 * can never run on Vercel production.
 *
 * Use sparingly — flipping this means the seller can act as verified for
 * the rest of their account's lifetime until you manually reset the flag.
 */
export async function devMarkSellerVerified(): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Dev bypass is disabled in production.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ stripe_onboarding_complete: true, is_verified: true })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/seller/verify');
  revalidatePath('/seller');
  return { ok: true };
}
