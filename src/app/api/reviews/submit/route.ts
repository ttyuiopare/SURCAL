import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendEmailNotification } from '@/utils/notifications';
import { postSystemMessage } from '@/utils/systemMessage';

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

    // Post a system message into the conversation
    const admin = createAdminClient();
    const { data: tx } = await admin
      .from('transactions')
      .select('request_id')
      .eq('id', transactionId)
      .single();
    if (tx) {
      const stars = '⭐'.repeat(rating);
      const note = comment ? `\n"${comment}"` : '';
      await postSystemMessage({
        requestId: tx.request_id,
        senderId: user.id,
        receiverId: revieweeId,
        content: `${stars} Buyer left a ${rating}/5 review.${note}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
