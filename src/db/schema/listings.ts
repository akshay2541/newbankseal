import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  numeric,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { banks, categories, cities } from './catalog';
import {
  areaUnitEnum,
  nearbyCategoryEnum,
  assetTypeEnum,
  enquiryStatusEnum,
  listingStatusEnum,
  possessionTypeEnum,
  saleTypeEnum,
} from './enums';
import { users } from './users';

/**
 * A single asset put up for auction.
 *
 * Monetary columns are `bigint` paise, never floats — rounding drift on a reserve
 * price is a financial defect. Public read paths must filter on `status = 'published'`
 * or `'auction_live'`; `publicListings` in the repository layer enforces this so an
 * IDOR on a draft id cannot leak an unreviewed listing.
 */
export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Human-quotable reference shown in the UI and in bank correspondence. */
    referenceNo: varchar('reference_no', { length: 32 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull(),

    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),

    assetType: assetTypeEnum('asset_type').notNull(),
    saleType: saleTypeEnum('sale_type').notNull().default('sarfaesi'),
    status: listingStatusEnum('status').notNull().default('draft'),

    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    bankId: uuid('bank_id')
      .notNull()
      .references(() => banks.id, { onDelete: 'restrict' }),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict' }),

    addressLine: varchar('address_line', { length: 300 }),
    locality: varchar('locality', { length: 120 }),
    pincode: varchar('pincode', { length: 6 }),

    /**
     * Approximate coordinates for the map. Deliberately imprecise: the exact address is
     * a gated field, so pinning the map to the doorstep would leak it to anyone who can
     * read a marker. Populate these to locality centroid accuracy, not building level.
     */
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),

    areaSqft: integer('area_sqft'),
    /**
     * Area as the notice actually quotes it. `areaSqft` stays the normalised value for
     * sorting and comparison; these two preserve the original figure so the detail page
     * doesn't silently restate "144.093 Sq Yards" as a converted square-foot number.
     */
    areaValue: numeric('area_value', { precision: 12, scale: 3 }),
    areaUnit: areaUnitEnum('area_unit'),

    /** Building or project name, where the notice gives one. */
    buildingName: varchar('building_name', { length: 160 }),

    /**
     * Borrower whose asset is being sold. Personal data attached to a financial
     * default — never included in a public projection; released only through the
     * gated detail query to an entitled viewer, and its disclosure is audited.
     */
    borrowerName: varchar('borrower_name', { length: 160 }),

    /** Minimum increment between bids, in paise. */
    bidIncrementPaise: bigint('bid_increment_paise', { mode: 'bigint' }),
    /** Reserve price in paise. */
    reservePricePaise: bigint('reserve_price_paise', { mode: 'bigint' }).notNull(),
    /** Earnest money deposit in paise. */
    emdAmountPaise: bigint('emd_amount_paise', { mode: 'bigint' }).notNull(),

    emdDueAt: timestamp('emd_due_at', { withTimezone: true }),
    auctionStartsAt: timestamp('auction_starts_at', { withTimezone: true }),
    auctionEndsAt: timestamp('auction_ends_at', { withTimezone: true }),

    possessionType: possessionTypeEnum('possession_type').notNull().default('physical'),

    /**
     * Set when a lot failed to sell and is being re-offered. Buyers treat a re-auction
     * differently, so it is stored rather than inferred from dates.
     */
    isReauction: boolean('is_reauction').notNull().default(false),
    /**
     * The reserve price before the most recent revision, in paise. Present only when the
     * bank has actually revised it down — the "x% drop" badge is computed from this and
     * must never be fabricated from an unrelated figure.
     */
    previousReservePricePaise: bigint('previous_reserve_price_paise', { mode: 'bigint' }),

    isFeatured: boolean('is_featured').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),

    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('listings_reference_no_key').on(table.referenceNo),
    uniqueIndex('listings_slug_key').on(table.slug),
    // Drives the "browse by city / category" filters, which are the hottest queries.
    index('listings_status_published_at_idx').on(table.status, table.publishedAt.desc()),
    index('listings_city_status_idx').on(table.cityId, table.status),
    index('listings_bank_status_idx').on(table.bankId, table.status),
    index('listings_category_status_idx').on(table.categoryId, table.status),
    index('listings_featured_idx').on(table.isFeatured, table.publishedAt.desc()),
    index('listings_status_possession_idx').on(table.status, table.possessionType),
    index('listings_auction_starts_idx').on(table.auctionStartsAt),
    check('listings_reserve_price_positive', sql`${table.reservePricePaise} > 0`),
    check('listings_emd_non_negative', sql`${table.emdAmountPaise} >= 0`),
    check(
      'listings_previous_price_higher',
      sql`${table.previousReservePricePaise} is null or ${table.previousReservePricePaise} > ${table.reservePricePaise}`,
    ),
    check('listings_area_positive', sql`${table.areaSqft} is null or ${table.areaSqft} > 0`),
    check('listings_area_value_positive', sql`${table.areaValue} is null or ${table.areaValue} > 0`),
    check('listings_bid_increment_positive', sql`${table.bidIncrementPaise} is null or ${table.bidIncrementPaise} > 0`),
    check('listings_pincode_format', sql`${table.pincode} is null or ${table.pincode} ~ '^[1-9][0-9]{5}$'`),
    check('listings_latitude_range', sql`${table.latitude} is null or (${table.latitude} between -90 and 90)`),
    check('listings_longitude_range', sql`${table.longitude} is null or (${table.longitude} between -180 and 180)`),
    check(
      'listings_auction_window_ordered',
      sql`${table.auctionEndsAt} is null or ${table.auctionStartsAt} is null or ${table.auctionEndsAt} > ${table.auctionStartsAt}`,
    ),
  ],
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

