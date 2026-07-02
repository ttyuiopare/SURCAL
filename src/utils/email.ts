import 'server-only';
import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'Surcal <onboarding@resend.dev>';

/** Address support / admin-composed mail is sent from (and replies routed to). */
export const SUPPORT_FROM =
  process.env.SUPPORT_FROM_EMAIL || 'Surcal Support <support@surcal.xyz>';
export const SUPPORT_REPLY_TO = process.env.SUPPORT_INBOX_EMAIL || 'support@surcal.xyz';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type EmailPayload = {
  to: string;
  subject: string;
  /** plain-text body, used as fallback and for the html template if `html` is not provided */
  text: string;
  /** optional fully-formed html. If omitted we wrap `text` in a simple branded template. */
  html?: string;
  /** override the From address for this send. Defaults to RESEND_FROM_EMAIL. */
  from?: string;
  /** set a Reply-To so recipient replies land in a real inbox. */
  replyTo?: string;
};

function defaultHtml(subject: string, text: string): string {
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f5f7;padding:24px;color:#1a2238;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #eef0f5;">
    <p style="font-weight:700;font-size:24px;margin:0 0 16px;color:#1e3a5f;">Surcal</p>
    <h1 style="font-size:18px;margin:0 0 12px;color:#1a2238;">${safe(subject)}</h1>
    <div style="font-size:15px;line-height:1.55;color:#444;white-space:pre-wrap;">${safe(text)}</div>
    <hr style="border:none;border-top:1px solid #eef0f5;margin:32px 0 16px;" />
    <p style="font-size:12px;color:#8a8f9c;margin:0;">You're receiving this because of activity on your Surcal account. Update preferences in your account settings.</p>
  </div>
</body></html>`;
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: 'RESEND_API_KEY not configured' };

  try {
    const { error } = await resend.emails.send({
      from: payload.from ?? FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html ?? defaultHtml(payload.subject, payload.text),
      text: payload.text,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    });
    if (error) {
      console.error('[email] send error:', error);
      return { sent: false, reason: String(error) };
    }
    return { sent: true };
  } catch (err: any) {
    console.error('[email] send threw:', err);
    return { sent: false, reason: err?.message ?? 'unknown' };
  }
}
