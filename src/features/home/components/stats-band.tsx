import { cn } from '@/lib/cn';

/**
 * Trust figures shown above the footer.
 *
 * The design sets the numbers in brand blue and separates the columns with a short,
 * vertically centred hairline rather than a full-height rule — one card holding four
 * readings, not four boxes butted together.
 */
const STATS = [
  { value: '50+', label: 'Active listings' },
  { value: '70+', label: 'Happy Clients' },
  { value: '15+', label: 'Partner banks' },
  { value: '1–3 days', label: 'Verified onboarding' },
] as const;

export function StatsBand({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-[1.75rem] bg-surface px-4 py-9 shadow-lift sm:px-8 sm:py-11', className)}
      aria-label="Marketplace at a glance"
    >
      <dl className="grid grid-cols-2 gap-y-9 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <div key={stat.label} className="relative px-4 sm:px-8">
            {/* Divider belongs to the item on its right, and is suppressed wherever
                that item starts a row so no rule ever hangs off the card's edge. */}
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1/2 left-0 h-14 w-px -translate-y-1/2 bg-border-subtle',
                  index % 2 === 0 && 'hidden lg:block',
                )}
              />
            ) : null}

            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-brand-600 sm:text-[2.625rem]">
                {stat.value}
              </span>
              <span className="mt-3 block text-[0.9375rem] text-ink-800">{stat.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
