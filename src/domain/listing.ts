/**
 * Data-transfer types shared by the server and the browser.
 *
 * These are deliberately narrower than the database rows: no internal ids beyond the
 * public slug, no ownership columns, no draft-only fields. A repository must map a row
 * into one of these before it can cross into a component, which makes over-fetching a
 * visible mistake rather than a silent leak.
 *
 * Money crosses the boundary as a plain number of rupees — `bigint` is not JSON
 * serialisable and paise precision is not needed for display.
 */

export type AssetType = 'residential' | 'commercial' | 'industrial' | 'vehicle' | 'machinery' | 'gold' | 'land';

export type SaleType = 'sarfaesi' | 'liquidation' | 'drt' | 'private_treaty';

export type PossessionType = 'physical' | 'symbolic' | 'constructive';

export interface ListingCard {
  id: string;
  slug: string;
  title: string;
  /** Pre-composed "Locality, City, State" line. */
  locationLabel: string;
  bankName: string;
  assetType: AssetType;
  saleType: SaleType;
  reservePriceInr: number;
  emdAmountInr: number;
  areaSqft: number | null;
  auctionDate: string | null;
  imageUrl: string | null;
  imageAlt: string;
  isFeatured: boolean;
  /** Percentage below a previous reserve price, when the bank has revised it down. */
  priceDropPercent: number | null;
  possessionType: PossessionType;
  isReauction: boolean;
  /** Prior reserve price in rupees. Only set when the bank revised it downward. */
  previousReservePriceInr: number | null;
  /** Number of photographs on the lot, so the card can advertise a gallery. */
  photoCount: number;
  bankLogoUrl: string | null;
}

/** One page of search results plus what the UI needs to render pagination. */
export interface ListingSearchResult {
  items: ListingCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** A locality within a city, for the "Top Localities" rail. */
export interface LocalityFacet {
  locality: string;
  citySlug: string;
  cityName: string;
  listingCount: number;
}

export const POSSESSION_LABEL: Record<PossessionType, string> = {
  physical: 'Physical Possession',
  symbolic: 'Symbolic Possession',
  constructive: 'Constructive Possession',
};

export interface CityFacet {
  slug: string;
  name: string;
  state: string;
  listingCount: number;
}

export interface BankFacet {
  slug: string;
  name: string;
  shortName: string | null;
  listingCount: number;
  /** Bank mark. Null until real logo assets are supplied; the UI falls back to a monogram. */
  logoUrl: string | null;
}

export interface CategoryFacet {
  slug: string;
  name: string;
  iconKey: string;
  listingCount: number;
  /** Drives how the category dropdown groups its options. */
  assetType: AssetType;
}

export interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readMinutes: number;
  publishedAt: string | null;
}

export const SALE_TYPE_LABEL: Record<SaleType, string> = {
  sarfaesi: 'SARFAESI',
  liquidation: 'Liquidation',
  drt: 'DRT',
  private_treaty: 'Private Treaty',
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  vehicle: 'Vehicle',
  machinery: 'Plant & Machinery',
  gold: 'Gold',
  land: 'Land',
};

/**
 * A field the viewer may not be entitled to see.
 *
 * Modelled as a discriminated union rather than a nullable string so that "locked" and
 * "genuinely empty" can't be confused, and so a locked field carries no value at all.
 * The detail page blurs these in the UI — but the blur is decoration; the guarantee is
 * that the server never puts the value in the payload for an unentitled viewer.
 */
export type GatedField =
  | { locked: true }
  | { locked: false; value: string | null };

export interface GatedContact {
  locked: boolean;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface ListingImageItem {
  url: string;
  alt: string;
}

/** One reading in the listing's risk summary. */
export interface ListingSignal {
  tone: 'positive' | 'caution' | 'negative';
  text: string;
}

/** The full detail view. Strictly wider than `ListingCard`, and never used in lists. */
export interface ListingDetail {
  id: string;
  slug: string;
  referenceNo: string;
  title: string;
  description: string | null;

  assetType: AssetType;
  saleType: SaleType;
  possessionType: PossessionType;

  bankName: string;
  bankSlug: string;
  bankLogoUrl: string | null;

  cityName: string;
  cityState: string;
  citySlug: string;
  locality: string | null;
  buildingName: string | null;

  propertyTypeLabel: string;
  /** Area exactly as the auction notice quotes it, e.g. "144.093 Sq Yards". */
  areaLabel: string | null;
  areaSqft: number | null;

  reservePriceInr: number;
  emdAmountInr: number;
  bidIncrementInr: number | null;

  emdDueAt: string | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;

  images: ListingImageItem[];
  isReauction: boolean;
  previousReservePriceInr: number | null;
  priceDropPercent: number | null;

  /**
   * Approximate coordinates for the map, at locality rather than building precision —
   * the exact address is gated, so a doorstep-accurate pin would leak it.
   */
  latitude: number | null;
  longitude: number | null;
  nearbyPlaces: NearbyPlace[];

  /** Gated behind entitlement — see `GatedField`. */
  borrowerName: GatedField;
  fullAddress: GatedField;
  bankContact: GatedContact;
  auctionFileUrl: GatedField;
}

export const POSSESSION_DETAIL_LABEL: Record<PossessionType, string> = {
  physical: 'PHYSICAL',
  symbolic: 'SYMBOLIC',
  constructive: 'CONSTRUCTIVE',
};

export const AREA_UNIT_LABEL: Record<string, string> = {
  sqft: 'Sq Ft',
  sqyd: 'Sq Yards',
  sqm: 'Sq Metres',
  acre: 'Acres',
  hectare: 'Hectares',
};

export type NearbyCategory = 'connectivity' | 'hospital' | 'school' | 'restaurant' | 'banking';

export interface NearbyPlace {
  id: string;
  category: NearbyCategory;
  name: string;
  distanceKm: number;
  latitude: number | null;
  longitude: number | null;
}

export const NEARBY_CATEGORY_LABEL: Record<NearbyCategory, string> = {
  connectivity: 'Connectivity',
  hospital: 'Hospital',
  school: 'School',
  restaurant: 'Restaurant',
  banking: 'Banking',
};

/** Tab order on the detail page. */
export const NEARBY_CATEGORY_ORDER: readonly NearbyCategory[] = [
  'connectivity',
  'hospital',
  'school',
  'restaurant',
  'banking',
];
