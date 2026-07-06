import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { notifyMatchingSellers } from '@/app/actions/matching';
import { moderateContent } from '@/app/actions/moderation';

export const dynamic = 'force-dynamic';

/**
 * Creates a buyer request server-side using the admin (service-role) client.
 * Doing the insert here — instead of from the browser Supabase client — avoids
 * client-side auth-token refresh stalls that were hanging the post after a few
 * rapid submissions. The insert bypasses RLS (service role), so it's fast and
 * reliable. Heavy follow-up work (matching, moderation) is best-effort.
 */
export async function POST(req: Request) {
  try {
    const { title, description, categoryId, budget, deadlineDays, imageUrl } = await req.json();

    if (!title || !description || !categoryId || budget == null || !deadlineDays) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(String(deadlineDays), 10));

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from('requests')
      .insert([{
        buyer_id: user.id,
        category_id: categoryId,
        title,
        description,
        ai_description: description,
        budget: parseFloat(String(budget)),
        deadline: deadline.toISOString(),
        image_url: imageUrl ?? null,
      }])
      .select('id')
      .single();

    if (error) {
      console.error('[requests/create] insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requestId = inserted!.id as string;

    // Best-effort background work — never blocks the response.
    notifyMatchingSellers(requestId).catch((e) => console.error('[requests/create] matching:', e));
    moderateContent({
      type: 'request',
      contentId: requestId,
      userId: user.id,
      text: `${title}\n\n${description}`,
      link: `/requests/${requestId}`,
    }).catch((e) => console.error('[requests/create] moderation:', e));

    return NextResponse.json({ success: true, id: requestId });
  } catch (err: any) {
    console.error('[requests/create] threw:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to create request' }, { status: 500 });
  }
}
