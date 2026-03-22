import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import Link from 'next/link';
import VerificationGuard from './VerificationGuard';
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
            <div className="nav-links">
              <Link href="/requests" style={{ textDecoration: 'none' }}>Requests</Link>
              <Link href="/offers" style={{ textDecoration: 'none' }}>Offers</Link>
              <Link href="/messages" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Inbox</Link>
              <Link href="/manage" style={{ textDecoration: 'none' }}>Manage</Link>
              <Link href="/earnings" style={{ textDecoration: 'none' }}>Earnings</Link>
              <Link href="/settings" style={{ textDecoration: 'none' }}>Settings</Link>
              <Link href="/dashboard" className="button-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Dashboard</Link>
            </div>
          </div>
        </nav>
        <main style={{ flex: '1' }}>{children}</main>
        
        <footer className="glass-footer" style={{ padding: '3rem var(--container-padding)', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--primary-navy)' }}>Surcal</p>
            <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
              <Link href="/requests" style={{ textDecoration: 'none', color: 'inherit' }}>Requests</Link>
              <Link href="/offers" style={{ textDecoration: 'none', color: 'inherit' }}>Offers</Link>
              <Link href="/messages" style={{ textDecoration: 'none', color: 'inherit' }}>Inbox</Link>
              <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
              <Link href="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</Link>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
              &copy; {new Date().getFullYear()} Surcal. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
