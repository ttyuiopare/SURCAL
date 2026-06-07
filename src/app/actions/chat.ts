'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `You are the Surcal Smart Assistant — a concise, friendly guide for Surcal, a reverse marketplace where buyers post requests for items they want, and sellers compete with offers.

How Surcal works:
- Buyers post requests describing what they want, a target price, and a deadline.
- Sellers browse open requests and submit bids (price + message + timeline).
- Surcal scores each bid 1-10 for quality and flags spam.
- Sellers maintain an inventory of items they have; when a buyer posts a matching request, sellers are notified instantly.
- Payments go through Stripe escrow until the buyer confirms delivery.
- Platform fee is 5% on completed transactions. No per-bid or subscription fees.

Your job:
- Help buyers craft better requests (clearer specs, realistic budgets).
- Help sellers price competitively and improve bid quality.
- Answer questions about the platform, fees, escrow, disputes.
- Be brief. Aim for 2-4 sentences unless the user asks for detail.
- Never invent platform features. If you don't know, say so and suggest contacting support.
- Never provide legal, tax, or financial advice — point to a professional.`;

type ChatInput = {
  messages: ChatTurn[];
  /** the page the user is currently on, for context */
  pagePath?: string;
};

export async function smartAssistantReply(input: ChatInput): Promise<{ reply: string; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { reply: '', error: 'The Smart Assistant is not configured. ANTHROPIC_API_KEY is missing.' };
  }

  if (!input.messages || input.messages.length === 0) {
    return { reply: '', error: 'No messages provided.' };
  }

  // Light context about the calling user (role only — keeps system prompt short).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userContext = '';
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user.id).maybeSingle();
    if (profile) {
      userContext = `\n\nThe user you are talking to is signed in as a ${profile.role === 'seller' ? 'seller' : 'buyer'}${profile.name ? ` named ${profile.name}` : ''}.`;
    }
  }
  if (input.pagePath) {
    userContext += `\nThey are currently on the page: ${input.pagePath}`;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Sanitize + trim. Keep last 12 turns to control token cost.
  const turns = input.messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: SYSTEM_PROMPT + userContext,
      messages: turns,
    });

    const text = msg.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim();

    if (!text) return { reply: '', error: 'Empty response from assistant.' };
    return { reply: text };
  } catch (err: any) {
    console.error('[smart-assistant] failed:', err);
    return { reply: '', error: 'The assistant is temporarily unavailable.' };
  }
}
