import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/cn';

/**
 * The BANK SEAL lockup.
 *
 * Sized to match the design, where the wordmark is the dominant element in the bar —
 * 40px on desktop, stepping down on smaller viewports so it never crowds the menu
 * trigger. It rides the `h1` step rather than carrying its own ladder, which also put
 * the header and footer lockups on the same size; they were four pixels apart for no
 * reason anyone could name. `tone="inverse"` is the white treatment used in the footer.
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
        'inline-flex shrink-0 items-center py-1.5 font-display text-h1 leading-none font-extrabold tracking-tight lg:py-0',
        tone === 'brand' ? 'text-brand-600' : 'text-white',
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      {siteConfig.wordmark}
    </Link>
  );
}
