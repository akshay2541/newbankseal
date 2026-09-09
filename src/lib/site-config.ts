/**
 * Product-level constants. Kept in one place so the wordmark, nav and legal links
 * can be updated without touching component code.
 */
export const siteConfig = {
  name: 'Bank Seal',
  /** Rendered in the header/footer lockup. */
  wordmark: 'BANK SEAL',
  tagline: 'Verified bank-seized and SARFAESI auction assets, in one marketplace.',
  description:
    'Browse verified bank-seized and SARFAESI auction properties, vehicles and assets across India. Reserve prices, EMD details and auction dates, updated daily.',

  primaryNav: [
    { label: 'Explore', href: '/explore' },
    { label: 'Auctions', href: '/auctions' },
    { label: 'Banks', href: '/banks' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'For Sellers', href: '/sellers' },
    { label: 'Help', href: '/help' },
  ],

  footerNav: {
    Explore: [
      { label: 'Properties', href: '/explore' },
      { label: 'FAQ', href: '/help/faq' },
      { label: 'Case Studies', href: '/case-studies' },
    ],
    'For Buyers': [
      { label: `About ${'Bank Seal'}`, href: '/about' },
      { label: 'Blogs', href: '/blog' },
      { label: 'Jobs', href: '/careers' },
    ],
    Links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms & Conditions', href: '/legal/terms' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },

  social: [
    { label: 'X', href: 'https://x.com', icon: 'x' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
