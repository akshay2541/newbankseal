import { Fragment } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { AdSlot } from '@/features/explore/components/ad-slot';
import { ExploreFilters } from '@/features/explore/components/explore-filters';
import { ExplorePagination } from '@/features/explore/components/explore-pagination';
import { ExploreSidebar } from '@/features/explore/components/explore-sidebar';
import { ListingRow } from '@/features/explore/components/listing-row';
import { clientEnv } from '@/lib/env';
import { formatCount } from '@/lib/format';
import { exploreQuerySchema } from '@/lib/validation/auth';
import { getExplorePageData } from '@/server/services/explore-service';

export const metadata: Metadata = {
  title: 'Bank auction properties',
  description:
    'Browse verified bank-seized and SARFAESI auction properties, vehicles and assets. Filter by city, bank, category and possession type.',
};

/**
 * The browse surface.
 *
 * Dynamic by nature: the output depends on the query string, so there is nothing
 * stable to prerender. Every parameter is re-parsed here through `exploreQuerySchema`
 * before it reaches a query — the links that produce these URLs are ours, but the URL
 * itself is entirely visitor-controlled and is treated that way.
 */
export const dynamic = 'force-dynamic';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  // A repeated parameter arrives as an array; take the first rather than letting the
  // schema reject the whole request over `?city=a&city=b`.
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const parsed = exploreQuerySchema.safeParse({
    q: first(raw.q),
    city: first(raw.city),
    category: first(raw.category),
    bank: first(raw.bank),
    possession: first(raw.possession),
    tag: first(raw.tag),
    sort: first(raw.sort),
    page: first(raw.page),
  });

  // Anything invalid falls back to the unfiltered view instead of erroring: a bad URL
  // should show the visitor something useful, not a stack of validation messages.
  const query = parsed.success ? parsed.data : exploreQuerySchema.parse({});

  const { results, localities, banks, categories, cityName } = await getExplorePageData(query);

  const heading = cityName
    ? `${formatCount(results.total)} Bank Auction Properties in ${cityName}`
    : `${formatCount(results.total)} Bank Auction Properties`;

  return (
    <Container className="py-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-ink-100 px-3 sm:h-9 font-medium text-ink-600 transition-colors hover:bg-ink-200"
        >
          Home
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5 text-ink-400" />
        <span aria-current="page" className="inline-flex h-11 items-center rounded-md bg-ink-100 px-3 sm:h-9 font-medium text-ink-700">
          Auction Listings
        </span>
      </nav>

      <h1 className="mt-5 font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{heading}</h1>

      <div className="mt-5">
        <ExploreFilters query={query} banks={banks} categories={categories} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/*
          `flex` + `gap` rather than `space-y`. The ad slot has to sit between two cards
          without becoming a card itself, which previously meant wrapping each entry in
          a `display: contents` div — and `space-y` puts its margin on that wrapper,
          which generates no box, so the margin was silently dropped and the cards
          rendered flush. `gap` spaces the laid-out children directly, so a Fragment
          carries the key and nothing has to fake being boxless.
        */}
        <div className="flex flex-col gap-3">
          {results.items.length === 0 ? (
            <EmptyState />
          ) : (
            results.items.map((listing, index) => (
              <Fragment key={listing.id}>
                <ListingRow listing={listing} />
                {/* One in-feed slot, placed mid-page as in the design. */}
                {index === 5 ? <AdSlot className="h-40" /> : null}
              </Fragment>
            ))
          )}

          <ExplorePagination query={query} page={results.page} totalPages={results.totalPages} />
        </div>

        <ExploreSidebar
          localities={localities}
          cityName={cityName}
          query={query}
          shareUrl={`${clientEnv.NEXT_PUBLIC_APP_URL}/explore`}
        />
      </div>
    </Container>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-border-subtle bg-surface px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-ink-900">No auctions match those filters</h2>
      <p className="mt-2 text-sm text-ink-500">
        Try widening your search — clear a filter, or search a different locality.
      </p>
      <Link
        href="/explore"
        className="mt-5 inline-flex h-10 items-center rounded-btn bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Clear all filters
      </Link>
    </div>
  );
}
