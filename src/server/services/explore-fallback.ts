import { SEED_BANKS, SEED_CATEGORIES, SEED_CITIES } from '@/db/seed-data';
import type { ListingCard, LocalityFacet } from '@/domain/listing';
import type { ExploreQuery } from '@/lib/validation/auth';
import { SEED_LISTING_CARDS } from './seed-projection';
import type { ExplorePageData } from './explore-service';

/**
 * Development-only browse results.
 *
 * Applies the same filters, ordering and pagination as the SQL path so the page can be
 * exercised end to end — filter pills, sorting, paging — before Neon is provisioned.
 * Deliberately mirrors `searchListings`; if the two disagree, the SQL is authoritative.
 */

const PER_PAGE = 12;

function cityNameFor(slug: string | undefined): string | null {
  if (!slug) return null;
  return SEED_CITIES.find((city) => city.slug === slug)?.name ?? null;
}

function matches(listing: ListingCard, query: ExploreQuery): boolean {
  if (query.city) {
    const name = cityNameFor(query.city);
    if (!name || !listing.locationLabel.includes(name)) return false;
  }

  if (query.bank) {
    const bank = SEED_BANKS.find((entry) => entry.slug === query.bank);
    if (!bank || listing.bankName !== bank.name) return false;
  }

  if (query.category) {
    const category = SEED_CATEGORIES.find((entry) => entry.slug === query.category);
    if (!category) return false;
    const assetType = category.assetType === 'land' ? 'commercial' : category.assetType;
    if (listing.assetType !== assetType) return false;
  }

  if (query.possession && listing.possessionType !== query.possession) return false;
  if (query.tag === 'popular' && !listing.isFeatured) return false;
  if (query.tag === 'car-auction' && listing.assetType !== 'vehicle') return false;

  if (query.q) {
    const term = query.q.toLowerCase();
    const haystack = `${listing.title} ${listing.locationLabel} ${listing.bankName}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  return true;
}

function sortListings(items: ListingCard[], sort: ExploreQuery['sort']): ListingCard[] {
  const sorted = [...items];
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => a.reservePriceInr - b.reservePriceInr);
    case 'price_desc':
      return sorted.sort((a, b) => b.reservePriceInr - a.reservePriceInr);
    case 'featured':
      return sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    default:
      return sorted;
  }
}

export function buildExploreFallback(query: ExploreQuery): ExplorePageData {
  const filtered = sortListings(
    SEED_LISTING_CARDS.filter((listing) => matches(listing, query)),
    query.sort,
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(query.page, totalPages);

  const localities: LocalityFacet[] = query.city
    ? Object.entries(
        SEED_LISTING_CARDS.filter((listing) => matches(listing, { ...query, q: undefined, page: 1, sort: 'newest' }))
          .map((listing) => listing.locationLabel.split(', ')[0] ?? '')
          .filter(Boolean)
          .reduce<Record<string, number>>((acc, locality) => {
            acc[locality] = (acc[locality] ?? 0) + 1;
            return acc;
          }, {}),
      )
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 10)
        .map(([locality, count]) => ({
          locality,
          citySlug: query.city as string,
          cityName: cityNameFor(query.city) ?? '',
          listingCount: count,
        }))
    : [];

  return {
    results: {
      items: filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
      total,
      page,
      perPage: PER_PAGE,
      totalPages,
    },
    localities,
    banks: SEED_BANKS.map((bank) => ({
      slug: bank.slug,
      name: bank.name,
      shortName: bank.shortName,
      listingCount: bank.listingCount,
      logoUrl: bank.logoUrl,
    })),
    categories: SEED_CATEGORIES.map((category) => ({
      slug: category.slug,
      name: category.name,
      iconKey: category.iconKey,
      listingCount: category.listingCount,
      assetType: category.assetType,
    })),
    cityName: cityNameFor(query.city),
  };
}
