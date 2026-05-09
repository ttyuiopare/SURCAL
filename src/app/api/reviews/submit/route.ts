import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmailNotification } from '@/utils/notifications';

export async function POST(req: Request) {
  try {
    const { transactionId, revieweeId, rating, comment } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('reviews').insert([{
      transaction_id: transactionId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment
    }]);

    if (error) throw error;

    // Notify Seller
    await sendEmailNotification(
      revieweeId,
      'You Received a New Review!',
      `A buyer just rated you ${rating}/5 stars on your recent transaction. Keep up the great work!`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
