/**
 * Reference dataset.
 *
 * Single source of truth for two consumers: `npm run db:seed`, which loads it into
 * Neon, and the development-only homepage fallback that renders the design before a
 * database exists. Keeping one copy means the seeded site and the fallback can never
 * drift apart.
 *
 * Figures mirror the marketplace design. Money is expressed in whole rupees here and
 * converted to paise on insert.
 */

export interface SeedCity {
  slug: string;
  name: string;
  state: string;
  listingCount: number;
  isPopular: boolean;
}

export interface SeedBank {
  slug: string;
  name: string;
  shortName: string;
  listingCount: number;
  displayOrder: number;
  /**
   * Path under `public/`. Null where we don't hold the bank's mark — the UI falls back
   * to a monogram, so a missing logo degrades rather than breaking the row.
   */
  logoUrl: string | null;
}

export interface SeedCategory {
  slug: string;
  name: string;
  assetType: 'residential' | 'commercial' | 'industrial' | 'vehicle' | 'machinery' | 'gold' | 'land';
  iconKey: string;
  listingCount: number;
  displayOrder: number;
}

export interface SeedListing {
  referenceNo: string;
  slug: string;
  title: string;
  assetType: SeedCategory['assetType'];
  saleType: 'sarfaesi' | 'liquidation' | 'drt' | 'private_treaty';
  citySlug: string;
  bankSlug: string;
  categorySlug: string;
  locality: string;
  areaSqft: number;
  reservePriceInr: number;
  emdAmountInr: number;
  auctionStartsAt: string;
  isFeatured: boolean;
  imageUrl: string;
  possessionType: 'physical' | 'symbolic';
  isReauction: boolean;
  /** Prior reserve in rupees; only set where the bank actually revised downward. */
  previousReservePriceInr: number | null;
}

export interface SeedArticle {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  readMinutes: number;
  publishedAt: string;
}

/** Cities carrying live auction inventory — drives the "Bank Auctions by City" panel. */
export const SEED_CITIES: SeedCity[] = [
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', listingCount: 265, isPopular: true },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', listingCount: 37, isPopular: true },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', listingCount: 129, isPopular: true },
  { slug: 'north-24-parganas', name: 'North 24 Parganas', state: 'West Bengal', listingCount: 8, isPopular: false },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra', listingCount: 48, isPopular: false },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', listingCount: 11, isPopular: true },
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', listingCount: 21, isPopular: false },
  { slug: 'krishna-district', name: 'Krishna District', state: 'Andhra Pradesh', listingCount: 8, isPopular: false },
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh', listingCount: 37, isPopular: false },
  { slug: 'belagavi', name: 'Belagavi', state: 'Karnataka', listingCount: 25, isPopular: false },
  { slug: 'palakkad', name: 'Palakkad', state: 'Kerala', listingCount: 8, isPopular: false },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', listingCount: 5, isPopular: false },
  { slug: 'alwar', name: 'Alwar', state: 'Rajasthan', listingCount: 17, isPopular: false },
  { slug: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', listingCount: 8, isPopular: false },
  { slug: 'amravati', name: 'Amravati', state: 'Maharashtra', listingCount: 6, isPopular: false },
  { slug: 'junagadh', name: 'Junagadh', state: 'Gujarat', listingCount: 7, isPopular: false },
  { slug: 'bulandshahr', name: 'Bulandshahr', state: 'Uttar Pradesh', listingCount: 14, isPopular: false },
  { slug: 'kollam', name: 'Kollam', state: 'Kerala', listingCount: 34, isPopular: false },
  { slug: 'jalgaon', name: 'Jalgaon', state: 'Maharashtra', listingCount: 6, isPopular: false },
  { slug: 'surat', name: 'Surat', state: 'Gujarat', listingCount: 129, isPopular: true },
  { slug: 'delhi', name: 'Delhi', state: 'Delhi', listingCount: 100, isPopular: true },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', listingCount: 100, isPopular: true },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', listingCount: 100, isPopular: true },
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', listingCount: 100, isPopular: true },
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', listingCount: 100, isPopular: true },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', listingCount: 100, isPopular: true },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', listingCount: 100, isPopular: true },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', listingCount: 100, isPopular: true },
];

