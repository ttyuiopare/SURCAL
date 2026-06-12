import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';

export async function POST(req: Request) {
  try {
    const { bidId, counterPrice, message } = await req.json();

    if (!bidId || typeof counterPrice !== 'number' || counterPrice <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: bid, error: bidErr } = await admin
      .from('bids')
      .select('id, seller_id, request_id, status, price, requests:request_id(buyer_id, title)')
      .eq('id', bidId)
      .single();

    if (bidErr || !bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    if (bid.status !== 'pending') {
      return NextResponse.json({ error: 'Counters only allowed on pending offers' }, { status: 400 });
    }

    const buyerId = (bid.requests as any)?.buyer_id;
    let counterBy: 'buyer' | 'seller';
    if (user.id === buyerId) counterBy = 'buyer';
    else if (user.id === bid.seller_id) counterBy = 'seller';
    else return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error: updErr } = await admin
      .from('bids')
      .update({
        counter_price: counterPrice,
        counter_message: message ?? null,
        counter_by: counterBy,
        counter_at: new Date().toISOString(),
      })
      .eq('id', bidId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const receiverId = counterBy === 'buyer' ? bid.seller_id : buyerId;
    const role = counterBy === 'buyer' ? 'Buyer' : 'Seller';
    const note = message ? `\n"${message}"` : '';
    await postSystemMessage({
      requestId: bid.request_id,
      senderId: user.id,
      receiverId,
      content: `💬 ${role} countered at $${counterPrice}.${note}`,
    });

    return NextResponse.json({ success: true, counterBy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
