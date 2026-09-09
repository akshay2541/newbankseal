import { relations } from 'drizzle-orm';
import { index, integer, pgTable, smallint, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { assetTypeEnum } from './enums';

/** Lending institutions whose assets are listed. Slug is the public URL key. */
export const banks = pgTable(
  'banks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    shortName: varchar('short_name', { length: 40 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    /**
     * Auction-desk contact. Gated on the detail page: publishing it openly would turn
     * the site into a scraped lead list for every bank's recovery department.
     */
    contactName: varchar('contact_name', { length: 120 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    contactEmail: varchar('contact_email', { length: 320 }),
    // Denormalised counter kept fresh by a scheduled job; read paths never COUNT(*) live.
    listingCount: integer('listing_count').notNull().default(0),
    displayOrder: smallint('display_order').notNull().default(0),
  },
  (table) => [uniqueIndex('banks_slug_key').on(table.slug), index('banks_display_order_idx').on(table.displayOrder)],
);

export type Bank = typeof banks.$inferSelect;

/** Indian cities with auction activity. */
export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    state: varchar('state', { length: 80 }).notNull(),
    listingCount: integer('listing_count').notNull().default(0),
    isPopular: smallint('is_popular').notNull().default(0),
  },
  (table) => [
    uniqueIndex('cities_slug_key').on(table.slug),
    index('cities_state_idx').on(table.state),
    index('cities_listing_count_idx').on(table.listingCount.desc()),
  ],
);

export type City = typeof cities.$inferSelect;

/** Top-level asset categories shown on the home grid. */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    /** Lucide icon name resolved through an allow-list map on the client. */
    iconKey: varchar('icon_key', { length: 40 }).notNull(),
    listingCount: integer('listing_count').notNull().default(0),
    displayOrder: smallint('display_order').notNull().default(0),
  },
  (table) => [uniqueIndex('categories_slug_key').on(table.slug)],
);

export type Category = typeof categories.$inferSelect;

export const banksRelations = relations(banks, () => ({}));
