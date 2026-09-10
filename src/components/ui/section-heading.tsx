import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * The repeating section header from the design: a two-tone title where the second
 * word is brand-coloured ("New Listed *Properties*"), with an optional "View All".
 */
export function SectionHeading({
  lead,
  highlight,
  viewAllHref,
  viewAllLabel = 'View All',
  className,
  id,
}: {
  lead: string;
  highlight?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('mb-gap flex items-end justify-between gap-3', className)}>
      <h2 id={id} className="font-display text-h4 font-bold tracking-tight text-ink-900">
        {lead}
        {highlight ? <span className="text-brand-600"> {highlight}</span> : null}
      </h2>

      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="-mr-2 inline-flex min-h-control-sm shrink-0 items-center px-2 text-meta font-medium text-ink-500 transition-colors hover:text-brand-600 sm:mr-0 sm:px-0"
        >
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  );
}
