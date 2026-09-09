import { AppleGlyph, GooglePlayGlyph } from '@/components/ui/store-glyphs';
import { cn } from '@/lib/cn';

/** "Get it on Google Play" / "Download on the App Store" buttons from the footer. */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <StoreBadge
        href="#"
        label="Get it on Google Play"
        caption="GET IT ON"
        name="Google Play"
        glyph={<GooglePlayGlyph className="h-6 w-auto" />}
      />
      <StoreBadge
        href="#"
        label="Download on the App Store"
        caption="Download on the"
        name="App Store"
        glyph={<AppleGlyph className="h-6 w-auto text-white" />}
      />
    </div>
  );
}

function StoreBadge({
  href,
  label,
  caption,
  name,
  glyph,
}: {
  href: string;
  label: string;
  caption: string;
  name: string;
  glyph: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex items-center gap-2.5 rounded-lg bg-ink-950 px-3.5 py-2 transition-opacity hover:opacity-90"
    >
      {glyph}
      <span className="leading-tight">
        <span className="block text-[0.5rem] tracking-wide text-white uppercase">{caption}</span>
        <span className="block text-[0.9375rem] leading-tight font-semibold text-white">{name}</span>
      </span>
    </a>
  );
}
