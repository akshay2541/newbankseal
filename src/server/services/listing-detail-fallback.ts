import { SEED_BANKS, SEED_CITIES, buildSeedListings } from '@/db/seed-data';
import type { ListingDetail, NearbyCategory, NearbyPlace } from '@/domain/listing';
import { SEED_LISTING_CARDS } from './seed-projection';
import { scoreListing, type ListingDetailData } from './listing-detail-service';

/**
 * Development-only detail view, projected from the seed dataset.
 *
 * Applies the same entitlement rule as the SQL path: when the viewer cannot see
 * protected fields this builds the locked variant rather than the value, so the
 * fallback cannot leak something the real query would have withheld.
 */
/**
 * Representative points of interest, so the tabs and list can be exercised before the
 * real table is populated. Distances are illustrative, like the rest of the fallback.
 */
const SAMPLE_NEARBY: NearbyPlace[] = (
  [
    ['connectivity', 'Pune Railway Station', 3.2, 18.5286, 73.8743],
    ['connectivity', 'Shivajinagar Bus Stand', 2.6, 18.5308, 73.8475],
    ['connectivity', 'Pune International Airport', 9.4, 18.5793, 73.9089],
    ['connectivity', 'Mumbai-Pune Expressway', 6.1, 18.5089, 73.7997],
    ['connectivity', 'Hinjewadi IT Park', 12.8, 18.5913, 73.7389],
    ['hospital', 'Sassoon General Hospital', 2.9, 18.5279, 73.8712],
    ['hospital', 'Ruby Hall Clinic', 1.8, 18.5362, 73.8776],
    ['hospital', 'Jehangir Hospital', 2.4, 18.5309, 73.8748],
    ['school', 'Symbiosis International School', 4.5, 18.5515, 73.8236],
    ['school', 'Bishops School Camp', 2.1, 18.5236, 73.8790],
    ['school', 'Fergusson College', 3.7, 18.5218, 73.8412],
    ['restaurant', 'Vaishali', 3.4, 18.5215, 73.8404],
    ['restaurant', 'German Bakery', 2.2, 18.5362, 73.8869],
    ['banking', 'State Bank of India, Camp', 2.5, 18.5164, 73.8779],
    ['banking', 'Bank of Maharashtra, FC Road', 3.1, 18.5228, 73.8408],
  ] as const
).map(([category, name, distanceKm, latitude, longitude], index) => ({
  id: `nearby-${index}`,
  category: category as NearbyCategory,
  name,
  distanceKm,
  latitude,
  longitude,
}));

export function buildListingDetailFallback(slug: string, canViewProtected: boolean): ListingDetailData | null {
  const seed = buildSeedListings().find((entry) => entry.slug === slug);
  if (!seed) return null;

  const city = SEED_CITIES.find((entry) => entry.slug === seed.citySlug);
  const bank = SEED_BANKS.find((entry) => entry.slug === seed.bankSlug);

  const previous = seed.previousReservePriceInr;
  const drop =
    previous !== null && previous > seed.reservePriceInr
      ? Math.floor(((previous - seed.reservePriceInr) / previous) * 100)
      : null;

  const gallery = [seed.imageUrl, ...SEED_LISTING_CARDS.slice(0, 5).map((card) => card.imageUrl)]
    .filter((url): url is string => Boolean(url))
    .slice(0, 6)
    .map((url) => ({ url, alt: seed.title }));

  const listing: ListingDetail = {
    id: seed.referenceNo,
    slug: seed.slug,
    referenceNo: seed.referenceNo,
    title: seed.title,
    description:
      'Sample record served while no database is configured. Reserve price, EMD and auction dates shown here are illustrative and must not be relied on for bidding.',
    assetType: seed.assetType === 'land' ? 'commercial' : seed.assetType,
    saleType: seed.saleType,
    possessionType: seed.possessionType,
    bankName: bank?.name ?? 'Partner bank',
    bankSlug: seed.bankSlug,
    bankLogoUrl: bank?.logoUrl ?? null,
    cityName: city?.name ?? '',
    cityState: city?.state ?? '',
    citySlug: seed.citySlug,
    locality: seed.locality,
    buildingName: null,
    propertyTypeLabel: 'Residential Property',
    areaLabel: `${seed.areaSqft.toLocaleString('en-IN')} Sq Ft`,
    areaSqft: seed.areaSqft,
    reservePriceInr: seed.reservePriceInr,
    emdAmountInr: seed.emdAmountInr,
    bidIncrementInr: 10000,
    emdDueAt: seed.auctionStartsAt,
    auctionStartsAt: seed.auctionStartsAt,
    auctionEndsAt: seed.auctionStartsAt,
    images: gallery,
    // Pune's centroid, which is the precision the real column is meant to hold.
    latitude: 18.5204,
    longitude: 73.8567,
    nearbyPlaces: SAMPLE_NEARBY,
    isReauction: seed.isReauction,
    previousReservePriceInr: previous,
    priceDropPercent: drop,
    borrowerName: canViewProtected ? { locked: false, value: 'Sample Borrower' } : { locked: true },
    fullAddress: canViewProtected
      ? { locked: false, value: [seed.locality, city?.name, city?.state].filter(Boolean).join(', ') }
      : { locked: true },
    bankContact: canViewProtected
      ? { locked: false, name: 'Auction Desk', phone: '+91 00000 00000', email: 'auctions@example.bank' }
      : { locked: true, name: null, phone: null, email: null },
    auctionFileUrl: canViewProtected ? { locked: false, value: null } : { locked: true },
  };

  const similar = SEED_LISTING_CARDS.filter(
    (card) => card.slug !== slug && Boolean(city) && card.locationLabel.includes(city!.name),
  ).slice(0, 9);

  return { listing, similar, score: scoreListing(listing, similar.length * 8), canViewProtected };
}
