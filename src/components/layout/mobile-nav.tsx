'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Off-canvas navigation for viewports below `lg`.
 *
 * Closes on route change and on Escape, and locks body scroll while open so the
 * page behind doesn't move under the panel on iOS.
 */
export function MobileNav({
  items,
  isAuthenticated,
}: {
  items: ReadonlyArray<{ label: string; href: string }>;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="inline-flex size-9 items-center justify-center rounded-btn text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
          />

          <div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-float"
          >
            <div className="flex h-header items-center justify-between border-b border-border-subtle px-5">
              <span className="text-sm font-semibold text-ink-900">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-btn text-ink-600 hover:bg-ink-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-btn px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!isAuthenticated ? (
              <div className="grid gap-2 border-t border-border-subtle p-4">
                <Button asChild variant="primary" size="md">
                  <Link href="/sign-up" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button asChild variant="outline" size="md">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