export const SEED_BANKS: SeedBank[] = [
  { slug: 'state-bank-of-india', name: 'State Bank of India', shortName: 'SBI', listingCount: 1840, displayOrder: 1, logoUrl: '/images/banks/state-bank-of-india.webp' },
  { slug: 'bank-of-baroda', name: 'Bank of Baroda', shortName: 'BoB', listingCount: 1120, displayOrder: 2, logoUrl: '/images/banks/bank-of-baroda.webp' },
  { slug: 'punjab-national-bank', name: 'Punjab National Bank', shortName: 'PNB', listingCount: 980, displayOrder: 3, logoUrl: '/images/banks/punjab-national-bank.webp' },
  { slug: 'bank-of-india', name: 'Bank of India', shortName: 'BOI', listingCount: 760, displayOrder: 4, logoUrl: '/images/banks/bank-of-india.webp' },
  { slug: 'canara-bank', name: 'Canara Bank', shortName: 'Canara', listingCount: 720, displayOrder: 5, logoUrl: '/images/banks/canara-bank.webp' },
  { slug: 'union-bank-of-india', name: 'Union Bank of India', shortName: 'UBI', listingCount: 690, displayOrder: 6, logoUrl: '/images/banks/union-bank-of-india.webp' },
  { slug: 'central-bank-of-india', name: 'Central Bank of India', shortName: 'CBI', listingCount: 540, displayOrder: 7, logoUrl: '/images/banks/central-bank-of-india.webp' },
  { slug: 'uco-bank', name: 'UCO Bank', shortName: 'UCO', listingCount: 430, displayOrder: 8, logoUrl: '/images/banks/uco-bank.webp' },
  { slug: 'indian-overseas-bank', name: 'Indian Overseas Bank', shortName: 'IOB', listingCount: 385, displayOrder: 9, logoUrl: '/images/banks/indian-overseas-bank.webp' },
  { slug: 'bank-of-maharashtra', name: 'Bank of Maharashtra', shortName: 'BoM', listingCount: 310, displayOrder: 10, logoUrl: '/images/banks/bank-of-maharashtra.webp' },
  { slug: 'indian-bank', name: 'Indian Bank', shortName: 'IB', listingCount: 295, displayOrder: 11, logoUrl: '/images/banks/indian-bank.webp' },
  { slug: 'punjab-and-sind-bank', name: 'Punjab & Sind Bank', shortName: 'PSB', listingCount: 180, displayOrder: 12, logoUrl: '/images/banks/punjab-and-sind-bank.webp' },
];

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: 'vehicle-auctions', name: 'Vehicle Auctions', assetType: 'vehicle', iconKey: 'vehicle', listingCount: 5487, displayOrder: 1 },
  { slug: 'residential-auctions', name: 'Residential Auctions', assetType: 'residential', iconKey: 'residential', listingCount: 1541, displayOrder: 2 },
  { slug: 'industrial-auctions', name: 'Industrials Auctions', assetType: 'industrial', iconKey: 'industrial', listingCount: 2036, displayOrder: 3 },
  { slug: 'commercial-auctions', name: 'Commercial Auctions', assetType: 'commercial', iconKey: 'commercial', listingCount: 5412, displayOrder: 4 },
  { slug: 'scrap-plant-machinery', name: 'Scrap, Plant & Machinery', assetType: 'machinery', iconKey: 'machinery', listingCount: 10547, displayOrder: 5 },
  { slug: 'gold-auctions', name: 'Gold Auctions', assetType: 'gold', iconKey: 'gold', listingCount: 5241, displayOrder: 6 },
];

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=70',
] as const;

const PUNE_LOCALITIES = [
  'Pimpri Chinchwad',
  'Hadapsar',
  'Baner',
  'Kharadi',
  'Maval',
  'Bhosari',
  'Hinjewadi',
  'Wakad',
  'Mulshi',
  'Khed',
] as const;

