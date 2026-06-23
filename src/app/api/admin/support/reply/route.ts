import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendEmail } from '@/utils/email';

export async function POST(req: Request) {
  try {
    const { ticketId, body, closeAfter } = await req.json();
    if (!ticketId || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'ticketId and body required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: caller } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    if (!caller?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: ticket, error: ticketErr } = await admin
      .from('support_tickets')
      .select('id, email, name, subject, message')
      .eq('id', ticketId)
      .single();
    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const replySubject = ticket.subject?.toLowerCase().startsWith('re:')
      ? ticket.subject
      : `Re: ${ticket.subject ?? 'Your Surcal support ticket'}`;

    const emailBody =
      `Hi ${ticket.name || 'there'},\n\n` +
      body.trim() +
      `\n\n— Surcal Support\n\n` +
      `---\nYour original message:\n${ticket.message}`;

    const sendResult = await sendEmail({
      to: ticket.email,
      subject: replySubject,
      text: emailBody,
    });

    const { error: insertErr } = await admin
      .from('support_ticket_replies')
      .insert({
        ticket_id: ticketId,
        admin_id: user.id,
        body: body.trim(),
      });
    if (insertErr) {
      console.error('[support/reply] insert failed:', insertErr);
    }

    if (closeAfter) {
      await admin
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);
    }

    if (!sendResult.sent) {
      return NextResponse.json(
        { success: false, error: `Reply saved but email failed: ${sendResult.reason}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[support/reply] threw:', err);
    return NextResponse.json({ error: err.message ?? 'Reply failed' }, { status: 500 });
  }
}
