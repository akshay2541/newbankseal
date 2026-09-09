import Image from 'next/image';
import { cn } from '@/lib/cn';

/**
 * Bank mark.
 *
 * Renders the real logo when `banks.logo_url` is populated; otherwise falls back to a
 * coloured monogram. The design shows each bank's actual mark, but those are licensed
 * brand assets we don't ship — the monogram keeps the row visually distinct and
 * correctly sized so dropping real logos in later is a data change, not a layout change.
 *
 * The tint is derived deterministically from the slug, so a given bank always gets the
 * same colour across renders, page loads and machines. Colours are drawn from a fixed
 * palette rather than generated, which keeps every combination legible.
 */
const TINTS = [
  'bg-brand-50 text-brand-700',
  'bg-price-soft text-price',
  'bg-success-soft text-success-500',
  'bg-warning-soft text-warning-500',
  'bg-danger-soft text-danger-500',
  'bg-ink-100 text-ink-600',
] as const;

/** FNV-1a — small, stable, and dependency-free. Not used for anything security-sensitive. */
function hashToIndex(value: string, buckets: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % buckets;
}

/** Up to two initials, skipping connecting words like "of" and "&". */
function initials(name: string): string {
  const skip = new Set(['of', 'and', '&', 'the']);
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function BankLogo({
  name,
  slug,
  logoUrl,
  className,
}: {
  name: string;
  slug: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span className={cn('relative size-7 shrink-0 overflow-hidden rounded-md', className)}>
        <Image src={logoUrl} alt="" aria-hidden="true" fill sizes="28px" className="object-contain" />
      </span>
    );
  }

  const tint = TINTS[hashToIndex(slug, TINTS.length)];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[0.625rem] font-bold tracking-tight',
        tint,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
