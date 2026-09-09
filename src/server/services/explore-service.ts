import 'server-only';

import type {
  BankFacet,
  CategoryFacet,
  ListingSearchResult,
  LocalityFacet,
} from '@/domain/listing';
import { logger } from '@/lib/logger';
import type { ExploreQuery } from '@/lib/validation/auth';
import { findBanks, findCategories } from '@/server/repositories/catalog-repository';
import { findLocalityFacets, searchListings } from '@/server/repositories/listing-repository';
import { buildExploreFallback } from './explore-fallback';

export interface ExplorePageData {
  results: ListingSearchResult;
  localities: LocalityFacet[];
  banks: BankFacet[];
  categories: CategoryFacet[];
  /** Display name for the active city filter, when one is applied. */
  cityName: string | null;
}

/**
 * Aggregates everything the browse page renders.
 *
 * Not cached, unlike the homepage: the result depends on the visitor's filters, so a
 * shared cache would either thrash on cardinality or serve one visitor's filtered page
 * to another. The reference data it joins is small and indexed; the listing query is
 * the only one that touches volume, and it is bounded by page size.
 */
export async function getExplorePageData(query: ExploreQuery): Promise<ExplorePageData> {
  // Before the database exists, render the design from seed data — same rule as the
  // homepage: development and the build only, never a serving production process.
  if (!process.env.DATABASE_URL) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      logger.error('explore.database_not_configured');
      throw new Error('DATABASE_URL is not configured.');
    }

    logger.warn('explore.using_fallback_content', {
      reason: 'DATABASE_URL is unset — run `npm run db:push && npm run db:seed` to use real data.',
    });
    return buildExploreFallback(query);
  }

  const [results, banks, categories] = await Promise.all([
    searchListings(query),
    findBanks(16),
    findCategories(),
  ]);

  // Localities are scoped to a city, so there is nothing to show until one is chosen.
  const localities = query.city ? await findLocalityFacets(query.city, 10) : [];

  return {
    results,
    localities,
    banks,
    categories,
    cityName: localities[0]?.cityName ?? results.items[0]?.locationLabel.split(', ')[1] ?? null,
  };
}
