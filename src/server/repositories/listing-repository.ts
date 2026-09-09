import 'server-only';

import { and, asc, desc, eq, ilike, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  articles,
  banks,
  categories,
  cities,
  listingImages,
  listingNearbyPlaces,
  listings,
} from '@/db/schema';
import type {
  ArticleCard,
  AssetType,
  ListingCard,
  ListingDetail,
  NearbyPlace,
  ListingSearchResult,
  LocalityFacet,
  PossessionType,
  SaleType,
} from '@/domain/listing';
import { AREA_UNIT_LABEL } from '@/domain/listing';

/**
 * Read access to listings.
 *
 * `publicScope()` is the single source of truth for "what an anonymous visitor may
 * see". Every public query composes it, so a listing that is a draft, withdrawn or
 * soft-deleted cannot be reached by guessing an id or a slug — the IDOR surface is
 * closed at the query, not at the template.
 *
 * All values are bound by Drizzle as query parameters; no SQL is assembled from strings.
 */
function publicScope(): SQL {
  const scope = and(
    isNull(listings.deletedAt),
    sql`${listings.status} in ('published', 'auction_live')`,
  );
  // `and()` with non-empty arguments always returns an SQL node.
  return scope as SQL;
}

/** Columns a public consumer is allowed to receive. Ownership columns are absent. */
const cardColumns = {
  id: listings.id,
  slug: listings.slug,
  title: listings.title,
  locality: listings.locality,
  assetType: listings.assetType,
  saleType: listings.saleType,
  reservePricePaise: listings.reservePricePaise,
  emdAmountPaise: listings.emdAmountPaise,
  areaSqft: listings.areaSqft,
  auctionStartsAt: listings.auctionStartsAt,
  isFeatured: listings.isFeatured,
  cityName: cities.name,
  cityState: cities.state,
  bankName: banks.name,
  bankLogoUrl: banks.logoUrl,
  possessionType: listings.possessionType,
  isReauction: listings.isReauction,
  previousReservePricePaise: listings.previousReservePricePaise,
  imageUrl: sql<string | null>`(
    select li.url from ${listingImages} li
    where li.listing_id = ${listings.id}
    order by li.position asc
    limit 1
  )`.as('image_url'),
  photoCount: sql<number>`(
    select count(*)::int from ${listingImages} li where li.listing_id = ${listings.id}
  )`.as('photo_count'),
} as const;

type CardRow = {
  id: string;
  slug: string;
  title: string;
  locality: string | null;
  assetType: AssetType;
  saleType: SaleType;
  reservePricePaise: bigint;
  emdAmountPaise: bigint;
  areaSqft: number | null;
  auctionStartsAt: Date | null;
  isFeatured: boolean;
  cityName: string;
  cityState: string;
  bankName: string;
  bankLogoUrl: string | null;
  possessionType: PossessionType;
  isReauction: boolean;
  previousReservePricePaise: bigint | null;
  imageUrl: string | null;
  photoCount: number;
};

function toCard(row: CardRow): ListingCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    locationLabel: [row.locality, row.cityName, row.cityState].filter(Boolean).join(', '),
    bankName: row.bankName,
    assetType: row.assetType,
    saleType: row.saleType,
    reservePriceInr: Number(row.reservePricePaise) / 100,
    emdAmountInr: Number(row.emdAmountPaise) / 100,
    areaSqft: row.areaSqft,
    auctionDate: row.auctionStartsAt?.toISOString() ?? null,
    imageUrl: row.imageUrl,
    imageAlt: `${row.title}, ${row.cityName}`,
    isFeatured: row.isFeatured,
    priceDropPercent: dropPercent(row.previousReservePricePaise, row.reservePricePaise),
    possessionType: row.possessionType,
    isReauction: row.isReauction,
    previousReservePriceInr:
      row.previousReservePricePaise === null ? null : Number(row.previousReservePricePaise) / 100,
    photoCount: row.photoCount,
    bankLogoUrl: row.bankLogoUrl,
  };
}

/**
 * Percentage the reserve has been cut by, rounded down.
 *
 * Returns null unless the bank actually revised the price downward — a "drop" badge is
 * a claim about money, so it is only ever derived from a real prior figure, never
 * inferred or rounded up to look better.
 */
