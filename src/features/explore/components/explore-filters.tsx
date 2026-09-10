import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BankFacet, CategoryFacet } from '@/domain/listing';
import { cn } from '@/lib/cn';
import type { ExploreQuery } from '@/lib/validation/auth';
import { buildExploreHref } from '../lib/href';
import { FacetSelect, SortSelect } from './filter-selects';

/**
 * Sort control, filter pills and the search row.
 *
 * The pills and the search are links and a plain `GET` form pointed back at this page,
 * so the whole browse state lives in the URL — shareable, bookmarkable, back-button
 * correct and crawlable. Only the dropdowns are interactive, and they are the shared
 * Radix `Select` rather than bespoke listboxes.
 */
const PILLS: ReadonlyArray<{ key: string; label: string; patch: Partial<ExploreQuery> }> = [
  { key: 'popular', label: 'Popular', patch: { tag: 'popular' } },
  { key: 'car-auction', label: 'Car Auction', patch: { tag: 'car-auction' } },
  { key: 'physical', label: 'Physical', patch: { possession: 'physical' } },
  { key: 'symbolic', label: 'Symbolic', patch: { possession: 'symbolic' } },
];

export function ExploreFilters({
  query,
  banks,
  categories,
}: {
  query: ExploreQuery;
  banks: BankFacet[];
  categories: CategoryFacet[];
}) {
  const activePill = PILLS.find((pill) =>
    pill.patch.tag ? query.tag === pill.patch.tag : query.possession === pill.patch.possession,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <SortSelect query={query} />

        {PILLS.map((pill) => {
          const active = activePill?.key === pill.key;
          return (
            <Link
              key={pill.key}
              // Clicking an active pill clears it, which is what people expect of a toggle.
              href={buildExploreHref(query, {
                tag: undefined,
                possession: undefined,
                page: 1,
                ...(active ? {} : pill.patch),
              })}
              aria-pressed={active}
              className={cn(
                'inline-flex h-control items-center rounded-lg border px-4 text-meta font-medium transition-colors',
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border-subtle bg-surface text-ink-700 hover:border-brand-200 hover:bg-brand-50',
              )}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>

      {/*
        The search row is laid out on the same grid as the results below, so the split
        between "Search location + All Category" and "All Banks + Search Result" lands
        exactly on the gutter between the listing column and the sidebar, instead of
        the four controls dividing the width on their own.
      */}
      <form
        action="/explore"
        method="get"
        role="search"
        className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6"
      >
        {/* Filters set elsewhere have to survive a search submit. */}
        {query.city ? <input type="hidden" name="city" value={query.city} /> : null}
        {query.tag ? <input type="hidden" name="tag" value={query.tag} /> : null}
        {query.possession ? <input type="hidden" name="possession" value={query.possession} /> : null}
        {query.sort !== 'newest' ? <input type="hidden" name="sort" value={query.sort} /> : null}

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="explore-q" className="sr-only">
              Search location
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id="explore-q"
              name="q"
              type="search"
              defaultValue={query.q ?? ''}
              // Bounded here as well as server-side, so a pathological URL is stopped
              // at the source rather than on submit.
              maxLength={120}
              placeholder="Search location"
              className="h-control w-full rounded-lg border border-border-subtle bg-surface pr-3.5 pl-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            />
          </div>

          <FacetSelect
            name="category"
            label="Filter by category"
            placeholder="All Category"
            value={query.category}
            options={categories.map((category) => ({ value: category.slug, label: category.name }))}
          />
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <FacetSelect
            name="bank"
            label="Filter by bank"
            placeholder="All Banks"
            value={query.bank}
            options={banks.map((bank) => ({ value: bank.slug, label: bank.name }))}
            className="min-w-0 flex-1"
          />

          <Button type="submit" className="shrink-0">
            Search Result
          </Button>
        </div>
      </form>
    </div>
  );
}
