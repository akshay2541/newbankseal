import type { CityFacet, ListingCard } from '@/domain/listing';
import { buildSeedListings, SEED_BANKS, SEED_CITIES } from '@/db/seed-data';

/**
 * Projects the seed dataset into the DTO shape the UI expects.
 *
 * Shared by the homepage and browse-page fallbacks so the two can't drift: previously
 * each mapped the seed rows itself, and adding a field to `ListingCard` meant fixing it
 * in two places or shipping one page with stale data.
 *
 * Development-only. `getHomepageData` and `getExplorePageData` both refuse to reach
 * these when a production process is actually serving requests.
 */

export type SeedListing = ReturnType<typeof buildSeedListings>[number];

export function toCityFacet(city: (typeof SEED_CITIES)[number]): CityFacet {
  return { slug: city.slug, name: city.name, state: city.state, listingCount: city.listingCount };
}

export function toListingCard(listing: SeedListing): ListingCard {
  const city = SEED_CITIES.find((entry) => entry.slug === listing.citySlug);
  const bank = SEED_BANKS.find((entry) => entry.slug === listing.bankSlug);

  const previous = listing.previousReservePriceInr;
  const drop =
    previous !== null && previous > listing.reservePriceInr
      ? Math.floor(((previous - listing.reservePriceInr) / previous) * 100)
      : null;

  return {
    id: listing.referenceNo,
    slug: listing.slug,
    title: listing.title,
    locationLabel: [listing.locality, city?.name, city?.state].filter(Boolean).join(', '),
    bankName: bank?.name ?? 'Partner bank',
    bankLogoUrl: bank?.logoUrl ?? null,
    // `land` has no card treatment of its own; it presents as commercial.
    assetType: listing.assetType === 'land' ? 'commercial' : listing.assetType,
    saleType: listing.saleType,
    reservePriceInr: listing.reservePriceInr,
    emdAmountInr: listing.emdAmountInr,
    areaSqft: listing.areaSqft,
    auctionDate: listing.auctionStartsAt,
    imageUrl: listing.imageUrl,
    imageAlt: `${listing.title}, ${city?.name ?? ''}`.trim(),
    isFeatured: listing.isFeatured,
    priceDropPercent: drop && drop > 0 ? drop : null,
    possessionType: listing.possessionType,
    isReauction: listing.isReauction,
    previousReservePriceInr: previous,
    // The seed carries one photograph per lot; a plausible gallery count keeps the
    // "N Photos" affordance meaningful without inventing images that don't exist.
    photoCount: 1,
  };
}

/** Every seeded listing, projected once and reused. */
export const SEED_LISTING_CARDS: ListingCard[] = buildSeedListings().map(toListingCard);
