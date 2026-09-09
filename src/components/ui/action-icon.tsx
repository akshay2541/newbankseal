import { cn } from '@/lib/cn';

/**
 * Row action icons — share and save — from the designer's Line Duotone set.
 *
 * Each path keeps its own fill/stroke treatment because these icons mix the two: the
 * heart is a filled outline with a half-opacity stroked highlight over it. The
 * half-opacity paths are the set's duotone weighting and are deliberate; flattening
 * them turns the icons into plain outlines.
 *
 * Two things were changed from the source files. The designer's `#171414` became
 * `currentColor`, so the colour comes from the theme rather than a baked-in hex. And
 * the share icon's `clipPath` was dropped: it was a full-size rect that clipped
 * nothing, but it carried a hard-coded element id that would have been duplicated once
 * per result row — invalid HTML, and the kind of thing that breaks unpredictably.
 *
 * Only geometry and a whitelist of presentation attributes crossed over, each
 * validated at generation time, so no markup from those files reaches the DOM.
 */

const ACTION_GLYPHS = {
  share: {
    viewBox: '0 0 16 16',
    paths: (
      <>
      <path d="M14.6666 9.33195C14.6473 11.608 14.5209 12.8627 13.6935 13.6901C12.7169 14.6667 11.1452 14.6667 8.00166 14.6667C4.85814 14.6667 3.28638 14.6667 2.30982 13.6901C1.33325 12.7135 1.33325 11.1418 1.33325 7.99827C1.33325 4.85475 1.33325 3.283 2.30982 2.30643C3.13725 1.479 4.39196 1.35264 6.66798 1.33334" stroke="currentColor" opacity={0.5} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M14.6667 4.66668H9.33333C8.20807 4.66668 7.49786 5.1795 7.18531 5.47066C7.06234 5.58522 7.00086 5.6425 6.98834 5.65501C6.97582 5.66753 6.91854 5.72902 6.80399 5.85199C6.51282 6.16454 6 6.87474 6 8.00001V10M11.3333 8.00001L14.6667 4.66668L11.3333 1.33334" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  heart: {
    viewBox: '0 0 16 16',
    paths: (
      <>
      <path d="M8 3.66733L9.33333 5.00028" stroke="currentColor" opacity={0.5} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M5.97441 12.6073L6.43872 12.0183L5.97441 12.6073ZM7.99992 3.66709L7.45955 4.18719C7.60094 4.33408 7.79604 4.41709 7.99992 4.41709C8.2038 4.41709 8.3989 4.33408 8.54028 4.18719L7.99992 3.66709ZM10.0254 12.6073L10.4897 13.1962L10.0254 12.6073ZM5.97441 12.6073L6.43872 12.0183C5.41345 11.21 4.33627 10.4524 3.47904 9.48717C2.64752 8.55085 2.08325 7.47831 2.08325 6.0914H1.33325H0.583252C0.583252 7.94644 1.3588 9.35867 2.35747 10.4832C3.33043 11.5788 4.57383 12.4582 5.51009 13.1962L5.97441 12.6073ZM1.33325 6.0914H2.08325C2.08325 4.75102 2.84027 3.63995 3.85342 3.17683C4.81929 2.73533 6.15155 2.82823 7.45955 4.18719L7.99992 3.66709L8.54028 3.14699C6.84839 1.38917 4.84732 1.07324 3.22983 1.8126C1.65962 2.53035 0.583252 4.18982 0.583252 6.0914H1.33325ZM5.97441 12.6073L5.51009 13.1962C5.84928 13.4636 6.22932 13.7618 6.61834 13.9891C7.00711 14.2163 7.47619 14.4167 7.99992 14.4167V13.6667V12.9167C7.85698 12.9167 7.65939 12.8601 7.37512 12.694C7.09109 12.5281 6.79171 12.2965 6.43872 12.0183L5.97441 12.6073ZM10.0254 12.6073L10.4897 13.1962C11.426 12.4582 12.6694 11.5788 13.6424 10.4832C14.641 9.35867 15.4166 7.94644 15.4166 6.0914H14.6666H13.9166C13.9166 7.47831 13.3523 8.55085 12.5208 9.48717C11.6636 10.4524 10.5864 11.21 9.56112 12.0183L10.0254 12.6073ZM14.6666 6.0914H15.4166C15.4166 4.18982 14.3402 2.53035 12.77 1.8126C11.1525 1.07324 9.15145 1.38917 7.45955 3.14699L7.99992 3.66709L8.54028 4.18719C9.84828 2.82823 11.1805 2.73533 12.1464 3.17683C13.1596 3.63995 13.9166 4.75102 13.9166 6.0914H14.6666ZM10.0254 12.6073L9.56112 12.0183C9.20813 12.2965 8.90874 12.5281 8.62471 12.694C8.34044 12.8601 8.14285 12.9167 7.99992 12.9167V13.6667V14.4167C8.52365 14.4167 8.99273 14.2163 9.3815 13.9891C9.77052 13.7618 10.1506 13.4636 10.4897 13.1962L10.0254 12.6073Z" fill="currentColor" />
      </>
    ),
  },
} as const;

export type ActionIconKey = keyof typeof ACTION_GLYPHS;

export function ActionIcon({ icon, className }: { icon: ActionIconKey; className?: string }) {
  const glyph = ACTION_GLYPHS[icon];

  return (
    <svg
      viewBox={glyph.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-4', className)}
    >
      {glyph.paths}
    </svg>
  );
}
