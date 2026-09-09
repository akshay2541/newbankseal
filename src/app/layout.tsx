import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { clientEnv } from '@/lib/env';
import { siteConfig } from '@/lib/site-config';
import './globals.css';

/**
 * Fonts are self-hosted by `next/font` at build time — no runtime request to a font
 * CDN, which keeps `font-src 'self'` in the CSP and avoids leaking visitor IPs to a
 * third party.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${siteConfig.name} — Bank Auction Marketplace`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Bank Auction Marketplace`,
    description: siteConfig.description,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    // Signed-in surfaces opt out individually; nothing here should reach a cache.
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#1570ef',
  width: 'device-width',
  initialScale: 1,
  // Never block zoom — pinch-zoom is an accessibility requirement, not a nuisance.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-btn focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>

        <SiteHeader />

        <main id="main">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
