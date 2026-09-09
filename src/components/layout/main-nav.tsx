'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * Primary navigation with an active-route indicator.
 *
 * A Client Component purely so it can read `usePathname()` — it holds no state and
 * receives its items from the server, so the cost is a few hundred bytes rather than
 * shipping the whole header to the browser.
 */
export function MainNav({
  items,
  className,
}: {
  items: ReadonlyArray<{ label: string; href: string }>;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={cn('items-center gap-7 xl:gap-8', className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-base transition-colors',
              active ? 'font-semibold text-brand-600' : 'font-normal text-ink-500 hover:text-ink-900',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * A nav item is active on its own route and on anything nested beneath it.
 *
 * The home page is treated as Explore: `/` is the marketplace browse surface, so
 * leaving every item grey there would make the bar look broken on the most-visited page.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === '/explore') {
    return pathname === '/' || pathname === '/explore' || pathname.startsWith('/explore/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
