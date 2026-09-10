import Image from 'next/image';
import { BellRing, Landmark, Lock, ShieldCheck } from 'lucide-react';
import { Wordmark } from '@/components/layout/wordmark';
import { siteConfig } from '@/lib/site-config';

/**
 * Shell for the authentication routes.
 *
 * The form sits in a lifted white card on the warm page ground, with a brand panel
 * beside it on wide screens. The panel is presentation only — every claim it makes is
 * repeated elsewhere on the site — so below `lg` it drops out entirely rather than
 * stacking above the form and pushing the first field below the fold on a phone. What
 * survives the drop is a compact lockup, so the page still identifies itself.
 *
 * The panel image is a local asset rather than a remote one: an auth screen is the
 * worst place to depend on a third-party host, and it keeps `img-src` tight.
 */
const PROOF = [
  { icon: ShieldCheck, title: 'Verified listings', body: 'Every lot is checked against the bank’s own auction notice.' },
  { icon: BellRing, title: 'Deadline reminders', body: 'Alerts before EMD submission and auction dates close.' },
  { icon: Landmark, title: '15+ partner banks', body: 'SARFAESI and bank-seized assets from across India.' },
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-surface-muted">
      {/*
        Two soft washes of brand colour behind the card, which is what stops a plain
        off-white page from reading as an unstyled form. Painted with gradients rather
        than an image so they cost nothing and scale to any viewport.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-10%,var(--color-brand-100),transparent_60%),radial-gradient(45rem_35rem_at_100%_100%,var(--color-brand-50),transparent_65%)]"
      />

      <div className="mx-auto grid w-full max-w-page items-center gap-10 px-4 py-10 sm:px-6 lg:items-stretch lg:min-h-[calc(100dvh-var(--spacing-header))] lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:py-16">
        <div className="w-full lg:my-auto">
          {/*
            The panel's argument, compressed to a strip below `lg`. Not the wordmark
            too — the header already carries it a few pixels above, and repeating it
            just pushes the first field further down a phone screen.
          */}
          <ul className="mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 lg:hidden">
            {PROOF.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-1.5 text-2xs font-medium text-ink-500">
                <Icon className="size-3.5 text-brand-600" aria-hidden="true" />
                {title}
              </li>
            ))}
          </ul>

          <div className="rounded-panel border border-border-subtle bg-surface p-6 shadow-lift sm:p-8">{children}</div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-ink-400">
            <Lock className="size-3" aria-hidden="true" />
            Encrypted in transit. We never store your password in readable form.
          </p>
        </div>

        <aside className="relative hidden overflow-hidden rounded-hero bg-ink-950 lg:block">
          <Image
            src="/images/luxury-architecture-exterior-design.webp"
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1024px) 46vw, 0px"
            className="object-cover opacity-45"
          />
          {/* Deepens the lower half so the copy keeps its contrast wherever the crop lands. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-900/80 to-ink-950/85"
          />

          <div className="relative flex h-full flex-col justify-between gap-10 p-9 xl:p-12">
            <div>
              <Wordmark tone="inverse" className="text-3xl lg:text-3xl" />
              <p className="mt-6 max-w-sm font-display text-[1.75rem] leading-[1.25] font-bold tracking-tight text-white xl:max-w-md xl:text-[2rem]">
                The verified way to buy bank-auctioned assets in India.
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{siteConfig.tagline}</p>
            </div>

            <ul className="space-y-5">
              {PROOF.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-btn bg-white/10 text-white ring-1 ring-white/15"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                ['50+', 'Active listings'],
                ['70+', 'Buyers served'],
                ['1–3 days', 'Verified onboarding'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block font-display text-xl font-bold text-white">{value}</span>
                    <span className="mt-0.5 block text-2xs text-white/55">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
