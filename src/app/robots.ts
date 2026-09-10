import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/utils'

/**
 * robots.txt
 *
 * Everything public is crawlable. The three disallowed paths hold no indexable
 * content and would only waste crawl budget: the admin, the owner portal, and
 * the tracking endpoint.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/business', '/api/', '/dev/', '/login'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
