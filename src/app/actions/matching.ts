'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/utils/supabase/admin';
import { notifyUser } from '@/utils/notifications';
import { sendAdminAlert, matchAlertsEnabled } from '@/utils/adminAlert';
import { SITE_URL } from '@/lib/seo';

const MATCH_THRESHOLD = 0.7;
const MAX_AI_CANDIDATES = 30;

type InventoryRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  condition: string | null;
};

type RequestRow = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  buyer_id: string;
  budget: number;
};

/**
 * Given a new request, finds matching seller inventory items and fires
 * "inventory_match" notifications to those sellers.
 *
 * Fire-and-forget from the caller — don't await this in user-facing handlers,
 * or do so explicitly understanding it costs a network round-trip and possibly
 * an Anthropic call.
 */
export async function notifyMatchingSellers(requestId: string): Promise<{ matched: number }> {
  const admin = createAdminClient();

  // 1. Load the request.
  const { data: request } = await admin
    .from('requests')
    .select('id, title, description, category_id, buyer_id, budget')
    .eq('id', requestId)
    .maybeSingle();

  if (!request) return { matched: 0 };

  // 2. Cheap candidate pre-filter: same category + keyword overlap.
  const candidates = await preFilterInventory(request);

  if (candidates.length === 0) {
    await recordNoMatch(request);
    return { matched: 0 };
  }

  // 3. AI re-rank if we have the key; otherwise notify everyone who passed the pre-filter.
  const matched = process.env.ANTHROPIC_API_KEY
    ? await aiRerank(request, candidates)
    : candidates.map((c) => ({ inv: c, score: 1.0 }));

  // 4. Group by seller and notify once per seller (one inventory may yield multiple hits).
  const bySeller = new Map<string, { score: number; inv: InventoryRow }>();
  for (const m of matched) {
    if (m.score < MATCH_THRESHOLD) continue;
    if (m.inv.seller_id === request.buyer_id) continue; // never notify the buyer themselves
    const existing = bySeller.get(m.inv.seller_id);
    if (!existing || m.score > existing.score) bySeller.set(m.inv.seller_id, m);
  }

  if (bySeller.size === 0) {
    await recordNoMatch(request);
    return { matched: 0 };
  }

  await Promise.allSettled(
    Array.from(bySeller.entries()).map(([sellerId, { inv, score }]) =>
      notifyUser({
        userId: sellerId,
        type: 'inventory_match',
        title: `A buyer wants something you have`,
        body: `"${request.title}" matches your "${inv.title}" listing. Budget: $${request.budget}. Be the first to bid.`,
        link: `/requests/${request.id}`,
        metadata: {
          request_id: request.id,
          inventory_id: inv.id,
          match_score: score,
        },
      })
    )
  );

  // Log the match + tell the operator, so there's a record of who was told what
  // even when a seller ignores their notification.
  await recordMatches(request, bySeller);

  return { matched: bySeller.size };
}

/**
 * Writes the match rows and emails the operator a digest for this request.
 * Best-effort throughout — never let bookkeeping break the notification path.
 */
async function recordMatches(
  request: RequestRow,
  bySeller: Map<string, { score: number; inv: InventoryRow }>
): Promise<void> {
  const admin = createAdminClient();
  const entries = Array.from(bySeller.entries());

  try {
    await admin.from('inventory_match_log').insert(
      entries.map(([sellerId, { inv, score }]) => ({
        request_id: request.id,
        seller_id: sellerId,
        inventory_id: inv.id,
        score,
        outcome: 'matched',
      }))
    );
  } catch (err) {
    console.error('[matching] match log insert failed:', err);
  }

  if (!matchAlertsEnabled()) return;

  try {
    const { data: sellers } = await admin
      .from('profiles')
      .select('id, name, email')
      .in('id', entries.map(([id]) => id));

    const nameById = new Map((sellers ?? []).map((s) => [s.id, s]));

    const lines = entries
      .sort((a, b) => b[1].score - a[1].score)
      .map(([sellerId, { inv, score }]) => {
        const s = nameById.get(sellerId);
        return `  • ${s?.name || 'Unknown seller'} (${s?.email || 'no email'}) — has "${inv.title}" · match ${Math.round(score * 100)}%`;
      })
      .join('\n');

    await sendAdminAlert(
      `${entries.length} seller${entries.length === 1 ? '' : 's'} matched: "${request.title}"`,
      `A buyer posted "${request.title}" (budget $${request.budget}).\n\n` +
        `These sellers have something that fits and were notified:\n${lines}\n\n` +
        `Request: ${SITE_URL}/requests/${request.id}\n` +
        `Inventory browser: ${SITE_URL}/admin/inventory`
    );
  } catch (err) {
    console.error('[matching] admin alert failed:', err);
  }
}

