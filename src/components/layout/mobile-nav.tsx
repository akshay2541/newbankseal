'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/** Expo-out: quick off the mark, long settle. Reads as considered rather than snappy. */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Navigation for viewports below `lg`.
 *
 * The panel unrolls downward out of the header's bottom edge rather than sliding in
 * from the side, so it overlays the page instead of pushing it down. Height is animated
 * with a `grid-template-rows: 0fr -> 1fr` transition, which animates the panel's real
 * height without anyone having to hard-code one — the links can change without the
 * animation breaking.
 *
 * The panel stays mounted while closed so it can animate rather than pop, and is marked
 * `inert` in that state: without it the hidden links would still take focus and be read
 * out by a screen reader.
 */
export function MobileNav({
  items,
  isAuthenticated,
}: {
  items: ReadonlyArray<{ label: string; href: string }>;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // A tap that navigates should dismiss the panel, including on a link to the current
  // page where the click handler alone would not fire a route change.
  useEffect(() => setOpen(false), [pathname]);

  /**
   * Lock the page behind the panel.
   *
   * `overflow: hidden` alone is ignored by iOS Safari, so the body is pinned at its
   * current offset and the scroll position restored on close. The padding compensates
   * for the scrollbar the lock removes, which would otherwise jog the page sideways.
   */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    return () => {
      Object.assign(body.style, previous);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  /**
   * Escape closes it, and so does growing past `lg` — otherwise the panel hides itself
   * at the breakpoint and leaves the body locked with no way to unlock it.
   */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 1024px)');
    const onBreakpoint = () => {
      if (wide.matches) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    wide.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onBreakpoint);
    };
  }, [open]);

  /**
   * Focus the panel itself on open — not its first link, which would paint a focus ring
   * on "Explore" for touch users too — and hand focus back to the toggle on close.
   * `preventScroll` matters: closing makes the panel inert, which blurs to the body, and
   * focusing the toggle would otherwise scroll it into view and undo the restored
   * scroll position.
   */
  useEffect(() => {
    if (open) {
      panelRef.current?.focus({ preventScroll: true });
    } else if (document.activeElement === document.body) {
      toggleRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="-mr-1.5 inline-flex size-11 items-center justify-center rounded-btn text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Kept mounted so it fades rather than pops. */}
      <div
        onClick={() => setOpen(false)}
        style={{ transitionTimingFunction: EASE }}
        className={cn(
          'fixed inset-0 z-10 bg-ink-950/40 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      {/*
        `absolute … top-full` hangs the panel off the bar's bottom edge, outside the
        flow, so nothing below it reflows when it opens.
      */}
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        tabIndex={-1}
        inert={!open}
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transitionTimingFunction: EASE }}
        className={cn(
          'absolute inset-x-0 top-full z-20 grid overflow-hidden rounded-b-panel border-b border-border-subtle bg-surface',
          'shadow-float focus:outline-none',
          'transition-[grid-template-rows,opacity] duration-[340ms] lg:hidden',
          'motion-reduce:transition-none',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <nav aria-label="Mobile" className="mx-auto w-full max-w-page px-4 py-4 sm:px-6">
            {items.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  transitionTimingFunction: EASE,
                  // Items trail the panel on the way in and unwind bottom-up on the way out.
                  transitionDelay: open ? `${70 + index * 40}ms` : `${(items.length - 1 - index) * 25}ms`,
                }}
                className={cn(
                  'flex min-h-12 items-center rounded-btn px-3 text-sm font-medium text-ink-700',
                  'transition-[opacity,transform,color,background-color] duration-300',
                  'hover:bg-ink-50 hover:text-ink-900 motion-reduce:transition-none',
                  open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
              >
                {item.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <div
                style={{
                  transitionTimingFunction: EASE,
                  transitionDelay: open ? `${70 + items.length * 40}ms` : '0ms',
                }}
                className={cn(
                  'mt-3 grid gap-2 border-t border-border-subtle pt-4',
                  'transition-[opacity,transform] duration-300 motion-reduce:transition-none',
                  open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
              >
                <Button asChild variant="primary" size="lg">
                  <Link href="/sign-up" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      </div>
    </>
  );
}
