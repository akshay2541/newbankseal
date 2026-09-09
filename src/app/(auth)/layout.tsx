import Image from 'next/image';
import { Wordmark } from '@/components/layout/wordmark';
import { siteConfig } from '@/lib/site-config';

/**
 * Split-screen shell for the authentication routes: the form on the left, a brand
 * panel on the right that collapses away below `lg`.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-var(--spacing-header))] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block" aria-hidden="true">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=70"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/90 via-ink-950/70 to-ink-950/40" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <Wordmark tone="inverse" className="text-3xl lg:text-3xl" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{siteConfig.tagline}</p>
        </div>
      </aside>
    </div>
  );
}
