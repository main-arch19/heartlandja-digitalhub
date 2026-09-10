import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'

import { Footer } from '@/components/layout/footer'
import { Masthead } from '@/components/layout/masthead'
import { JsonLd } from '@/components/seo/json-ld'
import { SITE } from '@/lib/constants'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld'
import { absoluteUrl } from '@/lib/utils'

import './globals.css'

/**
 * Fonts are self-hosted by next/font at build time — no runtime request to
 * Google, which matters on Jamaican cellular data. Both are variable fonts, so
 * the whole weight range costs one file each.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: {
    canonical: absoluteUrl('/'),
    types: {
      'application/rss+xml': [
        { url: absoluteUrl('/news/rss.xml'), title: `${SITE.name} — Parish News` },
      ],
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    url: absoluteUrl('/'),
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  formatDetection: { telephone: true, address: false, email: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f4d34',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-JM" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh flex flex-col bg-paper text-ink">
        <a href="#main" className="skip-link bg-green text-paper px-4 py-2 text-sm font-medium">
          Skip to content
        </a>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Masthead />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