/**
 * Pune inventory. The browse page is specified against Pune, so it needs enough rows
 * to exercise pagination, both possession types, a re-auction and a price drop.
 */
const PUNE_BLUEPRINTS = PUNE_LOCALITIES.flatMap((locality, index) =>
  [0, 1].map((offset) => {
    const n = index * 2 + offset;
    return {
      title: `Flat in ${locality}, Pune`,
      locality,
      citySlug: 'pune',
      bankSlug: n % 3 === 0 ? 'canara-bank' : n % 3 === 1 ? 'bank-of-maharashtra' : 'state-bank-of-india',
      categorySlug: 'residential-auctions',
      assetType: 'residential' as const,
      saleType: 'sarfaesi' as const,
      areaSqft: 900 + n * 37,
      reservePriceInr: 2722762 + n * 51_000,
      emdAmountInr: 450000,
      possessionType: (n % 4 === 3 ? 'symbolic' : 'physical') as 'physical' | 'symbolic',
      isReauction: n % 7 === 1,
      previousReservePriceInr: n % 5 === 2 ? Math.round((2722762 + n * 51_000) * 1.11) : null,
    };
  }),
);

const LISTING_BLUEPRINTS: ReadonlyArray<{
  title: string;
  locality: string;
  citySlug: string;
  bankSlug: string;
  categorySlug: string;
  assetType: SeedCategory['assetType'];
  saleType: SeedListing['saleType'];
  areaSqft: number;
  reservePriceInr: number;
  emdAmountInr: number;
  possessionType?: 'physical' | 'symbolic';
  isReauction?: boolean;
  previousReservePriceInr?: number | null;
}> = [
  { title: 'Flat in Nellikuppam, Kanchipuram', locality: 'Velu', citySlug: 'surat', bankSlug: 'state-bank-of-india', categorySlug: 'residential-auctions', assetType: 'residential', saleType: 'liquidation', areaSqft: 1062, reservePriceInr: 1967000, emdAmountInr: 196700 },
  { title: '3 BHK Apartment in Powai', locality: 'Hiranandani Gardens', citySlug: 'mumbai', bankSlug: 'bank-of-baroda', categorySlug: 'residential-auctions', assetType: 'residential', saleType: 'sarfaesi', areaSqft: 1420, reservePriceInr: 14250000, emdAmountInr: 1425000 },
  { title: 'Commercial Showroom on SG Highway', locality: 'Bodakdev', citySlug: 'ahmedabad', bankSlug: 'punjab-national-bank', categorySlug: 'commercial-auctions', assetType: 'commercial', saleType: 'sarfaesi', areaSqft: 2400, reservePriceInr: 21600000, emdAmountInr: 2160000 },
  { title: 'Industrial Shed in MIDC Ambad', locality: 'MIDC Ambad', citySlug: 'nashik', bankSlug: 'canara-bank', categorySlug: 'industrial-auctions', assetType: 'industrial', saleType: 'drt', areaSqft: 8600, reservePriceInr: 34500000, emdAmountInr: 3450000 },
  { title: 'Residential Plot in Vaishali Nagar', locality: 'Vaishali Nagar', citySlug: 'jaipur', bankSlug: 'union-bank-of-india', categorySlug: 'residential-auctions', assetType: 'land', saleType: 'sarfaesi', areaSqft: 2160, reservePriceInr: 8900000, emdAmountInr: 890000 },
  { title: 'Office Space in Salt Lake Sector V', locality: 'Sector V', citySlug: 'kolkata', bankSlug: 'uco-bank', categorySlug: 'commercial-auctions', assetType: 'commercial', saleType: 'liquidation', areaSqft: 1850, reservePriceInr: 11750000, emdAmountInr: 1175000 },
  { title: 'Warehouse near Outer Ring Road', locality: 'Medchal', citySlug: 'hyderabad', bankSlug: 'indian-bank', categorySlug: 'industrial-auctions', assetType: 'industrial', saleType: 'sarfaesi', areaSqft: 12000, reservePriceInr: 46000000, emdAmountInr: 4600000 },
  { title: 'Villa in Whitefield', locality: 'Whitefield', citySlug: 'bengaluru', bankSlug: 'bank-of-india', categorySlug: 'residential-auctions', assetType: 'residential', saleType: 'sarfaesi', areaSqft: 3200, reservePriceInr: 28900000, emdAmountInr: 2890000 },
  { title: 'Retail Unit in Connaught Place', locality: 'Block A', citySlug: 'delhi', bankSlug: 'central-bank-of-india', categorySlug: 'commercial-auctions', assetType: 'commercial', saleType: 'sarfaesi', areaSqft: 940, reservePriceInr: 39500000, emdAmountInr: 3950000 },
  { title: '2 BHK Flat in Kalyani Nagar', locality: 'Kalyani Nagar', citySlug: 'pune', bankSlug: 'bank-of-maharashtra', categorySlug: 'residential-auctions', assetType: 'residential', saleType: 'liquidation', areaSqft: 1080, reservePriceInr: 9450000, emdAmountInr: 945000 },
  { title: 'Textile Unit with Machinery', locality: 'Pandesara', citySlug: 'surat', bankSlug: 'indian-overseas-bank', categorySlug: 'scrap-plant-machinery', assetType: 'machinery', saleType: 'drt', areaSqft: 6400, reservePriceInr: 18700000, emdAmountInr: 1870000 },
  { title: 'Commercial Land Parcel on NH-48', locality: 'Vapi Industrial Estate', citySlug: 'surat', bankSlug: 'punjab-and-sind-bank', categorySlug: 'commercial-auctions', assetType: 'land', saleType: 'sarfaesi', areaSqft: 21500, reservePriceInr: 62000000, emdAmountInr: 6200000 },
];