function dropPercent(previous: bigint | null, current: bigint): number | null {
  if (previous === null || previous <= current) return null;
  const percent = Math.floor((Number(previous - current) / Number(previous)) * 100);
  return percent > 0 ? percent : null;
}

/** Most recently published listings, for the "New Listed Properties" rail. */
export async function findRecentListings(limit = 12): Promise<ListingCard[]> {
  const rows = await db
    .select(cardColumns)
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(banks, eq(banks.id, listings.bankId))
    .where(publicScope())
    .orderBy(desc(listings.publishedAt))
    .limit(clampLimit(limit));

  return rows.map((row) => toCard(row as CardRow));
}

/** Curated listings for the "Top Properties" rail. */
export async function findFeaturedListings(limit = 12): Promise<ListingCard[]> {
  const rows = await db
    .select(cardColumns)
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(banks, eq(banks.id, listings.bankId))
    .where(and(publicScope(), eq(listings.isFeatured, true)))
    .orderBy(desc(listings.publishedAt))
    .limit(clampLimit(limit));

  return rows.map((row) => toCard(row as CardRow));
}

export async function findPublishedArticles(limit = 6): Promise<ArticleCard[]> {
  const rows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      readMinutes: articles.readMinutes,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(sql`${articles.publishedAt} is not null and ${articles.publishedAt} <= now()`)
    .orderBy(desc(articles.publishedAt))
    .limit(clampLimit(limit));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }));
}

/**
 * Hard ceiling on page size. A caller-supplied limit must never reach the database
 * unbounded — that is a trivial denial-of-service vector on a shared Postgres.
 */
function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 12;
  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

export interface ListingSearchParams {
  q?: string;
  city?: string;
  category?: string;
  bank?: string;
  possession?: PossessionType;
  tag?: 'popular' | 'car-auction';
  sort?: 'newest' | 'featured' | 'price_asc' | 'price_desc';
  page?: number;
  perPage?: number;
}

const PER_PAGE_DEFAULT = 12;
const PER_PAGE_MAX = 48;

/**
 * Filtered, paginated listing search for the browse page.
 *
 * Every filter is composed onto `publicScope()`, so no combination of query parameters
 * can surface a draft, withdrawn or soft-deleted lot. All values are bound as query
 * parameters by Drizzle — including the free-text term, which goes through `ilike` with
 * its wildcards escaped rather than being concatenated into SQL.
 *
 * Count and page are fetched concurrently: the total drives pagination and is needed
 * even when the current page is empty.
 */
