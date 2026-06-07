import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendEmail } from '@/utils/email';
import { sendPushToUser } from '@/utils/push';

export type NotificationKind =
  | 'inventory_match'
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'message_received'
  | 'system';

type NotifyInput = {
  userId: string;
  type: NotificationKind;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /** which preference column to honor for email/push. If omitted, fan out to both. */
  channelPref?: { email?: keyof PreferenceFlags; push?: keyof PreferenceFlags };
};

type PreferenceFlags = {
  notify_email_bids: boolean;
  notify_email_matches: boolean;
  notify_push_bids: boolean;
  notify_push_matches: boolean;
  email: string | null;
};

/**
 * Creates an in-app notification row AND, when the user's preferences allow it,
 * fans out to email + browser push. Safe to call from any server context;
 * uses the admin client so RLS isn't a concern.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const admin = createAdminClient();

  // 1. Always write the in-app row.
  await admin.from('notifications').insert([
    {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      metadata: input.metadata ?? {},
    },
  ]);

  // 2. Look up the user's contact info + preferences.
  const { data: profile } = await admin
    .from('profiles')
    .select('email, notify_email_bids, notify_email_matches, notify_push_bids, notify_push_matches')
    .eq('id', input.userId)
    .maybeSingle();

  if (!profile) return;
  const prefs = profile as PreferenceFlags;

  const emailKey = input.channelPref?.email ?? defaultEmailPref(input.type);
  const pushKey = input.channelPref?.push ?? defaultPushPref(input.type);

  const wantEmail = emailKey ? prefs[emailKey] !== false : true;
  const wantPush = pushKey ? prefs[pushKey] !== false : true;

  // 3. Fan out, in parallel. Failures don't block.
  await Promise.allSettled([
    wantEmail && prefs.email
      ? sendEmail({ to: prefs.email, subject: input.title, text: input.body })
      : Promise.resolve(),
    wantPush
      ? sendPushToUser(input.userId, { title: input.title, body: input.body, url: input.link })
      : Promise.resolve(),
  ]);
}

function defaultEmailPref(type: NotificationKind): keyof PreferenceFlags | null {
  switch (type) {
    case 'inventory_match': return 'notify_email_matches';
    case 'bid_received':
    case 'bid_accepted':
    case 'bid_rejected':    return 'notify_email_bids';
    default:                return null;
  }
}

function defaultPushPref(type: NotificationKind): keyof PreferenceFlags | null {
  switch (type) {
    case 'inventory_match': return 'notify_push_matches';
    case 'bid_received':
    case 'bid_accepted':
    case 'bid_rejected':    return 'notify_push_bids';
    default:                return null;
  }
}

// Backwards-compat: the old export name used by older code.
export async function sendEmailNotification(userId: string, title: string, message: string) {
  await notifyUser({ userId, type: 'system', title, body: message });
}
