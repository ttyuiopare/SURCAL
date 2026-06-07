import 'server-only';
import webpush from 'web-push';
import { createAdminClient } from '@/utils/supabase/admin';

let configured = false;
function configurePush(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** url to open when notification is clicked */
  url?: string;
  /** optional tag — same tag replaces previous (e.g. one-per-request) */
  tag?: string;
};

/**
 * Sends a Web Push to every subscription registered for the user.
 * Silently no-ops if VAPID isn't configured. Removes dead subscriptions
 * (410 Gone / 404) as a side effect.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; dropped: number }> {
  if (!configurePush()) return { sent: 0, dropped: 0 };

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !subs || subs.length === 0) return { sent: 0, dropped: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let dropped = 0;
  const deadIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        if (status === 404 || status === 410) {
          deadIds.push(sub.id);
          dropped++;
        } else {
          console.error('[push] send error for', sub.endpoint, status, err?.body ?? err);
        }
      }
    })
  );

  if (deadIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', deadIds);
  }

  return { sent, dropped };
}
