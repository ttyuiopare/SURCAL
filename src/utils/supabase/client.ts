import { createBrowserClient } from '@supabase/ssr'

// We implement a SSR-safe singleton pattern for the Supabase client
// to prevent browser-side lock contention during Next.js hot reloads.
const locks = new Map<string, Promise<void>>();

export function createClient() {
  if (typeof window !== 'undefined' && (window as any).__supabaseBrowserClient_v4) {
    return (window as any).__supabaseBrowserClient_v4;
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'surcal-app-auth'
      }
    }
  );

  if (typeof window !== 'undefined') {
    (window as any).__supabaseBrowserClient_v4 = client;
  }

  return client;
}
