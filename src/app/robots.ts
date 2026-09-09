import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated and transactional surfaces must never be indexed.
        disallow: ['/api/', '/dashboard', '/watchlist', '/account', '/sign-in', '/sign-up', '/reset-password'],
      },
    ],
    sitemap: `${clientEnv.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
