import 'server-only';

import { unstable_cache } from 'next/cache';
import type { ArticleCard, BankFacet, CategoryFacet, CityFacet, ListingCard } from '@/domain/listing';
import { logger } from '@/lib/logger';
import {
  findBanks,
  findCategories,
  findCitiesWithListings,
  findPopularCities,
} from '@/server/repositories/catalog-repository';
import {
  findFeaturedListings,
  findPublishedArticles,
  findRecentListings,
} from '@/server/repositories/listing-repository';
import { HOMEPAGE_FALLBACK } from './homepage-fallback';

export interface HomepageData {
  recentListings: ListingCard[];
  featuredListings: ListingCard[];
  citiesWithListings: CityFacet[];
  popularCities: CityFacet[];
  banks: BankFacet[];
  categories: CategoryFacet[];
  articles: ArticleCard[];
}

/**
 * Aggregates every read the marketing homepage needs.
 *
 * The seven queries are issued concurrently and the whole result is cached for five
 * minutes. Homepage content is public and slow-changing, so serving it from cache
 * keeps a traffic spike off Postgres entirely — the connection pool stays available
 * for authenticated work.
 */
const loadHomepageData = unstable_cache(
  async (): Promise<HomepageData> => {
    const [recentListings, featuredListings, citiesWithListings, popularCities, bankList, categoryList, articles] =
      await Promise.all([
        findRecentListings(12),
        findFeaturedListings(12),
        findCitiesWithListings(24),
        findPopularCities(12),
        findBanks(16),
        findCategories(),
        findPublishedArticles(3),
      ]);

    return {
      recentListings,
      featuredListings,
      citiesWithListings,
      popularCities,
      banks: bankList,
      categories: categoryList,
      articles,
    };
  },
  ['homepage-data-v1'],
  { revalidate: 300, tags: ['listings', 'catalog', 'articles'] },
);

export async function getHomepageData(): Promise<HomepageData> {
  // Before the database is provisioned, render the design with representative content
  // instead of an empty page.
  //
  // Scope is deliberately narrow: this applies only when `DATABASE_URL` is absent, and
  // only in development or while `next build` is prerendering (which runs with
  // NODE_ENV=production but has no database to reach). A *serving* production process
  // without a database must fail loudly — quietly returning placeholder figures to real
  // buyers would be far worse than an error page.
  if (!process.env.DATABASE_URL) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      logger.error('homepage.database_not_configured');
      throw new Error('DATABASE_URL is not configured.');
    }

    logger.warn('homepage.using_fallback_content', {
      reason: 'DATABASE_URL is unset — run `npm run db:push && npm run db:seed` to use real data.',
    });
    return HOMEPAGE_FALLBACK;
  }

  return loadHomepageData();
}
