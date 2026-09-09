import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Container } from '@/components/ui/container';
import type { CategoryFacet } from '@/domain/listing';
import { CategorySelect } from './category-select';

/**
 * Hero backdrop — the design's own photograph, served from `/public`.
 *
 * Local rather than remote on purpose: no third-party request means no visitor IP
 * leaks to an image CDN, the CSP needs no extra `img-src` host, and the asset can't
 * change or disappear underneath us. Next's optimiser still resizes and re-encodes
 * it per breakpoint, so the 4096px source never reaches a phone.
 */
const HERO_IMAGE = '/images/luxury-architecture-exterior-design.webp';

const POPULAR_SEARCHES = [
  { label: 'Flat in Mumbai', href: '/explore?city=mumbai&category=residential-auctions' },
  { label: 'House in New Delhi', href: '/explore?city=delhi&category=residential-auctions' },
  { label: 'Commercial in Bangalore', href: '/explore?city=bengaluru&category=commercial-auctions' },
  { label: 'Cars in Surat', href: '/explore?city=surat&category=vehicle-auctions' },
];

/**
 * Hero panel: a night photograph behind the headline, with the search lifted onto a
 * white card.
 *
 * The backdrop is left at full opacity and readability comes from a left-to-right
 * scrim instead — dimming the whole photo (the earlier approach) flattened the image
 * the design relies on, while the horizontal gradient keeps the right-hand side
 * vivid exactly where there is no text over it.
 *
 * The search is a plain `GET` form pointed at /explore: it works with JavaScript
 * disabled, produces a shareable URL, and needs no CSRF token because it cannot
 * mutate state. Query parameters are re-validated server-side on /explore.
 */
export function HeroSearch({ categories }: { categories: CategoryFacet[] }) {
  return (
    <Container className="pt-6">
      <section className="relative isolate overflow-hidden rounded-hero bg-ink-950">
        <Image
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          fill
          priority
          quality={82}
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover object-center"
        />

        {/* Readability scrim: opaque behind the copy, clearing by the midpoint. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink-950 from-5% via-ink-950/75 via-45% to-ink-950/10"
        />
        {/* Slight vertical weighting so the white card separates from the sky. */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950/55 to-transparent" />

        <div className="relative px-5 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-9 lg:px-12 lg:pt-16 lg:pb-8">
          <h1 className="font-display text-3xl leading-[1.12] font-bold tracking-tight text-white sm:text-4xl lg:text-[3rem]">
            <span className="block text-brand-500">Surat&apos;s bank</span>
            Auction Marketplace
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 lg:text-[0.9375rem]">
            Verified bank-seized and SARFAESI auction properties. Reserve prices, EMD details, auction dates updated
            daily.
          </p>

          <div className="mt-7 rounded-panel bg-white p-3 shadow-float sm:p-6">
            <form action="/explore" method="get" role="search">
              {/* Inner tray: on mobile the controls stack, so the tray drops its fixed
                  height and each control keeps a comfortable touch target. */}
              <div className="flex flex-col gap-2 rounded-2xl bg-ink-100 p-2.5 sm:h-[4.25rem] sm:flex-row sm:items-center sm:gap-0">
                <div className="shrink-0">
                  <CategorySelect categories={categories} />
                </div>

                <div className="hidden h-7 w-px shrink-0 bg-ink-300 sm:block" aria-hidden="true" />

                <div className="min-w-0 flex-1">
                  <label htmlFor="hero-query" className="sr-only">
                    Search auctions
                  </label>
                  <input
                    id="hero-query"
                    name="q"
                    type="search"
                    // Bounded here as well as server-side, so a pathological URL is
                    // stopped at the source rather than on submit.
                    maxLength={120}
                    autoComplete="off"
                    placeholder="Search for bank, cars &amp; properties…"
                    className="h-12 w-full rounded-xl bg-transparent px-4 text-[0.9375rem] text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                  />
                </div>

                <button
                  type="submit"
                  aria-label="Search auctions"
                  className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 sm:size-12 sm:w-12"
                >
                  <Search className="size-5" strokeWidth={2.5} />
                  <span className="sm:sr-only">Search</span>
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 px-1 sm:gap-3">
              <span className="mr-1 text-[0.9375rem] font-semibold text-ink-900">Popular :</span>
              {POPULAR_SEARCHES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 items-center rounded-btn bg-ink-100 px-4 text-[0.8125rem] font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
