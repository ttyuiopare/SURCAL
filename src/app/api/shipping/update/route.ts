import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmailNotification } from '@/utils/notifications';

export async function POST(req: Request) {
  try {
    const { transactionId, carrier, trackingNumber, buyerId, requestTitle } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('transactions')
      .update({ 
        shipping_carrier: carrier, 
        tracking_number: trackingNumber,
        status: 'shipped' // Optional state change
      })
      .eq('id', transactionId)
      .eq('seller_id', user.id);

    if (error) throw error;

    // Notify Buyer
    if (buyerId) {
      await sendEmailNotification(
        buyerId,
        'Your Item Has Shipped!',
        `Your order "${requestTitle}" has been shipped via ${carrier}. Tracking: ${trackingNumber}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