/** Auction dates are generated relative to today so seeded data never looks stale. */
export function buildSeedListings(now = new Date()): SeedListing[] {
  return [...LISTING_BLUEPRINTS, ...PUNE_BLUEPRINTS].map((blueprint, index) => {
    const auctionStartsAt = new Date(now);
    auctionStartsAt.setDate(auctionStartsAt.getDate() + 14 + index * 5);

    return {
      ...blueprint,
      referenceNo: `BS-${String(index + 1).padStart(6, '0')}`,
      slug: `${slugify(blueprint.title)}-${String(index + 1).padStart(3, '0')}`,
      auctionStartsAt: auctionStartsAt.toISOString(),
      // Every other listing is promoted to the "Top Properties" rail.
      isFeatured: index % 2 === 0,
      imageUrl: PROPERTY_IMAGES[index % PROPERTY_IMAGES.length] as string,
      possessionType: blueprint.possessionType ?? 'physical',
      isReauction: blueprint.isReauction ?? false,
      previousReservePriceInr: blueprint.previousReservePriceInr ?? null,
    };
  });
}

export function buildSeedArticles(now = new Date()): SeedArticle[] {
  const blueprints = [
    {
      slug: 'ultimate-checklist-for-selling-your-home-faster',
      title: 'The Ultimate Checklist for Selling Your Home Faster',
      excerpt:
        'From paperwork to presentation — the steps that consistently shorten time-to-sale in a bank auction context.',
      coverImageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=70',
    },
    {
      slug: 'short-term-rentals-vs-long-term-leases',
      title: "Short-Term Rentals vs. Long-Term Leases: Which One's Right for You?",
      excerpt:
        'Yield, vacancy risk and management overhead compared, so you can pick a strategy before you bid, not after.',
      coverImageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=70',
    },
    {
      slug: 'luxury-living-trends-what-buyers-really-want',
      title: 'Luxury Living Trends: What Buyers Really Want',
      excerpt:
        'The amenities and layouts driving premium resale values, and what that means for reserve-price negotiation.',
      coverImageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=70',
    },
  ];

  return blueprints.map((blueprint, index) => {
    const publishedAt = new Date(now);
    publishedAt.setDate(publishedAt.getDate() - (index + 1) * 6);
    return { ...blueprint, readMinutes: 6, publishedAt: publishedAt.toISOString() };
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}
