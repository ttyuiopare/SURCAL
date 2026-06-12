import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';

type Args = {
  requestId: string;
  senderId: string;
  receiverId: string;
  content: string;
};

/**
 * Inserts an event-driven message into the conversation between two users on
 * a request. Uses the admin client so the sender_id check in RLS is bypassed —
 * callers must therefore have already authorized the action that triggered it.
 */
export async function postSystemMessage({ requestId, senderId, receiverId, content }: Args) {
  if (!requestId || !senderId || !receiverId || !content) return;
  if (senderId === receiverId) return;
  const admin = createAdminClient();
  const { error } = await admin.from('messages').insert([
    { request_id: requestId, sender_id: senderId, receiver_id: receiverId, content },
  ]);
  if (error) console.error('[systemMessage] insert failed:', error.message);
}
