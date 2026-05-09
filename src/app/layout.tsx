import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import Link from 'next/link';
import VerificationGuard from './VerificationGuard';
import ClientNav from './components/ClientNav';
import ClientFooterLinks from './components/ClientFooterLinks';
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
});

const dmsans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dmsans",
});

export const metadata: Metadata = {
  title: "Surcal | The Buyer's Market",
  description: "A premium reverse marketplace where buyers post requests and sellers make offers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmsans.className} ${bebas.variable} ${dmsans.variable}`}>
        <VerificationGuard />
        <nav className="glass-nav">
          <div className="nav-container">
            <Link href="/" className="logo" style={{ textDecoration: 'none' }}>Surcal</Link>
            <ClientNav />
          </div>
        </nav>
        <main style={{ flex: '1' }}>{children}</main>
        
        <footer className="glass-footer" style={{ padding: '3rem var(--container-padding)', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1.5rem', color: 'var(--primary-navy)', margin: 0 }}>Surcal</p>
            <ClientFooterLinks />
            
            <div style={{ width: '100%', height: '1px', background: 'rgba(0,0,0,0.05)', margin: '1rem 0' }}></div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</Link>
              <span>&bull;</span>
              <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</Link>
              <span>&bull;</span>
              <Link href="/escrow-policy" style={{ textDecoration: 'none', color: 'inherit' }}>Escrow & Payment Policy</Link>
              <span>&bull;</span>
              <Link href="/refund-policy" style={{ textDecoration: 'none', color: 'inherit' }}>Refund & Dispute Policy</Link>
              <span>&bull;</span>
              <Link href="/acceptable-use" style={{ textDecoration: 'none', color: 'inherit' }}>Acceptable Use Policy</Link>
              <span>&bull;</span>
              <Link href="/cookies" style={{ textDecoration: 'none', color: 'inherit' }}>Cookie Policy</Link>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
              &copy; {new Date().getFullYear()} Surcal. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
