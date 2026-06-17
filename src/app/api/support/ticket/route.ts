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

    // Fire-and-forget notification — the ticket is already saved either way.
    sendEmail({
      to: INBOX,
      subject: `[Surcal Support] ${subject}`,
      text: body,
    }).catch((err) => console.error('[support/ticket] notify failed:', err));

    return NextResponse.json({ success: true, ticketId: ticket?.id });
  } catch (err: any) {
    console.error('[support/ticket] threw:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
