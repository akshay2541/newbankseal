import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ShareIcon, type ShareIconKey } from '@/components/ui/share-icon';
import type { LocalityFacet } from '@/domain/listing';
import type { ExploreQuery } from '@/lib/validation/auth';
import { buildExploreHref } from '../lib/href';
import { AdSlot } from './ad-slot';

/** Share, locality navigation and an ad slot — the right-hand rail from the design. */
export function ExploreSidebar({
  localities,
  cityName,
  query,
  shareUrl,
}: {
  localities: LocalityFacet[];
  cityName: string | null;
  query: ExploreQuery;
  shareUrl: string;
}) {
  return (
    <aside className="space-y-4">
      <ShareCard url={shareUrl} />

      {localities.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-[0.9375rem] font-bold text-ink-900">
            Top Localities in {cityName ?? 'These'} Auctions
          </h2>

          <ul className="mt-4 space-y-2">
            {localities.map((locality) => (
              <li key={locality.locality}>
                <Link
                  href={buildExploreHref(query, { q: locality.locality, page: 1 })}
                  className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <span className="truncate">
                    {locality.locality}, {locality.cityName}
                  </span>
                  <span className="shrink-0 text-2xs tabular-nums text-ink-400">({locality.listingCount})</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <AdSlot className="h-52" />
    </aside>
  );
}

/**
 * Share links.
 *
 * Each is a plain outbound link to the network's share endpoint with the page URL
 * encoded — no third-party SDK, so no script from those networks runs on our pages and
 * nothing tracks the visitor unless they actually click through.
 */
function ShareCard({ url }: { url: string }) {
  const encoded = encodeURIComponent(url);

  const targets: ReadonlyArray<{ label: string; href: string; icon: ShareIconKey }> = [
    { label: 'Share on WhatsApp', href: `https://wa.me/?text=${encoded}`, icon: 'whatsapp' },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, icon: 'facebook' },
    { label: 'Share on Twitter', href: `https://twitter.com/intent/tweet?url=${encoded}`, icon: 'twitter' },
    { label: 'Share by email', href: `mailto:?body=${encoded}`, icon: 'email' },
  ];

  return (
    <Card className="p-5">
      <h2 className="text-[0.9375rem] font-bold text-ink-900">Share</h2>

      <ul className="mt-4 flex items-center gap-4">
        {targets.map((target) => (
          <li key={target.label}>
            <a
              href={target.href}
              target="_blank"
              // noopener defeats reverse-tabnabbing; noreferrer stops the Referer leak.
              rel="noopener noreferrer"
              aria-label={target.label}
              // The glyph is a complete badge; the well behind it is what the design adds.
              className="inline-flex size-11.5 items-center justify-center rounded-xl bg-glyph-well text-glyph transition-colors hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <ShareIcon icon={target.icon} />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
