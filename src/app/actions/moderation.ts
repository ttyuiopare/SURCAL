'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { notifyUser } from '@/utils/notifications';
import { revalidatePath } from 'next/cache';

type ContentType = 'request' | 'bid' | 'message';

type ModerateInput = {
  type: ContentType;
  contentId: string;
  userId: string;
  text: string;
  link?: string;
};

type Verdict = {
  violation: boolean;
  category: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
};

const MODERATION_PROMPT = `You are a trust & safety classifier for Surcal, a marketplace where buyers post requests for items and sellers make offers.

Flag content that violates policy:
- prohibited_item: weapons, drugs, stolen/counterfeit goods, recalled items, live animals, regulated/illegal goods
- fraud: scams, phishing, advance-fee schemes, fake listings, requests to pay or move OFF the platform
- harassment: hate speech, threats, harassment, sexual harassment
- adult: sexually explicit content
- spam: spam, gibberish, mass advertising, irrelevant links
- pii: sharing others' private personal/financial information (doxxing)

Normal commerce (electronics, clothing, collectibles, services, negotiating price) is NOT a violation.

Respond ONLY with valid JSON, no prose:
{"violation": true/false, "category": "<one category or 'none'>", "severity": "low"|"medium"|"high", "reason": "<one short sentence>"}`;

async function classify(text: string): Promise<Verdict | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 20_000 });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: MODERATION_PROMPT,
      messages: [{ role: 'user', content: text.slice(0, 4000) }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Verdict;
    return parsed;
  } catch (err) {
    console.error('[moderation] classify failed:', err);
    return null;
  }
}

async function notifyAllAdmins(args: {
  category: string;
  severity: string;
  reason: string;
  link: string;
}) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from('profiles').select('id').eq('is_admin', true);
  if (!admins || admins.length === 0) return;

  await Promise.allSettled(
    admins.map((a) =>
      notifyUser({
        userId: a.id,
        type: 'system',
        title: `Policy flag: ${args.category} (${args.severity})`,
        body: args.reason,
        link: args.link,
        metadata: { moderation: true, category: args.category, severity: args.severity },
      })
    )
  );
}

/**
 * Runs AI moderation on a piece of content. On a medium/high violation it
 * records a moderation flag and notifies every admin. Fire-and-forget from
 * content-creation handlers — never blocks the user.
 */
export async function moderateContent(input: ModerateInput): Promise<void> {
  const verdict = await classify(input.text);
  if (!verdict || !verdict.violation) return;
  if (verdict.severity !== 'medium' && verdict.severity !== 'high') return;

  const admin = createAdminClient();
  const link = input.link ?? '/admin/moderation';

  await admin.from('moderation_flags').insert([
    {
      content_type: input.type,
      content_id: input.contentId,
      flagged_user_id: input.userId,
      category: verdict.category,
      severity: verdict.severity,
      reason: verdict.reason,
      excerpt: input.text.slice(0, 280),
      link,
    },
  ]);

  await notifyAllAdmins({
    category: verdict.category,
    severity: verdict.severity,
    reason: verdict.reason,
    link: '/admin/moderation',
  });
}

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error('Forbidden.');
}

export async function resolveFlag(
  flagId: string,
  status: 'actioned' | 'dismissed'
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    await admin.from('moderation_flags').update({ status }).eq('id', flagId);
    revalidatePath('/admin/moderation');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Failed' };
  }
}
