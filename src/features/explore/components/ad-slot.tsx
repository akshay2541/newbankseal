import { cn } from '@/lib/cn';

/**
 * Advertising placeholder.
 *
 * The design reserves space for Google Ads. This renders the reserved box at the right
 * size rather than embedding an ad script: dropping a third-party tag in now would pull
 * an external script into every page, which needs its own CSP entry and a privacy
 * review. Swap the inner content for the real unit when that decision is made — the
 * fixed height means doing so will not shift the layout.
 */
export function AdSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-card border border-border-subtle bg-ink-50 px-6',
        className,
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      <span className="text-sm font-medium text-ink-400">Advertisement</span>
    </div>
  );
}
