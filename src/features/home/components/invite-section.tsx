import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { formatCount } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { IndiaMap, type MapMarker } from './india-map';
import { StatsBand } from './stats-band';

/**
 * Closing block: the invitation, the coverage map, and the statistics card.
 *
 * These are one visual unit in the design — a single city-skyline backdrop runs behind
 * all of it and stops where the footer begins — so they share a component rather than
 * each trying to paint a slice of the same image.
 */

/** Cities we currently cover, with real coordinates so the pins are geographically right. */
const COVERAGE: ReadonlyArray<MapMarker & { listings: number }> = [
  { city: 'Ahmedabad', lon: 72.5714, lat: 23.0225, listings: 100 },
  { city: 'Surat', lon: 72.8311, lat: 21.1702, listings: 200 },
  { city: 'Navsari', lon: 72.952, lat: 20.9467, listings: 250 },
  { city: 'Vapi', lon: 72.9051, lat: 20.3714, listings: 150 },
  { city: 'Valsad', lon: 72.9342, lat: 20.5992, listings: 140 },
];

export function InviteSection() {
  return (
    <section className="relative isolate mt-16 overflow-hidden pb-16" aria-labelledby="invite-heading">
      {/*
        Skyline backdrop. The source photograph is a colour sunset; the design wants a
        grey haze, so it is desaturated here rather than in the asset — the file stays
        reusable and the treatment lives with the rest of the styling. The mask fades
        the image out towards the top so it dissolves into the page instead of ending
        on a hard edge.

        Two numbers below work together and neither survives alone. The box is a wide
        1440:350 strip so the skyline occupies only the lower third of the section, as
        in the design. But this photograph keeps its crisp building silhouettes in the
        middle 40-70% of the frame and flat haze below that, so a strip anchored to the
        bottom would show nothing but fog — hence `object-[center_66%]`, which slides
        the crop window up onto the rooflines. Shorten the box and you must raise that
        percentage with it. No brightness lift either: it washes silhouettes into haze.
        Re-measure the frame if the asset is ever swapped.

        `min-h-56` is the mobile floor. The strip's height derives from its width, so on
        a narrow screen it would collapse to under a tenth of a section that has grown
        taller as the content stacked, and the skyline would all but vanish.

        Layered by source order, not a negative z-index. An `opacity` and a `filter`
        each promote this to its own compositing layer, and at a negative index that
        layer lands under the page background and vanishes entirely. Both this and the
        content column are positioned, so the later one — the content — wins.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 aspect-1440/350 min-h-56 w-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_22%)]"
      >
        <Image
          src="/images/city-skyline.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_66%] opacity-45 grayscale contrast-[1.25]"
        />
      </div>

      <Container className="relative pt-4">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <div>
            <h2
              id="invite-heading"
              className="max-w-[30rem] font-display text-2xl leading-[1.3] font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-[2.5rem]"
            >
              We&apos;d Like to Personally Invite You to Explore a New Opportunity with{' '}
              <span className="text-brand-600">{siteConfig.wordmark}</span>
            </h2>

            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-ink-500">
              Whether you&apos;re looking for a property, vehicle, or other bank-repossessed asset, discover verified
              listings and find the right opportunity with ease.
            </p>

            <Button asChild variant="primary" className="mt-7 h-13 px-7 text-[0.9375rem]">
              <Link href="/explore">Explore {siteConfig.wordmark} Listed Assets</Link>
            </Button>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-[34rem]">
            <IndiaMap markers={COVERAGE} />

            {/* Sits over the map's lower half, just clear of the pin cluster, as in the design. */}
            <div className="absolute right-2 bottom-[16%] w-44 rounded-lg bg-surface p-3 shadow-lift sm:w-52 lg:right-auto lg:left-[16%]">
              <h3 className="sr-only">Listings by city</h3>
              <dl className="space-y-1.5">
                {COVERAGE.map((entry) => (
                  <div key={entry.city} className="flex items-baseline justify-between gap-3 text-xs">
                    <dt className="truncate text-ink-700">{entry.city}</dt>
                    <dd className="shrink-0 tabular-nums text-ink-400">({formatCount(entry.listings)})</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <StatsBand className="mt-14 lg:mt-32" />
      </Container>
    </section>
  );
}
