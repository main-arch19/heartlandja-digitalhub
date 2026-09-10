import { SITEMAP_SECTIONS, renderSitemapIndex } from '@/lib/seo/sitemap'

/**
 * Sitemap index — the URL advertised in robots.txt and submitted to Search
 * Console. Points at the per-section sitemaps under /sitemaps/.
 */

export const revalidate = 3600

export async function GET() {
  return new Response(renderSitemapIndex(SITEMAP_SECTIONS), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
