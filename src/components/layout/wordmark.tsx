import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/cn';

/**
 * The BANK SEAL lockup.
 *
 * Sized to match the design, where the wordmark is the dominant element in the bar —
 * roughly 40px on desktop, stepping down on smaller viewports so it never crowds the
 * menu trigger. `tone="inverse"` is the white treatment used in the footer.
 */
export function Wordmark({
  tone = 'brand',
  className,
}: {
  tone?: 'brand' | 'inverse';
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex shrink-0 items-center py-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:py-0 lg:text-[2.5rem] lg:leading-none',
        tone === 'brand' ? 'text-brand-600' : 'text-white',
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      {siteConfig.wordmark}
    </Link>
  );
}
