import type { NextConfig } from 'next'

/**
 * Supabase Storage is the only remote image host. Derived from the project URL
 * so a change of project needs no config edit.
 */
function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || /^(your|placeholder)/i.test(url)) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const storageHost = supabaseImageHost()

/**
 * Content Security Policy.
 *
 * Deliberately strict: no third-party scripts are used anywhere on the site, so
 * script-src is limited to our own origin. `unsafe-inline` is required for
 * Next's inline bootstrap and for JSON-LD blocks; `unsafe-eval` is dev-only.
 *
 * If a third-party embed is ever added, it must be added here explicitly —
 * which makes the performance cost a conscious decision rather than a silent one.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  `connect-src 'self'${storageHost ? ` https://${storageHost} wss://${storageHost}` : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // Enables `forbidden()` / `unauthorized()`, used by `requireRole` so a
    // signed-in user with the wrong role gets a real 403 page rather than a
    // redirect to sign-in (which is confusing — they are already signed in).
    authInterrupts: true,
  },

  images: {
    // AVIF first, WebP fallback. Matters on Jamaican cellular data.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: storageHost
      ? [{ protocol: 'https', hostname: storageHost, pathname: '/storage/v1/object/public/**' }]
      : [],
    // Sized for a 500KB page budget on mid-range Android.
    deviceSizes: [360, 414, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
