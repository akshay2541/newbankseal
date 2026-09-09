import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/lib/site-config';
import { SocialLinks } from './social-links';
import { StoreBadges } from './store-badges';
import { Wordmark } from './wordmark';

/**
 * Two-band footer from the design: a brand-blue block carrying the lockup, blurb,
 * store badges and link columns, sitting above a near-black legal strip.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-600 text-white">
      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-8 lg:py-14">
        <div className="max-w-sm">
          <Wordmark tone="inverse" className="text-3xl sm:text-4xl lg:text-[2.75rem]" />

          <div className="mt-5 space-y-3 text-sm leading-relaxed text-white/80">
            <p>Buying property doesn&apos;t have to be complicated or stressful.</p>
            <p>
              {siteConfig.name} brings buyers together, offers clear pricing insights, and helps you make confident,
              informed decisions at your own pace.
            </p>
          </div>

          <StoreBadges className="mt-6" />
        </div>

        {Object.entries(siteConfig.footerNav).map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <h2 className="text-[1.0625rem] font-bold text-white">{heading}</h2>
            <ul className="mt-5 space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-white/80 transition-colors hover:text-white hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="bg-ink-950">
        <Container className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
          <p className="text-xs text-white/60">
            © Copyright {siteConfig.name}. All Rights Reserved · {year}
          </p>
          <SocialLinks />
        </Container>
      </div>
    </footer>
  );
}
