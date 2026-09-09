import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ExploreQuery } from '@/lib/validation/auth';
import { buildExploreHref } from '../lib/href';

/**
 * Page navigation.
 *
 * Real links, so pages are crawlable, openable in a new tab and survive a reload. The
 * window is condensed with ellipses around the current page so a 50-page result set
 * doesn't produce 50 controls.
 */
export function ExplorePagination({
  query,
  page,
  totalPages,
}: {
  query: ExploreQuery;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-2">
      <Step
        href={buildExploreHref(query, { page: page - 1 })}
        disabled={page <= 1}
        label="Previous page"
        icon={ChevronLeft}
      />

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-ink-400">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildExploreHref(query, { page: entry })}
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Page ${entry}`}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              entry === page
                ? 'bg-brand-600 text-white'
                : 'border border-border-subtle bg-surface text-ink-700 hover:bg-ink-50',
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <Step
        href={buildExploreHref(query, { page: page + 1 })}
        disabled={page >= totalPages}
        label="Next page"
        icon={ChevronRight}
      />
    </nav>
  );
}

/** First, last, and a window around the current page; gaps become ellipses. */
function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  const pages = new Set<number>([1, totalPages, page]);
  for (let offset = 1; offset <= 2; offset += 1) {
    if (page - offset > 1) pages.add(page - offset);
    if (page + offset < totalPages) pages.add(page + offset);
  }

  const ordered = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const out: Array<number | 'gap'> = [];
  let previous = 0;
  for (const value of ordered) {
    if (previous && value - previous > 1) out.push('gap');
    out.push(value);
    previous = value;
  }
  return out;
}

function Step({
  href,
  disabled,
  label,
  icon: Icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: typeof ChevronLeft;
}) {
  const classes = 'inline-flex size-9 items-center justify-center rounded-lg border border-border-subtle text-ink-600';

  if (disabled) {
    // Rendered inert rather than omitted, so the control row doesn't reflow at the ends.
    return (
      <span aria-hidden="true" className={cn(classes, 'cursor-not-allowed bg-ink-50 opacity-50')}>
        <Icon className="size-4" />
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={cn(classes, 'bg-surface transition-colors hover:bg-ink-50')}>
      <Icon className="size-4" />
    </Link>
  );
}
