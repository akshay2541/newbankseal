'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Horizontal scroll rail with overlay arrows — the carousel pattern used for the
 * property and news sections.
 *
 * Built on native overflow + scroll-snap rather than a transform-based carousel so
 * that touch, trackpad, keyboard and screen-reader navigation all work for free.
 * The arrows are progressive enhancement: they hide when there is nothing to scroll
 * to, and the rail is fully usable without them.
 */
export function Rail({
  children,
  ariaLabel,
  className,
  itemClassName,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  itemClassName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px tolerance: sub-pixel layout means scrollLeft rarely hits the exact bound.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });

    // Content and viewport can both change after mount (images loading, resize).
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', syncArrows);
      observer.disconnect();
    };
  }, [syncArrows]);

  // The ResizeObserver above only sees the scroller's own box, which does not change
  // when its contents do — a filtered rail can go from twelve cards to one and still
  // advertise a scroll that no longer exists. Re-measure whenever the items change.
  useEffect(syncArrows, [children, syncArrows]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Move by ~85% of the viewport so the next card is partially visible as an affordance.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn('rail gap-gap pb-1', itemClassName)}
      >
        {children}
      </div>

      <RailEdgeFade side="left" hidden={!canScrollLeft} />
      <RailEdgeFade side="right" hidden={!canScrollRight} />

      <RailArrow side="left" hidden={!canScrollLeft} onClick={() => scrollByPage(-1)} />
      <RailArrow side="right" hidden={!canScrollRight} onClick={() => scrollByPage(1)} />
    </div>
  );
}

/**
 * The soft page-coloured fade at each end of a rail: it signals "there is more this
 * way" and stops a card from being sliced off at a hard edge.
 *
 * Purely decorative — `aria-hidden` and `pointer-events-none` keep it out of both the
 * accessibility tree and the drag/scroll path. It tracks the same scroll state as the
 * arrows, so a rail that fits its container shows no fade at all.
 */
function RailEdgeFade({ side, hidden }: { side: 'left' | 'right'; hidden: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 w-10 transition-opacity duration-200 sm:w-16',
        side === 'left'
          ? 'left-0 bg-gradient-to-r from-surface-muted to-transparent'
          : 'right-0 bg-gradient-to-l from-surface-muted to-transparent',
        hidden && 'opacity-0',
      )}
    />
  );
}

function RailArrow({ side, hidden, onClick }: { side: 'left' | 'right'; hidden: boolean; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      // Removed from the a11y tree entirely when inert: the rail itself is already
      // focusable and scrollable, so a disabled duplicate control adds only noise.
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      className={cn(
        'absolute top-1/2 z-20 hidden size-control-sm -translate-y-1/2 items-center justify-center rounded-full',
        'border border-border-subtle bg-surface text-ink-700 shadow-lift',
        'transition-all hover:bg-ink-50 hover:text-ink-900 sm:flex',
        side === 'left' ? '-left-3' : '-right-3',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
