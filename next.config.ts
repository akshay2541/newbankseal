import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * `Content-Security-Policy` is intentionally NOT set here — it is emitted per-request
 * from `src/middleware.ts` so that it can carry a fresh nonce. Everything below is
 * request-independent and therefore safe to serve statically.
 */
const securityHeaders = [
  // Stop the browser from MIME-sniffing a response away from the declared content type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Clickjacking protection (CSP frame-ancestors is the modern equivalent; both are sent).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't leak full URLs (which may carry ids) to third parties.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 2 years, including subdomains. Only honoured over TLS.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Drop powerful APIs this product never uses.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
  },
  // Cross-origin isolation hardening.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Fail the production build on type or lint errors — never ship a broken contract.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  experimental: {
    // Server Actions are same-origin only; add deploy domains via env at rollout time.
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    // Every `quality` value used anywhere in the app must be declared here; Next 16
    // rejects undeclared ones rather than silently re-encoding at the default.
    qualities: [75, 82],
    // Allow-list remote image hosts explicitly; never use a wildcard.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // API responses must never be cached by shared caches.
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' }],
      },
    ];
  },
};

export default nextConfig;
