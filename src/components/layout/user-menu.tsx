'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, LogOut, Heart, LayoutDashboard } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { apiFetch } from '@/lib/csrf-client';
import { cn } from '@/lib/cn';

/** Account dropdown for signed-in users. */
export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const signOut = () => {
    startTransition(async () => {
      await apiFetch('/api/auth/sign-out', { method: 'POST' });
      setOpen(false);
      // Refresh clears every Server Component cache entry that embedded the session.
      router.refresh();
      router.push('/');
    });
  };

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface py-1 pr-2 pl-1 transition-colors hover:bg-ink-50"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-600 text-2xs font-semibold text-white">
          {initials || '?'}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-ink-800 sm:inline">{name}</span>
        <ChevronDown className={cn('size-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-border-subtle bg-surface shadow-float"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
            <p className="truncate text-xs text-ink-500">{email}</p>
            <p className="mt-1 text-2xs font-medium tracking-wide text-brand-600 uppercase">
              {role.replace('_', ' ')}
            </p>
          </div>

          <div className="p-1.5">
            <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onNavigate={() => setOpen(false)} />
            <MenuLink href="/watchlist" icon={Heart} label="Watchlist" onNavigate={() => setOpen(false)} />
          </div>

          <div className="border-t border-border-subtle p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={isPending}
              className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium text-danger-500 transition-colors hover:bg-danger-soft disabled:opacity-60"
            >
              <LogOut className="size-4" />
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: typeof Heart;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
    >
      <Icon className="size-4 text-ink-400" />
      {label}
    </Link>
  );
}
