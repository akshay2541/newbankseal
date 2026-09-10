import Image from 'next/image';
import { BellRing, Landmark, Lock, ShieldCheck } from 'lucide-react';
import { Wordmark } from '@/components/layout/wordmark';
import { siteConfig } from '@/lib/site-config';

/**
 * Shell for the authentication routes: the form on one half, a full-bleed brand panel
 * on the other.
 *
 * The panel runs edge to edge and floor to ceiling — no page gutter, no radius, no
 * container. That is the whole effect, and it is why the split is a grid on the page
 * itself rather than inside the usual content column: a `max-w-page` wrapper would put
 * a margin down the outside of the image and turn it back into a card.
 *
 * The panel is presentation only — every claim it makes is repeated elsewhere on the
 * site — so below `lg` it drops out rather than stacking above the form and pushing the
 * first field below the fold on a phone. What survives the drop is a compact strip of
 * the same claims, so the page still says what it is.
 *
 * The image is a local asset rather than a remote one: an auth screen is the worst
 * place to depend on a third-party host, and it keeps `img-src` tight.
 */
const PROOF = [
  { icon: ShieldCheck, title: 'Verified listings', body: 'Every lot is checked against the bank’s own auction notice.' },
  { icon: BellRing, title: 'Deadline reminders', body: 'Alerts before EMD submission and auction dates close.' },
  { icon: Landmark, title: '15+ partner banks', body: 'SARFAESI and bank-seized assets from across India.' },
] as const;

const STATS = [
  ['50+', 'Active listings'],
  ['70+', 'Buyers served'],
  ['1–3 days', 'Verified onboarding'],
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid lg:min-h-[calc(100dvh-var(--spacing-header))] lg:grid-cols-2">
      <div className="relative isolate flex items-center justify-center overflow-hidden px-gutter py-section-lg">
        {/*
          A soft wash of brand colour behind the form. Without it this half is a flat
          off-white rectangle beside a photograph, and the two stop looking like one
          screen. Painted with gradients rather than an image so it costs nothing.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45rem_35rem_at_20%_-10%,var(--color-brand-100),transparent_65%),radial-gradient(35rem_30rem_at_90%_110%,var(--color-brand-50),transparent_70%)]"
        />

        <div className="w-full max-w-sm">
          {/* The panel's argument, compressed to a strip on the screens that lose it. */}
          <ul className="mb-block flex flex-wrap justify-center gap-x-4 gap-y-2 lg:hidden">
            {PROOF.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-1.5 text-2xs font-medium text-ink-500">
                <Icon className="size-3.5 text-brand-600" aria-hidden="true" />
                {title}
              </li>
            ))}
          </ul>

          {children}

          <p className="mt-block flex items-center justify-center gap-1.5 text-2xs text-ink-400">
            <Lock className="size-3" aria-hidden="true" />
            Encrypted in transit. We never store your password in readable form.
          </p>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <Image
          src="/images/luxury-architecture-exterior-design.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
        />
        {/* Deepens the frame so the copy keeps its contrast wherever the crop lands. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-900/80 to-ink-950/90"
        />

        {/*
          Narrative first, stats pinned to the floor with `mt-auto`. Spacing the three
          blocks evenly instead left a 250px hole in the middle of the panel on the
          taller sign-up page, where the form decides the height.
        */}
        <div className="relative flex h-full flex-col p-10 xl:p-14">
          <div>
            <Wordmark tone="inverse" />
            <p className="mt-6 max-w-sm font-display text-h2 font-bold tracking-tight text-white xl:max-w-md">
              The verified way to buy bank-auctioned assets in India.
            </p>
            <p className="mt-4 max-w-sm text-body leading-relaxed text-white/70">{siteConfig.tagline}</p>
          </div>

          <ul className="mt-block space-y-5">
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

          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-display text-h4 font-bold text-white">{value}</span>
                  <span className="mt-0.5 block text-2xs text-white/55">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