export const listingImages = pgTable(
  'listing_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 500 }).notNull(),
    alt: varchar('alt', { length: 200 }),
    position: smallint('position').notNull().default(0),
  },
  (table) => [index('listing_images_listing_position_idx').on(table.listingId, table.position)],
);

export type ListingImage = typeof listingImages.$inferSelect;

/** A user's saved listings. Composite unique key makes saving idempotent. */
export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('watchlist_user_listing_key').on(table.userId, table.listingId),
    index('watchlist_user_idx').on(table.userId),
  ],
);

/** "Express interest" submissions from the listing detail page. */
export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    message: text('message'),
    status: enquiryStatusEnum('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('enquiries_listing_idx').on(table.listingId),
    index('enquiries_status_created_idx').on(table.status, table.createdAt.desc()),
  ],
);

/** Editorial content for the "Latest News" rail. */
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 200 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    excerpt: varchar('excerpt', { length: 400 }),
    body: text('body'),
    coverImageUrl: varchar('cover_image_url', { length: 500 }),
    readMinutes: smallint('read_minutes').notNull().default(4),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('articles_slug_key').on(table.slug),
    index('articles_published_at_idx').on(table.publishedAt.desc()),
  ],
);

export type Article = typeof articles.$inferSelect;

export const listingsRelations = relations(listings, ({ one, many }) => ({
  bank: one(banks, { fields: [listings.bankId], references: [banks.id] }),
  city: one(cities, { fields: [listings.cityId], references: [cities.id] }),
  category: one(categories, { fields: [listings.categoryId], references: [categories.id] }),
  images: many(listingImages),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

/**
 * Points of interest near a listing, shown under "Nearby Places".
 *
 * Stored rather than fetched live from a places API on every page view: the data barely
 * changes, and a per-render third-party call would add latency, cost and a dependency
 * on someone else's uptime to a page people browse in bulk. Refresh it on a schedule.
 */
export const listingNearbyPlaces = pgTable(
  'listing_nearby_places',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),

    category: nearbyCategoryEnum('category').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    /** Straight-line distance in kilometres, to two decimals. */
    distanceKm: numeric('distance_km', { precision: 6, scale: 2 }).notNull(),

    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),

    position: smallint('position').notNull().default(0),
  },
  (table) => [
    index('listing_nearby_listing_category_idx').on(table.listingId, table.category, table.position),
    check('listing_nearby_distance_positive', sql`${table.distanceKm} >= 0`),
  ],
);

export type ListingNearbyPlace = typeof listingNearbyPlaces.$inferSelect;
