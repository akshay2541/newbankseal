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
    <section className="relative isolate mt-section-lg overflow-hidden pb-section-lg" aria-labelledby="invite-heading">
      {/*
        Skyline backdrop. The source photograph is a colour sunset; the design wants a
        grey haze rising into dark silhouettes, so it is desaturated and re-graded here
        rather than in the asset — the file stays reusable and the treatment lives with
        the rest of the styling.

        Every number below is measured against the design, and they only work together.

        The box is a 1440:720 strip, which at the design width puts its top level with
        the map's midpoint. That height is the whole effect: the photograph's sky is what
        becomes the pale haze behind the map, and a shorter strip crops the sky away and
        leaves the skyline sitting on the page as a band.

        `object-top` then falls out of the arithmetic rather than being taste. At this
        aspect, cover scales the photo to 1440x959 and hides 239px of it; anchoring the
        top lands the tallest spire 359px down, which is where the design puts it. Change
        the strip's height and this has to be re-derived, not nudged.

        The grade is nearly transparent by design. The photograph already has the shape
        the section wants — a soft gradient sky, banded fog, silhouettes at three depths
        — so it is desaturated and left almost alone. Pushing contrast is the tempting
        mistake: it crushes the fog bands to white and the buildings to a flat cutout,
        and the depth that makes this read as haze rather than as a pasted-on band goes
        with them. Opacity does the blending instead, high enough that the mid-tones
        survive.

        Below `lg` the strip is measured against the section instead of its own width.
        A width-derived height is right on the design's canvas and nowhere else: as the
        column narrows the strip shrinks while the section grows taller with the stacked
        content, and by phone width the skyline is a sliver along the bottom edge that
        reads as a mistake. A percentage keeps the same proportion at every size.

        Layered by source order, not a negative z-index. An `opacity` and a `filter`
        each promote this to its own compositing layer, and at a negative index that
        layer lands under the page background and vanishes entirely. Both this and the
        content column are positioned, so the later one — the content — wins.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] min-h-80 w-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_20%)] lg:h-auto lg:aspect-1440/720"
      >
        <Image
          src="/images/city-skyline.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top opacity-90 grayscale contrast-[1.08]"
        />
      </div>

      <Container className="relative pt-4">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <div>
            <h2
              id="invite-heading"
              className="max-w-[30rem] font-display text-h1 font-bold tracking-tight text-ink-900"
            >
              We&apos;d Like to Personally Invite You to Explore a New Opportunity with{' '}
              <span className="text-brand-600">{siteConfig.wordmark}</span>
            </h2>

            <p className="mt-5 max-w-md text-body leading-relaxed text-ink-500">
              Whether you&apos;re looking for a property, vehicle, or other bank-repossessed asset, discover verified
              listings and find the right opportunity with ease.
            </p>

            <Button asChild variant="primary" className="mt-block">
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
