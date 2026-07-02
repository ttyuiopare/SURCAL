import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendEmail } from '@/utils/email';

const INBOX = process.env.SUPPORT_INBOX_EMAIL || 'support@surcal.xyz';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const { data: ticket, error: insertErr } = await admin
      .from('support_tickets')
      .insert({ name, email, subject, message, user_id: user?.id ?? null })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[support/ticket] insert failed:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const idShort = (ticket?.id as string)?.slice(0, 8) ?? 'unknown';
    const body =
      `New support ticket #${idShort}\n\n` +
      `From: ${name} <${email}>\n` +
      `User ID: ${user?.id ?? '(not signed in)'}\n` +
      `Subject: ${subject}\n\n` +
      `Message:\n${message}`;

    // Fire-and-forget — the ticket is already saved either way.
    // 1. Notify the support inbox.
    sendEmail({
      to: INBOX,
      subject: `[Surcal Support] ${subject}`,
      text: body,
    }).catch((err) => console.error('[support/ticket] notify failed:', err));

    // 2. Auto-reply confirmation to the person who submitted the ticket.
    sendEmail({
      to: email,
      subject: `We received your message — ticket #${idShort}`,
      text:
        `Hi ${name},\n\n` +
        `Thanks for reaching out to Surcal. We've received your message and our team ` +
        `will get back to you by email within 24 hours.\n\n` +
        `Your ticket reference is #${idShort}.\n\n` +
        `For your records, here's a copy of what you sent:\n\n` +
        `Subject: ${subject}\n\n${message}\n\n` +
        `— The Surcal Team\n` +
        `Please don't reply to this email; it's an automated confirmation.`,
    }).catch((err) => console.error('[support/ticket] auto-reply failed:', err));

    return NextResponse.json({ success: true, ticketId: ticket?.id });
  } catch (err: any) {
    console.error('[support/ticket] threw:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