export async function searchListings(params: ListingSearchParams): Promise<ListingSearchResult> {
  const page = clampPage(params.page);
  const perPage = Math.min(Math.max(Math.trunc(params.perPage ?? PER_PAGE_DEFAULT), 1), PER_PAGE_MAX);

  const filters: SQL[] = [publicScope()];

  if (params.city) filters.push(eq(cities.slug, params.city));
  if (params.bank) filters.push(eq(banks.slug, params.bank));
  if (params.category) filters.push(eq(categories.slug, params.category));
  if (params.possession) filters.push(eq(listings.possessionType, params.possession));

  // Pill shortcuts. `popular` leans on the curated flag rather than inventing a metric.
  if (params.tag === 'popular') filters.push(eq(listings.isFeatured, true));
  if (params.tag === 'car-auction') filters.push(eq(listings.assetType, 'vehicle'));

  if (params.q) {
    const term = `%${escapeLike(params.q)}%`;
    const text = or(
      ilike(listings.title, term),
      ilike(listings.locality, term),
      ilike(cities.name, term),
      ilike(banks.name, term),
    );
    if (text) filters.push(text);
  }

  const where = and(...filters) as SQL;

  const base = db
    .select(cardColumns)
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(banks, eq(banks.id, listings.bankId))
    .leftJoin(categories, eq(categories.id, listings.categoryId))
    .where(where);

  const [rows, totalRows] = await Promise.all([
    base.orderBy(...orderFor(params.sort)).limit(perPage).offset((page - 1) * perPage),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(listings)
      .innerJoin(cities, eq(cities.id, listings.cityId))
      .innerJoin(banks, eq(banks.id, listings.bankId))
      .leftJoin(categories, eq(categories.id, listings.categoryId))
      .where(where),
  ]);

  const total = totalRows[0]?.total ?? 0;

  return {
    items: rows.map((row) => toCard(row as CardRow)),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Localities with live inventory in a city, most active first. */
export async function findLocalityFacets(citySlug: string, limit = 10): Promise<LocalityFacet[]> {
  const rows = await db
    .select({
      locality: listings.locality,
      citySlug: cities.slug,
      cityName: cities.name,
      listingCount: sql<number>`count(*)::int`,
    })
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .where(and(publicScope(), eq(cities.slug, citySlug), sql`${listings.locality} is not null`))
    .groupBy(listings.locality, cities.slug, cities.name)
    .orderBy(sql`count(*) desc`)
    .limit(clampLimit(limit));

  return rows
    .filter((row): row is typeof row & { locality: string } => Boolean(row.locality))
    .map((row) => ({
      locality: row.locality,
      citySlug: row.citySlug,
      cityName: row.cityName,
      listingCount: row.listingCount,
    }));
}

function orderFor(sort: ListingSearchParams['sort']) {
  switch (sort) {
    case 'price_asc':
      return [asc(listings.reservePricePaise)];
    case 'price_desc':
      return [desc(listings.reservePricePaise)];
    case 'featured':
      return [desc(listings.isFeatured), desc(listings.publishedAt)];
    default:
      return [desc(listings.publishedAt)];
  }
}

/**
 * Neutralise LIKE wildcards in user input.
 *
 * Without this a search for `%` matches every row and `_` matches any character — not
 * an injection (values are still bound), but it lets a visitor turn a filtered query
 * into a full-table scan.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function clampPage(page: number | undefined): number {
  if (!page || !Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), 500);
}

/**
 * Full detail for one listing, by slug.
 *
 * Composes `publicScope()` like every other public read, so a draft or withdrawn lot
 * cannot be reached by guessing a slug — the same guard that protects the browse page.
 *
 * `canViewProtected` decides whether the personal and contact columns are selected at
 * all. That check happens here rather than in the component: an unentitled viewer's
 * payload never contains the borrower's name or the bank's direct line, so no amount of
 * inspecting the page or the network response reveals them. Blurring in CSS while
 * shipping the value would be theatre.
 */
export async function findListingBySlug(
  slug: string,
  options: { canViewProtected: boolean },
): Promise<ListingDetail | null> {
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      referenceNo: listings.referenceNo,
      title: listings.title,
      description: listings.description,
      assetType: listings.assetType,
      saleType: listings.saleType,
      possessionType: listings.possessionType,
      locality: listings.locality,
      buildingName: listings.buildingName,
      addressLine: listings.addressLine,
      areaSqft: listings.areaSqft,
      areaValue: listings.areaValue,
      areaUnit: listings.areaUnit,
      reservePricePaise: listings.reservePricePaise,
      emdAmountPaise: listings.emdAmountPaise,
      bidIncrementPaise: listings.bidIncrementPaise,
      previousReservePricePaise: listings.previousReservePricePaise,
      isReauction: listings.isReauction,
      emdDueAt: listings.emdDueAt,
      auctionStartsAt: listings.auctionStartsAt,
      auctionEndsAt: listings.auctionEndsAt,
      borrowerName: listings.borrowerName,
      latitude: listings.latitude,
      longitude: listings.longitude,
      cityName: cities.name,
      cityState: cities.state,
      citySlug: cities.slug,
      bankName: banks.name,
      bankSlug: banks.slug,
      bankLogoUrl: banks.logoUrl,
      bankContactName: banks.contactName,
      bankContactPhone: banks.contactPhone,
      bankContactEmail: banks.contactEmail,
      categoryName: categories.name,
    })
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(banks, eq(banks.id, listings.bankId))
    .leftJoin(categories, eq(categories.id, listings.categoryId))
    .where(and(publicScope(), eq(listings.slug, slug)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [images, nearby] = await Promise.all([
    db
      .select({ url: listingImages.url, alt: listingImages.alt })
      .from(listingImages)
      .where(eq(listingImages.listingId, row.id))
      .orderBy(asc(listingImages.position)),
    db
      .select({
        id: listingNearbyPlaces.id,
        category: listingNearbyPlaces.category,
        name: listingNearbyPlaces.name,
        distanceKm: listingNearbyPlaces.distanceKm,
        latitude: listingNearbyPlaces.latitude,
        longitude: listingNearbyPlaces.longitude,
      })
      .from(listingNearbyPlaces)
      .where(eq(listingNearbyPlaces.listingId, row.id))
      .orderBy(asc(listingNearbyPlaces.position)),
  ]);

  const { canViewProtected } = options;

  return {
    id: row.id,
    slug: row.slug,
    referenceNo: row.referenceNo,
    title: row.title,
    description: row.description,
    assetType: row.assetType,
    saleType: row.saleType,
    possessionType: row.possessionType,
    bankName: row.bankName,
    bankSlug: row.bankSlug,
    bankLogoUrl: row.bankLogoUrl,
    cityName: row.cityName,
    cityState: row.cityState,
    citySlug: row.citySlug,
    locality: row.locality,
    buildingName: row.buildingName,
    propertyTypeLabel: row.categoryName ?? ASSET_TYPE_FALLBACK[row.assetType],
    areaLabel: formatAreaLabel(row.areaValue, row.areaUnit),
    areaSqft: row.areaSqft,
    reservePriceInr: Number(row.reservePricePaise) / 100,
    emdAmountInr: Number(row.emdAmountPaise) / 100,
    bidIncrementInr: row.bidIncrementPaise === null ? null : Number(row.bidIncrementPaise) / 100,
    emdDueAt: row.emdDueAt?.toISOString() ?? null,
    auctionStartsAt: row.auctionStartsAt?.toISOString() ?? null,
    auctionEndsAt: row.auctionEndsAt?.toISOString() ?? null,
    images: images.map((image) => ({ url: image.url, alt: image.alt ?? row.title })),
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    nearbyPlaces: nearby.map(
      (place): NearbyPlace => ({
        id: place.id,
        category: place.category,
        name: place.name,
        distanceKm: Number(place.distanceKm),
        latitude: toNumber(place.latitude),
        longitude: toNumber(place.longitude),
      }),
    ),
    isReauction: row.isReauction,
    previousReservePriceInr:
      row.previousReservePricePaise === null ? null : Number(row.previousReservePricePaise) / 100,
    priceDropPercent: dropPercent(row.previousReservePricePaise, row.reservePricePaise),

    borrowerName: canViewProtected ? { locked: false, value: row.borrowerName } : { locked: true },
    fullAddress: canViewProtected ? { locked: false, value: row.addressLine } : { locked: true },
    bankContact: canViewProtected
      ? {
          locked: false,
          name: row.bankContactName,
          phone: row.bankContactPhone,
          email: row.bankContactEmail,
        }
      : { locked: true, name: null, phone: null, email: null },
    // The notice PDF is not yet stored; the slot is gated the same way so wiring the
    // real file later is a data change, not a permissions change.
    auctionFileUrl: canViewProtected ? { locked: false, value: null } : { locked: true },
  };
}

/** Listings a viewer of this one is likely to want next: same city, excluding itself. */
export async function findSimilarListings(
  listingId: string,
  citySlug: string,
  limit = 3,
): Promise<ListingCard[]> {
  const rows = await db
    .select(cardColumns)
    .from(listings)
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(banks, eq(banks.id, listings.bankId))
    .where(and(publicScope(), eq(cities.slug, citySlug), ne(listings.id, listingId)))
    .orderBy(desc(listings.publishedAt))
    .limit(clampLimit(limit));

  return rows.map((row) => toCard(row as CardRow));
}

const ASSET_TYPE_FALLBACK: Record<AssetType, string> = {
  residential: 'Residential Property',
  commercial: 'Commercial Property',
  industrial: 'Industrial Property',
  vehicle: 'Vehicle',
  machinery: 'Plant & Machinery',
  gold: 'Gold',
  land: 'Land',
};

/**
 * Render the area the way the notice quotes it.
 *
 * `numeric` comes back as a string to preserve precision, so trailing zeros are
 * trimmed rather than the value being coerced through a float.
 */
function formatAreaLabel(value: string | null, unit: string | null): string | null {
  if (!value || !unit) return null;
  const trimmed = value.replace(/\.?0+$/, '');
  return `${trimmed} ${AREA_UNIT_LABEL[unit] ?? unit}`;
}

/** `numeric` arrives as a string to preserve precision; convert only at the boundary. */
function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
