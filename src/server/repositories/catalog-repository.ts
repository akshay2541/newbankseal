import 'server-only';

import { asc, desc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { banks, categories, cities } from '@/db/schema';
import type { BankFacet, CategoryFacet, CityFacet } from '@/domain/listing';

/**
 * Reference-data reads. These power the filter chips and are the same for every
 * visitor, so they are safe to cache aggressively at the service layer.
 */

export async function findCitiesWithListings(limit = 24): Promise<CityFacet[]> {
  const rows = await db
    .select({
      slug: cities.slug,
      name: cities.name,
      state: cities.state,
      listingCount: cities.listingCount,
    })
    .from(cities)
    .where(sql`${cities.listingCount} > 0`)
    .orderBy(desc(cities.listingCount), asc(cities.name))
    .limit(clamp(limit, 24, 100));

  return rows;
}

export async function findPopularCities(limit = 12): Promise<CityFacet[]> {
  const rows = await db
    .select({
      slug: cities.slug,
      name: cities.name,
      state: cities.state,
      listingCount: cities.listingCount,
    })
    .from(cities)
    .where(sql`${cities.isPopular} = 1`)
    .orderBy(asc(cities.name))
    .limit(clamp(limit, 12, 50));

  return rows;
}

export async function findBanks(limit = 20): Promise<BankFacet[]> {
  const rows = await db
    .select({
      slug: banks.slug,
      name: banks.name,
      shortName: banks.shortName,
      listingCount: banks.listingCount,
      logoUrl: banks.logoUrl,
    })
    .from(banks)
    .orderBy(asc(banks.displayOrder), asc(banks.name))
    .limit(clamp(limit, 20, 100));

  return rows;
}

export async function findCategories(): Promise<CategoryFacet[]> {
  const rows = await db
    .select({
      slug: categories.slug,
      name: categories.name,
      iconKey: categories.iconKey,
      listingCount: categories.listingCount,
      assetType: categories.assetType,
    })
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));

  return rows;
}

function clamp(value: number, fallback: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}
