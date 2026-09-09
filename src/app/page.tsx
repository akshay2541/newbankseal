import type { Metadata } from 'next';
import { AuctionTabs, type TabPanel } from '@/features/home/components/auction-tabs';
import { CategorySection } from '@/features/home/components/category-section';
import { HeroSearch } from '@/features/home/components/hero-search';
import { InviteSection } from '@/features/home/components/invite-section';
import { ListingRail } from '@/features/home/components/listing-rail';
import { LocalityListingRail } from '@/features/home/components/locality-listing-rail';
import { NewsRail } from '@/features/home/components/news-rail';
import { TopCities } from '@/features/home/components/top-cities';
import { ValueProps } from '@/features/home/components/value-props';
import { siteConfig } from '@/lib/site-config';
import { getHomepageData } from '@/server/services/home-service';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Bank Auction Marketplace`,
  description: siteConfig.description,
  alternates: { canonical: '/' },
};

/**
 * The marketplace homepage.
 *
 * A Server Component: every figure is fetched on the server through the cached
 * `getHomepageData` aggregate, so the browser receives markup rather than a data
 * waterfall, and no query shape or connection detail is exposed to the client.
 *
 * Revalidated every five minutes — auction inventory changes on the order of hours,
 * not seconds, so this trades negligible staleness for a homepage that survives a
 * traffic spike without touching Postgres.
 */
export const revalidate = 300;

export default async function HomePage() {
  const data = await getHomepageData();

  const tabs: TabPanel[] = [
    {
      key: 'by-city',
      label: 'Bank Auctions by City',
      title: 'Bank Auctions by City',
      items: data.citiesWithListings.map((city) => ({
        label: city.name,
        count: city.listingCount,
        href: `/explore?city=${encodeURIComponent(city.slug)}`,
      })),
    },
    {
      key: 'top-banks',
      label: 'Top Banks',
      title: 'Auctions by Partner Bank',
      items: data.banks.map((bank) => ({
        label: bank.shortName ?? bank.name,
        count: bank.listingCount,
        href: `/banks/${encodeURIComponent(bank.slug)}`,
      })),
    },
    {
      key: 'car-auctions',
      label: 'Bank Car Auction',
      title: 'Vehicle Auctions by City',
      items: data.citiesWithListings.slice(0, 12).map((city) => ({
        label: city.name,
        count: city.listingCount,
        href: `/explore?city=${encodeURIComponent(city.slug)}&category=vehicle-auctions`,
      })),
    },
    {
      key: 'commercial-auctions',
      label: 'Bank Commercial Auction',
      title: 'Commercial Auctions by City',
      items: data.citiesWithListings.slice(0, 12).map((city) => ({
        label: city.name,
        count: city.listingCount,
        href: `/explore?city=${encodeURIComponent(city.slug)}&category=commercial-auctions`,
      })),
    },
  ];

  return (
    <>
      <HeroSearch categories={data.categories} />

      <AuctionTabs tabs={tabs} />

      <CategorySection categories={data.categories} banks={data.banks} />

      <ListingRail
        id="new-listed"
        lead="New Listed"
        highlight="Properties"
        viewAllHref="/explore?sort=newest"
        listings={data.recentListings}
        variant="overlay"
        priorityFirstCard
      />

      <LocalityListingRail
        id="top-properties"
        lead="Top"
        highlight="Properties"
        viewAllHref="/explore?sort=featured"
        listings={data.featuredListings}
      />

      <ValueProps />

      <TopCities cities={data.popularCities} />

      <NewsRail articles={data.articles} />

      <InviteSection />

    </>
  );
}
