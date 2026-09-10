import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Pill-shaped filter/tag used across the city, bank and category lists.
 * Renders as a link when `href` is given so filters stay shareable and crawlable.
 */
export function Chip({
  href,
  active = false,
  className,
  children,
}: {
  href?: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    'inline-flex min-h-control-sm items-center gap-1.5 rounded-full border px-3.5 text-meta font-medium transition-colors sm:px-3',
    active
      ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
      : 'border-border-subtle bg-surface text-ink-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={active ? 'page' : undefined}>
        {children}
      </Link>
    );
  }

  return <span className={classes}>{children}</span>;
}
