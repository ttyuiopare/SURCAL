import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import Link from 'next/link';
import ClientNav from './components/ClientNav';
import Logo from './components/Logo';
import ClientFooterLinks from './components/ClientFooterLinks';
import DeferredWidgets from './components/DeferredWidgets';
import { AuthProvider, type Profile } from './providers/AuthProvider';
import { createClient } from '@/utils/supabase/server';
import {
  SITE_URL,
  SITE_NAME,
  jsonLdScript,
  organizationSchema,
  websiteSchema,
} from '@/lib/seo';
import './globals.css';

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
});

const dmsans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dmsans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Surcal | Post What You Want. Sellers Compete for Your Order.',
    template: '%s | Surcal',
  },
  description:
    'Tell Surcal the exact item you want to buy — verified sellers send you competing offers within hours. Escrow-protected by Stripe, free to post. Sneakers, electronics, collectibles, watches and more.',
  applicationName: SITE_NAME,
  keywords: [
    // Core concept
    'reverse marketplace',
    'post what you want to buy',
    'sellers compete',
    'sellers compete for your order',
    'request a product',
    'get offers on items',
    'name your price marketplace',
    'buyer request marketplace',
    'want to buy listings',
    'ISO marketplace',
    // Trust / payments
    'escrow marketplace',
    'escrow protected buying',
    'secure online marketplace',
    'buyer protection marketplace',
    'verified sellers',
    'Stripe escrow',
    // Buyer intent
    'buy sneakers below resale',
    'buy electronics best price',
    'buy collectibles online',
    'buy watches online',
    'buy trading cards',
    'buy designer handbags',
    'find the best price online',
    'compare seller offers',
    'buy hard to find items',
    'source rare items',
    // Seller side
    'sell to buyers online',
    'find buyers for your items',
    'sell sneakers online',
    'sell electronics online',
    'sell collectibles online',
    'make money selling online',
    // Alternatives / comparison
    'eBay alternative',
    'marketplace to buy and sell',
    'online marketplace app',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Surcal | Post What You Want. Sellers Compete for Your Order.',
    description:
      'Post the exact item you want to buy and let verified sellers compete with offers. Escrow-protected. Free to post.',
    // og:image is provided site-wide by app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surcal | Post What You Want. Sellers Compete for Your Order.',
    description:
      'Post the exact item you want to buy and let verified sellers compete with offers. Escrow-protected. Free to post.',
    // twitter:image also derived from app/opengraph-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  // Google Search Console verification. Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // in Vercel to the "content" value Google gives you for the HTML-tag method;
  // the meta tag is omitted entirely when the env var is unset.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile = null;
  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[layout] profile fetch failed:', error.message);
    }

    if (data) {
      profile = data as Profile;
    } else {
      // No profile row came back (trigger lag, RLS, or transient error).
      // Fall back to the role captured in auth metadata at signup — never
      // hardcode 'buyer', which silently demotes sellers.
      profile = {
        id: user.id,
        role: (user.user_metadata?.role as string) || 'buyer',
        name: (user.user_metadata?.name as string) ?? null,
      };
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript([organizationSchema(), websiteSchema()])}
        />
      </head>
      <body className={`${dmsans.className} ${bebas.variable} ${dmsans.variable}`}>
        <AuthProvider initialUser={user} initialProfile={profile}>
          <nav className="glass-nav">
            <div className="nav-container">
              <Link href="/" className="logo" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                <Logo height={30} />
              </Link>
              <ClientNav />
            </div>
          </nav>
          <main style={{ flex: '1' }}>{children}</main>

          <footer
            className="glass-footer"
            style={{
              padding: '3rem var(--container-padding)',
              marginTop: 'auto',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              backgroundColor: 'var(--bg-color)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              <Logo
                height={40}
                textStyle={{
                  fontWeight: 600,
                  fontSize: '1.5rem',
                  color: 'var(--primary-navy)',
                }}
              />
              <ClientFooterLinks />

              <div
                style={{
                  width: '100%',
                  height: '1px',
                  background: 'rgba(0,0,0,0.05)',
                  margin: '1rem 0',
                }}
              ></div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '1rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Terms of Service
                </Link>
                <span>&bull;</span>
                <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Privacy Policy
                </Link>
                <span>&bull;</span>
                <Link href="/escrow-policy" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Escrow & Payment Policy
                </Link>
                <span>&bull;</span>
                <Link href="/refund-policy" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Refund & Dispute Policy
                </Link>
                <span>&bull;</span>
                <Link href="/acceptable-use" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Acceptable Use Policy
                </Link>
                <span>&bull;</span>
                <Link href="/cookies" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Cookie Policy
                </Link>
              </div>

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  margin: 0,
                  opacity: 0.8,
                }}
              >
                &copy; {new Date().getFullYear()} Surcal. All rights reserved.
              </p>
            </div>
          </footer>
          <DeferredWidgets />
        </AuthProvider>
      </body>
    </html>
  );
}
