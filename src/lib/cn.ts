import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The design system's custom scales, mirrored from `@theme` in `globals.css`.
 *
 * tailwind-merge resolves conflicts from a built-in table of Tailwind's own utilities,
 * and it has no way to read our theme. Anything it does not recognise it guesses at,
 * and it guesses badly in both directions:
 *
 *   - an unknown `text-*` is assumed to be a colour, so `text-h1` and `text-brand-600`
 *     looked like two colours fighting and the size lost — that took the wordmark from
 *     40px to 16px, and stripped `text-white` off every button for the same reason;
 *   - an unknown spacing class is not recognised as conflicting with anything, so a
 *     call site passing `h-11` did not replace the primitive's `h-control` and the two
 *     were left to fight it out on stylesheet order.
 *
 * Both lists have to stay in step with the tokens. A token that is missing here still
 * renders — it just stops taking part in conflict resolution, which fails quietly.
 */
const FONT_SIZES = ['hero', 'h1', 'h2', 'h3', 'h4', 'h5', 'body', 'meta'] as const;

const SPACING = [
  'gutter',
  'section',
  'section-lg',
  'block',
  'card',
  'gap',
  'control',
  'control-sm',
  'control-lg',
  'header',
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: [...SPACING] },
    classGroups: { 'font-size': [{ text: [...FONT_SIZES] }] },
  },
});

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
