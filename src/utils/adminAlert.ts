import 'server-only';
import { sendEmail, SUPPORT_REPLY_TO } from '@/utils/email';

/**
 * Where operator alerts go. Set ADMIN_ALERT_EMAIL to override; falls back to
 * the support inbox so alerts still land somewhere if it's unset.
 * Comma-separated values are supported.
 */
function alertRecipients(): string[] {
  const raw = process.env.ADMIN_ALERT_EMAIL || SUPPORT_REPLY_TO;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Set ADMIN_ALERT_MATCHES=off to silence match alerts without redeploying code. */
export function matchAlertsEnabled(): boolean {
  return (process.env.ADMIN_ALERT_MATCHES || 'on').toLowerCase() !== 'off';
}

/**
 * Fire-and-forget operator email. Never throws — an alert failing must not take
 * down the request path that triggered it.
 */
export async function sendAdminAlert(subject: string, text: string): Promise<void> {
  try {
    const to = alertRecipients();
    if (to.length === 0) return;

    await Promise.allSettled(
      to.map((addr) =>
        sendEmail({
          to: addr,
          subject: `[Surcal] ${subject}`,
          text,
          replyTo: SUPPORT_REPLY_TO,
        })
      )
    );
  } catch (err) {
    console.error('[adminAlert] failed:', err);
  }
}
