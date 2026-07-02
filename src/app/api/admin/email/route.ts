import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail, SUPPORT_FROM, SUPPORT_REPLY_TO } from '@/utils/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();

    if (!to || typeof to !== 'string' || !EMAIL_RE.test(to.trim())) {
      return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    // Admin-only.
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

    const result = await sendEmail({
      to: to.trim(),
      subject: subject.trim(),
      text: body.trim(),
      from: SUPPORT_FROM,
      replyTo: SUPPORT_REPLY_TO,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: `Email failed to send: ${result.reason}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[admin/email] threw:', err);
    return NextResponse.json({ error: err.message ?? 'Send failed' }, { status: 500 });
  }
}
