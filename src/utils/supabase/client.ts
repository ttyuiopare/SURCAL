import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __surcalSupabaseClient__?: SupabaseClient;
  }
}

let moduleClient: SupabaseClient | undefined;

// Pass-through lock: runs the operation immediately without using the browser's
// navigator.locks API. We keep a single client instance (singleton below), so
// cross-tab token-refresh coordination isn't needed — and the default
// navigator lock causes "Lock broken by another request with the 'steal'
// option" / "Lock was not released" errors when an auth op (e.g. a realtime
// subscription grabbing the token) collides with a normal query.
async function passthroughLock<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  return fn();
}

export function createClient(): SupabaseClient {
  if (typeof window !== 'undefined' && window.__surcalSupabaseClient__) {
    moduleClient = window.__surcalSupabaseClient__;
    return moduleClient;
  }
  if (moduleClient) return moduleClient;

  moduleClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'surcal-app-auth-v2',
      },
      auth: {
        lock: passthroughLock,
      },
    }
  );

  if (typeof window !== 'undefined') {
    window.__surcalSupabaseClient__ = moduleClient;
  }

  return moduleClient;
}
