/**
 * App-store brand glyphs.
 *
 * NOTE FOR REVIEW: Google and Apple both require their *official* badge artwork, which
 * is downloadable from their brand pages and may not be redrawn. These are accurate
 * stand-ins so the footer reads correctly during development — swap in the official
 * assets before launch, and keep the required clear space around them.
 */

/** The four-colour Google Play triangle. */
export function GooglePlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 26" className={className} aria-hidden="true" focusable="false">
      {/* Left edge — the fold of the "page". */}
      <path d="M1 1.2 13.3 13 1 24.8A2.1 2.1 0 0 1 .3 23.2V2.8A2.1 2.1 0 0 1 1 1.2Z" fill="#00A0FF" />
      {/* Upper right — toward the play head. */}
      <path d="M18.2 8.3 14.8 11.5 1.6.7A1.9 1.9 0 0 1 3 .8l15.2 7.5Z" fill="#00E676" />
      {/* Lower right. */}
      <path d="M18.2 17.7 3 25.2a1.9 1.9 0 0 1-1.4.1l13.2-10.8 3.4 3.2Z" fill="#FF3A44" />
      {/* The nib. */}
      <path d="M22.9 11.2c1 .6 1 2.2 0 2.8l-3.4 1.8-3.9-3.2 3.9-3.2 3.4 1.8Z" fill="#FFCE00" />
    </svg>
  );
}

/** The Apple mark. */
export function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M17.05 12.54c.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.65.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.21 1.1-.05 1.52-.71 2.85-.71 1.33 0 1.71.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.54ZM14.87 5.9c.61-.74 1.02-1.77.91-2.8-.88.04-1.94.59-2.57 1.32-.56.65-1.05 1.7-.92 2.7.98.08 1.98-.5 2.58-1.22Z" />
    </svg>
  );
}
