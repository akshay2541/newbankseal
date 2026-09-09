/**
 * Database seed.
 *
 * Idempotent: every insert is an upsert on the natural key, so running it twice is
 * safe and it can be used to refresh reference data after a schema change.
 *
 * Run with: `npm run db:seed`
 */
import 'dotenv/config';

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { banks, categories, cities, listingImages, listings, articles } from './schema';
import { buildSeedArticles, buildSeedListings, SEED_BANKS, SEED_CATEGORIES, SEED_CITIES } from './seed-data';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
  console.error('Refusing to seed a production database. Set ALLOW_PRODUCTION_SEED=true if this is intentional.');
  process.exit(1);
}

const db = drizzle(neon(connectionString), { schema });

/** Rupees to paise. Money is stored as an integer so it cannot drift. */
const toPaise = (rupees: number) => BigInt(Math.round(rupees * 100));

async function seed() {
  console.log('Seeding cities…');
  for (const city of SEED_CITIES) {
    await db
      .insert(cities)
      .values({
        slug: city.slug,
        name: city.name,
        state: city.state,
        listingCount: city.listingCount,
        isPopular: city.isPopular ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: cities.slug,
        set: { name: city.name, state: city.state, listingCount: city.listingCount, isPopular: city.isPopular ? 1 : 0 },
      });
  }

  console.log('Seeding banks…');
  for (const bank of SEED_BANKS) {
    await db
      .insert(banks)
      .values({
        slug: bank.slug,
        name: bank.name,
        shortName: bank.shortName,
        listingCount: bank.listingCount,
        displayOrder: bank.displayOrder,
        logoUrl: bank.logoUrl,
      })
      .onConflictDoUpdate({
        target: banks.slug,
        set: {
          name: bank.name,
          shortName: bank.shortName,
          listingCount: bank.listingCount,
          displayOrder: bank.displayOrder,
          logoUrl: bank.logoUrl,
        },
      });
  }

  console.log('Seeding categories…');
  for (const category of SEED_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        slug: category.slug,
        name: category.name,
        assetType: category.assetType,
        iconKey: category.iconKey,
        listingCount: category.listingCount,
        displayOrder: category.displayOrder,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: category.name,
          assetType: category.assetType,
          iconKey: category.iconKey,
          listingCount: category.listingCount,
          displayOrder: category.displayOrder,
        },
      });
  }

  console.log('Seeding listings…');
  const cityIds = toSlugMap(await db.select({ slug: cities.slug, id: cities.id }).from(cities));
  const bankIds = toSlugMap(await db.select({ slug: banks.slug, id: banks.id }).from(banks));
  const categoryIds = toSlugMap(await db.select({ slug: categories.slug, id: categories.id }).from(categories));

  for (const listing of buildSeedListings()) {
    const cityId = cityIds.get(listing.citySlug);
    const bankId = bankIds.get(listing.bankSlug);
    const categoryId = categoryIds.get(listing.categorySlug);

    if (!cityId || !bankId) {
      console.warn(`Skipping ${listing.referenceNo}: missing city or bank reference.`);
      continue;
    }

    const [row] = await db
      .insert(listings)
      .values({
        referenceNo: listing.referenceNo,
        slug: listing.slug,
        title: listing.title,
        assetType: listing.assetType,
        saleType: listing.saleType,
        status: 'published',
        cityId,
        bankId,
        categoryId: categoryId ?? null,
        locality: listing.locality,
        areaSqft: listing.areaSqft,
        reservePricePaise: toPaise(listing.reservePriceInr),
        emdAmountPaise: toPaise(listing.emdAmountInr),
        auctionStartsAt: new Date(listing.auctionStartsAt),
        isFeatured: listing.isFeatured,
        possessionType: listing.possessionType,
        isReauction: listing.isReauction,
        previousReservePricePaise:
          listing.previousReservePriceInr === null ? null : toPaise(listing.previousReservePriceInr),
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: listings.referenceNo,
        set: {
          title: listing.title,
          status: 'published',
          reservePricePaise: toPaise(listing.reservePriceInr),
          emdAmountPaise: toPaise(listing.emdAmountInr),
          auctionStartsAt: new Date(listing.auctionStartsAt),
          isFeatured: listing.isFeatured,
          updatedAt: new Date(),
        },
      })
      .returning({ id: listings.id });

    if (!row) continue;

    // Replace the image set rather than accumulating duplicates on re-runs.
    await db.delete(listingImages).where(eq(listingImages.listingId, row.id));
    await db.insert(listingImages).values({
      listingId: row.id,
      url: listing.imageUrl,
      alt: listing.title,
      position: 0,
    });
  }

  console.log('Seeding articles…');
  for (const article of buildSeedArticles()) {
    await db
      .insert(articles)
      .values({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        coverImageUrl: article.coverImageUrl,
        readMinutes: article.readMinutes,
        publishedAt: new Date(article.publishedAt),
      })
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: article.title,
          excerpt: article.excerpt,
          coverImageUrl: article.coverImageUrl,
          publishedAt: new Date(article.publishedAt),
        },
      });
  }

  console.log('Refreshing denormalised counters…');
  // The counters the homepage reads are maintained rather than computed per request;
  // recompute them here so seeded data is self-consistent.
  await db.execute(sql`
    update cities set listing_count = greatest(listing_count, (
      select count(*) from listings l
      where l.city_id = cities.id and l.status in ('published', 'auction_live') and l.deleted_at is null
    ))
  `);

  console.log('Seed complete.');
}

/** Build a slug -> id lookup from a reference-table query result. */
function toSlugMap(rows: Array<{ slug: string; id: string }>): Map<string, string> {
  return new Map(rows.map((row) => [row.slug, row.id]));
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
