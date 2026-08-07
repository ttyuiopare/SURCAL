'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

// Paths where we never want to interrupt with the share prompt (signup flow,
// auth, and the share page itself).
const SKIP_PATHS = ['/onboarding', '/login', '/share'];

/**
 * Counts logged-in visits (full page loads) in localStorage and, on the second
 * one, sends the user to /share once. Renders nothing. Mounted once in the root
 * layout, so its effect runs a single time per full page load — client-side
 * navigations don't re-trigger it. Uses localStorage (not the DB) on purpose:
 * no migration required, and the prompt is intentionally per-device.
 */
export default function SharePrompt() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !user) return;
    handled.current = true;

    try {
      // Already nudged this device — never prompt again.
      if (localStorage.getItem('surcal_share_prompted')) return;

      const visits = Number(localStorage.getItem('surcal_visits') || '0') + 1;
      localStorage.setItem('surcal_visits', String(visits));

      const onSkipPath = SKIP_PATHS.some((p) => pathname?.startsWith(p));
      if (visits >= 2 && !onSkipPath) {
        localStorage.setItem('surcal_share_prompted', '1');
        router.push('/share');
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — silently skip.
    }
  }, [user, pathname, router]);

  return null;
}
