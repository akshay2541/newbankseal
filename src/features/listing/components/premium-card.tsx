import Link from 'next/link';

/**
 * Upgrade prompt shown to viewers without `listing:view_protected`.
 *
 * The body names exactly what unlocking reveals rather than gesturing at "full
 * details" — the gated fields are the address, the auction notice and the authorised
 * person's contact, and someone deciding whether to pay deserves to know that first.
 *
 * NOTE FOR REVIEW: the "3 Free Auction Details" offer is a commitment the application
 * cannot currently honour — there is no entitlement or usage counter behind it. Wire
 * that up (a per-account free-unlock allowance) before this goes in front of real
 * users, or drop the line; an offer the product cannot keep is worse than no offer.
 */
export function PremiumCard() {
  return (
    <div className="rounded-card bg-brand-600 px-6 py-7 text-center text-white">
      <RosetteIcon />

      <h2 className="mt-4 font-display text-h3 font-bold">Become premium member</h2>

      <p className="mx-auto mt-3 max-w-[17rem] text-sm leading-relaxed text-white/90">
        To view complete address, auction notice &amp; authorize person contact details
      </p>

      <Link
        href="/pricing"
        className="mt-5 inline-flex h-control-lg items-center gap-2 rounded-btn bg-cta px-6 text-base font-semibold text-white transition-colors hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Get Premium
        <UnlockKeyIcon />
      </Link>

      <p className="mt-5">
        <Link href="/sign-up" className="inline-flex min-h-control items-center text-body font-semibold text-white underline underline-offset-4">
          Register Now
        </Link>
      </p>

      <p className="mt-1.5 text-sm text-white/90">
        &amp; Claim <span className="font-bold text-white">3 Free</span> Auction Details!
      </p>

      <p className="mt-5 text-meta text-white/70">If you are already a premium member</p>

      <p className="mt-1 flex items-center justify-center gap-5">
        <Link href="/sign-in" className="inline-flex min-h-control items-center text-body font-semibold text-white underline underline-offset-4">
          Login
        </Link>
        <Link href="/sign-up" className="inline-flex min-h-control items-center text-body font-semibold text-white underline underline-offset-4">
          Register
        </Link>
      </p>
    </div>
  );
}

/**
 * Award rosette. Drawn inline rather than pulled from the icon set because the design's
 * mark is two-tone — a gold scalloped medal over red ribbon tails — and the library's
 * single-colour award glyph loses that entirely.
 */
function RosetteIcon() {
  return (
    <svg viewBox="0 0 64 64" className="mx-auto size-16" aria-hidden="true" focusable="false">
      {/* Ribbon tails, behind the medal. */}
      <path d="M22 40 L14 60 L23 56 L28 62 L34 44 Z" fill="#E8462F" />
      <path d="M42 40 L50 60 L41 56 L36 62 L30 44 Z" fill="#D93A28" />

      {/* Scalloped outer edge. */}
      <g fill="#F0A400">
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index / 16) * Math.PI * 2;
          return (
            <circle key={index} cx={32 + Math.cos(angle) * 21} cy={26 + Math.sin(angle) * 21} r={5} />
          );
        })}
      </g>

      <circle cx="32" cy="26" r="21" fill="#F5B301" />
      <circle cx="32" cy="26" r="15" fill="#E09600" />
      <circle cx="32" cy="26" r="12" fill="#FFC93C" />

      {/* Star. */}
      <path
        d="M32 17.5 34.6 24.2 41.5 24.6 36.2 29 38 35.7 32 31.9 26 35.7 27.8 29 22.5 24.6 29.4 24.2 Z"
        fill="#E08A00"
      />
    </svg>
  );
}

/** Magnifier-over-key mark from the design's button. */
function UnlockKeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.5 14.5 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 7.4v5.2M8.4 11.4h1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
