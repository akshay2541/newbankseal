import { SEED_BANKS, SEED_CATEGORIES, SEED_CITIES, buildSeedArticles } from '@/db/seed-data';
import type { ArticleCard } from '@/domain/listing';
import { SEED_LISTING_CARDS, toCityFacet } from './seed-projection';
import type { HomepageData } from './home-service';

/**
 * Development-only homepage content, projected from the seed dataset so the design is
 * reviewable before Neon is provisioned. `getHomepageData` refuses to reach this while
 * a production process is serving requests.
 */
function toArticleCard(article: ReturnType<typeof buildSeedArticles>[number]): ArticleCard {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImageUrl: article.coverImageUrl,
    readMinutes: article.readMinutes,
    publishedAt: article.publishedAt,
  };
}

export const HOMEPAGE_FALLBACK: HomepageData = {
  recentListings: SEED_LISTING_CARDS.slice(0, 12),
  featuredListings: SEED_LISTING_CARDS.filter((listing) => listing.isFeatured).slice(0, 12),
  citiesWithListings: SEED_CITIES.filter((city) => city.listingCount > 0)
    .slice()
    .sort((a, b) => b.listingCount - a.listingCount || a.name.localeCompare(b.name))
    .slice(0, 24)
    .map(toCityFacet),
  popularCities: SEED_CITIES.filter((city) => city.isPopular)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12)
    .map(toCityFacet),
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
  articles: buildSeedArticles().map(toArticleCard),
};
