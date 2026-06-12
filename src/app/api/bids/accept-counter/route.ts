import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { postSystemMessage } from '@/utils/systemMessage';

export async function POST(req: Request) {
  try {
    const { bidId } = await req.json();
    if (!bidId) return NextResponse.json({ error: 'Missing bidId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: bid, error: bidErr } = await admin
      .from('bids')
      .select('id, seller_id, request_id, status, price, counter_price, counter_by, requests:request_id(buyer_id)')
      .eq('id', bidId)
      .single();

    if (bidErr || !bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    if (bid.status !== 'pending') {
      return NextResponse.json({ error: 'Bid is not pending' }, { status: 400 });
    }
    if (!bid.counter_price || !bid.counter_by) {
      return NextResponse.json({ error: 'No active counter to accept' }, { status: 400 });
    }

    const buyerId = (bid.requests as any)?.buyer_id;
    // The party who DID NOT counter accepts the counter.
    const expectedAccepter = bid.counter_by === 'buyer' ? bid.seller_id : buyerId;
    if (user.id !== expectedAccepter) {
      return NextResponse.json({ error: 'Only the counter recipient can accept' }, { status: 403 });
    }

    const { error: updErr } = await admin
      .from('bids')
      .update({
        price: bid.counter_price,
        counter_price: null,
        counter_message: null,
        counter_by: null,
        counter_at: null,
      })
      .eq('id', bidId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const otherParty = user.id === buyerId ? bid.seller_id : buyerId;
    const accepterRole = user.id === buyerId ? 'Buyer' : 'Seller';
    await postSystemMessage({
      requestId: bid.request_id,
      senderId: user.id,
      receiverId: otherParty,
      content: `✅ ${accepterRole} accepted the $${bid.counter_price} counter offer. Final price: $${bid.counter_price}.`,
    });

    return NextResponse.json({ success: true, newPrice: bid.counter_price });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
