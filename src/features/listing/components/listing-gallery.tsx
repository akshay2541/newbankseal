import Image from 'next/image';
import { Expand } from 'lucide-react';
import type { ListingImageItem } from '@/domain/listing';

/**
 * Photo gallery: one lead image with a 2x2 grid beside it.
 *
 * The final tile becomes a "See N Images" overlay when there are more photographs than
 * the grid can show. Degrades cleanly — with one image the grid is dropped entirely
 * rather than padded with empty boxes.
 */
const GRID_SLOTS = 4;

export function ListingGallery({ images, title }: { images: ListingImageItem[]; title: string }) {
  if (images.length === 0) {
    return <div className="h-64 w-full rounded-card bg-ink-100 sm:h-80" aria-hidden="true" />;
  }

  const [lead, ...rest] = images;
  if (!lead) return null;

  const grid = rest.slice(0, GRID_SLOTS);
  const overflow = images.length - 1 - grid.length;

  return (
    <section aria-label={`Photographs of ${title}`} className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
      <div className="relative h-64 overflow-hidden rounded-card bg-ink-100 sm:h-80 lg:h-[21.5rem]">
        <Image
          src={lead.url}
          alt={lead.alt}
          fill
          priority
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover"
        />
        <button
          type="button"
          aria-label="Expand photograph"
          className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-card backdrop-blur transition-colors hover:bg-white"
        >
          <Expand className="size-4" />
        </button>
      </div>

      {grid.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:h-[21.5rem]">
          {grid.map((image, index) => {
            const isLast = index === grid.length - 1;
            const showOverlay = isLast && overflow > 0;

            return (
              <div key={image.url} className="relative h-24 overflow-hidden rounded-card bg-ink-100 sm:h-32 lg:h-auto">
                <Image
                  src={image.url}
                  alt={showOverlay ? '' : image.alt}
                  aria-hidden={showOverlay || undefined}
                  fill
                  sizes="(min-width: 1024px) 180px, 45vw"
                  className="object-cover"
                />
                {showOverlay ? (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-ink-950/60 text-sm font-medium text-white transition-colors hover:bg-ink-950/70"
                  >
                    See {overflow + 1}+ Images
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
