import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import '@/env';

const PUBLIC_PATHS = new Set<string>([
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/escrow-policy',
  '/refund-policy',
  '/acceptable-use',
  '/cookies',
  '/faq',
  '/pricing',
  '/banned',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/signup')) return true;
  if (pathname.startsWith('/api/webhooks')) return true;
  if (pathname.startsWith('/api/health')) return true;
  // Pre-launch gate endpoints must be reachable without a session: visitors
  // who hit /login haven't signed in yet but still need to submit the
  // waitlist form / validate their beta code.
  if (pathname.startsWith('/api/waitlist')) return true;
  if (pathname.startsWith('/api/access/')) return true;
  return false;
}

// Pages an unverified seller is still allowed to reach (so they can complete
// verification or sign out). Everything else funnels them to /seller/verify.
//
// IMPORTANT: all /api/* routes are exempt. They're called by client fetches
// that expect JSON; an HTML redirect from middleware breaks them. Each API
// route enforces its own auth/role checks server-side.
function isVerifyExempt(pathname: string): boolean {
  if (pathname === '/seller/verify') return true;
  if (pathname.startsWith('/settings')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (isPublicPath(pathname)) return true;
  return false;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: 'surcal-app-auth-v2' },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run any logic between createServerClient and getUser().
  // See https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, banned_at, stripe_onboarding_complete, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    // Banned users only see /banned and the public marketing pages.
    if (profile?.banned_at && pathname !== '/banned' && !PUBLIC_PATHS.has(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/banned';
      const redirectRes = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectRes);
      return redirectRes;
    }

    // Sellers must complete Stripe Connect onboarding before using the
    // platform. Admins are exempt.
    //
    // Dev bypass: set DEV_SKIP_SELLER_VERIFY=true in .env.local to skip this
    // gate entirely while developing. The bypass is hard-locked to non-prod
    // (NODE_ENV check), so it can never apply on Vercel production.
    const devBypass =
      process.env.NODE_ENV !== 'production' && process.env.DEV_SKIP_SELLER_VERIFY === 'true';

    const needsVerification =
      !devBypass &&
      profile?.role === 'seller' &&
      !profile?.stripe_onboarding_complete &&
      !profile?.is_admin;

    if (needsVerification && !isVerifyExempt(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/seller/verify';
      const redirectRes = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectRes);
      return redirectRes;
    }

    if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.banned_at
        ? '/banned'
        : needsVerification
        ? '/seller/verify'
        : profile?.role === 'seller'
        ? '/seller'
        : '/buyer';
      const redirectRes = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectRes);
      return redirectRes;
    }
  } else if (!isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectRes = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectRes);
    return redirectRes;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
