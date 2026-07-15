// Centralised environment validation.
//
// `required` throws at boot if missing (the app cannot function without these).
// `recommended` warns once (some features degrade or fail at request time).

type EnvDef = { key: string; level: 'required' | 'recommended'; note: string };

const ENV_DEFS: EnvDef[] = [
  { key: 'NEXT_PUBLIC_SITE_URL',              level: 'recommended', note: 'Canonical site origin (e.g. https://surcal.com) — used for SEO canonicals, OpenGraph, and the sitemap' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL',          level: 'required',    note: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',     level: 'required',    note: 'Supabase anon (publishable) key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',         level: 'recommended', note: 'Required by admin operations, webhooks, and the matching engine' },
  { key: 'STRIPE_SECRET_KEY',                 level: 'recommended', note: 'Required for checkout, Connect onboarding, escrow release' },
  { key: 'STRIPE_WEBHOOK_SECRET',             level: 'recommended', note: 'Required to verify Stripe webhook signatures' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',level: 'recommended', note: 'Required by the @stripe/stripe-js client' },
  { key: 'ANTHROPIC_API_KEY',                 level: 'recommended', note: 'Required for the Smart Assistant (bid scoring, request improvement, matching, chat)' },
  { key: 'RESEND_API_KEY',                    level: 'recommended', note: 'Required for outbound email notifications' },
  { key: 'VAPID_PUBLIC_KEY',                  level: 'recommended', note: 'Required for browser push notifications' },
  { key: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',      level: 'recommended', note: 'Client-side VAPID public key (same value as VAPID_PUBLIC_KEY)' },
  { key: 'VAPID_PRIVATE_KEY',                 level: 'recommended', note: 'Required for browser push notifications (server-only)' },
  { key: 'VAPID_SUBJECT',                     level: 'recommended', note: 'mailto:you@example.com — required by Web Push spec' },
];

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  for (const def of ENV_DEFS) {
    if (!process.env[def.key]) {
      if (def.level === 'required') missingRequired.push(`${def.key} — ${def.note}`);
      else missingRecommended.push(`${def.key} — ${def.note}`);
    }
  }

  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missingRequired.join('\n  - ')}\n\nAdd them to .env.local (dev) or Vercel project settings (prod).`
    );
  }

  if (missingRecommended.length > 0 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `[surcal:env] Missing recommended env vars (related features will be no-ops):\n  - ${missingRecommended.join('\n  - ')}`
    );
  }
}

validateEnv();