/**
 * A request that matched nobody. Worth logging and alerting on: it's unmet
 * demand, and the cue to go find a seller who can fill it.
 */
async function recordNoMatch(request: RequestRow): Promise<void> {
  const admin = createAdminClient();

  try {
    await admin.from('inventory_match_log').insert([
      { request_id: request.id, seller_id: null, inventory_id: null, score: null, outcome: 'no_match' },
    ]);
  } catch (err) {
    console.error('[matching] no-match log insert failed:', err);
  }

  if (!matchAlertsEnabled()) return;

  await sendAdminAlert(
    `No seller matched: "${request.title}"`,
    `A buyer posted "${request.title}" (budget $${request.budget}) and no seller inventory matched it.\n\n` +
      `${request.description.slice(0, 400)}\n\n` +
      `Request: ${SITE_URL}/requests/${request.id}\n` +
      `Inventory browser: ${SITE_URL}/admin/inventory`
  );
}

async function preFilterInventory(request: RequestRow): Promise<InventoryRow[]> {
  const admin = createAdminClient();
  const haystack = `${request.title} ${request.description}`.toLowerCase();
  const keywords = Array.from(
    new Set(
      haystack
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4)
    )
  );

  // Category-first query (cheap)
  let query = admin
    .from('seller_inventory')
    .select('id, seller_id, title, description, category_id, condition')
    .eq('is_active', true)
    .limit(200);

  if (request.category_id) {
    query = query.eq('category_id', request.category_id);
  }

  const { data: byCategory } = await query;
  let candidates = (byCategory ?? []) as InventoryRow[];

  // If no category or too few hits, broaden with keyword search across all inventory.
  if (candidates.length < 5 && keywords.length > 0) {
    const kwQuery = keywords.slice(0, 8).map((k) => `title.ilike.%${k}%,description.ilike.%${k}%`).join(',');
    const { data: byKeyword } = await admin
      .from('seller_inventory')
      .select('id, seller_id, title, description, category_id, condition')
      .eq('is_active', true)
      .or(kwQuery)
      .limit(200);

    const seen = new Set(candidates.map((c) => c.id));
    for (const row of (byKeyword ?? []) as InventoryRow[]) {
      if (!seen.has(row.id)) candidates.push(row);
    }
  }

  // Score by keyword overlap, take top N.
  const scored = candidates.map((c) => {
    const hay = `${c.title} ${c.description ?? ''}`.toLowerCase();
    let hits = 0;
    for (const k of keywords) if (hay.includes(k)) hits++;
    return { row: c, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);

  return scored.slice(0, MAX_AI_CANDIDATES).map((s) => s.row);
}

async function aiRerank(
  request: RequestRow,
  candidates: InventoryRow[]
): Promise<{ inv: InventoryRow; score: number }[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 1, timeout: 20_000 });

  const prompt = `You're matching a marketplace buyer request to seller inventory items.

BUYER REQUEST:
Title: ${request.title}
Description: ${request.description}

INVENTORY CANDIDATES (numbered):
${candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.title}${c.condition ? ` (${c.condition})` : ''}${
        c.description ? ` — ${c.description.slice(0, 200)}` : ''
      }`
  )
  .join('\n')}

For each candidate, decide if it would satisfy the buyer's request. Score 0.0 (no way) to 1.0 (definite match). Consider product equivalence (different brands of the same thing usually still match) and condition acceptability.

Return ONLY a JSON array. No prose. No markdown.
Example: [{"i":1,"score":0.9},{"i":2,"score":0.2}]`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as { i: number; score: number }[];
    return parsed
      .map((p) => {
        const inv = candidates[p.i - 1];
        if (!inv) return null;
        return { inv, score: Math.max(0, Math.min(1, Number(p.score) || 0)) };
      })
      .filter((x): x is { inv: InventoryRow; score: number } => x !== null);
  } catch (err) {
    console.error('[matching] AI rerank failed, falling back to keyword scores:', err);
    // On failure, accept all candidates with a baseline score so we still notify.
    return candidates.map((inv) => ({ inv, score: 0.75 }));
  }
}
