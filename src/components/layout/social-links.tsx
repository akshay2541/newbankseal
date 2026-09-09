import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

/**
 * Icons are resolved through a frozen map, never by interpolating the config string
 * into a component lookup, so config data can't select an arbitrary component.
 */
const ICONS = {
  youtube: Youtube,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
} as const;

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-1">
      {siteConfig.social.map((item, index) => {
        const Icon = item.icon in ICONS ? ICONS[item.icon as keyof typeof ICONS] : null;

        return (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 ? (
              <span aria-hidden="true" className="text-[0.5rem] text-white/30">
                •
              </span>
            ) : null}
            <a
              href={item.href}
              target="_blank"
              // noopener defeats reverse-tabnabbing; noreferrer stops the Referer leak.
              rel="noopener noreferrer"
              aria-label={item.label}
              className="inline-flex size-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {Icon ? (
                <Icon className="size-3.5" />
              ) : (
                <span aria-hidden="true" className="text-xs font-semibold">
                  {item.label.charAt(0)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
