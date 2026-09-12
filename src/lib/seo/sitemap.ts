import 'server-only'

import {
  getAllActiveBusinesses,
  getCategories,
  getTownsWithCounts,
} from '@/lib/data/directory'
import { getLatestNews, getSections } from '@/lib/data/news'
import { getTopicsWithCounts } from '@/lib/data/topics'
import { absoluteUrl } from '@/lib/utils'

/**
 * Sitemap generation.
 *
 * Hand-rolled rather than using Next's `sitemap.ts` convention, because that
 * convention reserves /sitemap.xml for itself and provides no index tying the
 * split files together — leaving the one URL that robots.txt advertises, and
 * that gets submitted to Search Console, returning a 404.
 *
 * So: /sitemap.xml is a real index route, and each section is served from
 * /sitemaps/<section>.xml. Splitting by content type from the start means
 * Phase 3's news engine fills an existing section rather than forcing a
 * restructure.
 */

export const SITEMAP_SECTIONS = [
  'core',
  'directory',
  'towns',
  'news',
  'topics',
] as const

export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]

export function isSitemapSection(value: string): value is SitemapSection {
  return (SITEMAP_SECTIONS as readonly string[]).includes(value)
}

interface UrlEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

/** XML-escapes a URL. Slugs are generated, but this is not the place to assume. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderUrlSet(entries: UrlEntry[]): string {
  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority !== undefined) {
        parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
      }
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function renderSitemapIndex(sections: readonly string[]): string {
  const lastmod = new Date().toISOString()
  const entries = sections
    .map(
      (section) => `  <sitemap>
    <loc>${escapeXml(absoluteUrl(`/sitemaps/${section}.xml`))}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`
}

export async function buildSitemapSection(
  section: SitemapSection,
): Promise<UrlEntry[]> {
  const now = new Date().toISOString()

  if (section === 'directory') {
    const [categories, businesses] = await Promise.all([
      getCategories(),
      getAllActiveBusinesses(),
    ])

    return [
      ...categories.map((category) => ({
        loc: absoluteUrl(`/directory/${category.slug}`),
        lastmod: new Date(category.updated_at).toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      })),
      ...businesses.map((business) => ({
        loc: absoluteUrl(`/directory/${business.category.slug}/${business.slug}`),
        lastmod: new Date(business.updated_at).toISOString(),
        changefreq: 'monthly',
        // Featured listings are the pages we most want crawled often.
        priority: business.tier.featured_placement ? 0.8 : 0.6,
      })),
    ]
  }

  if (section === 'towns') {
    const towns = await getTownsWithCounts()
    return towns.map((town) => ({
      loc: absoluteUrl(`/directory/town/${town.slug}`),
      lastmod: now,
      changefreq: 'weekly',
      priority: town.count > 0 ? 0.8 : 0.4,
    }))
  }

  if (section === 'news') {
    const [posts, towns] = await Promise.all([
      getLatestNews(1000),
      getTownsWithCounts(),
    ])
    return [
      ...posts.map((post) => ({
        loc: absoluteUrl(`/news/${post.slug}`),
        lastmod: new Date(post.updated_at).toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
      })),
      // Local news feeds. Every known town gets one, as with the directory:
      // an empty feed still ranks for "<town> news" and still carries the
      // weather and the directory cross-link.
      ...towns.map((town) => ({
        loc: absoluteUrl(`/news/town/${town.slug}`),
        lastmod: now,
        changefreq: 'daily',
        priority: 0.6,
      })),
    ]
  }

  if (section === 'topics') {
    const topics = await getTopicsWithCounts()
    return [
      { loc: absoluteUrl('/topics'), lastmod: now, changefreq: 'weekly', priority: 0.7 },
      ...topics.map((entry) => ({
        loc: absoluteUrl(`/topics/${entry.topic.slug}`),
        lastmod: new Date(entry.topic.updated_at).toISOString(),
        changefreq: 'weekly',
        // A topic with stories is a real landing page; an empty one is a
        // promise. Both are crawlable, but they are not equally important.
        priority: entry.count > 0 ? 0.8 : 0.4,
      })),
    ]
  }

  // core
  const sections = await getSections()
  return [
    { loc: absoluteUrl('/'), lastmod: now, changefreq: 'daily', priority: 1 },
    { loc: absoluteUrl('/news'), lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: absoluteUrl('/directory'), lastmod: now, changefreq: 'weekly', priority: 0.9 },
    { loc: absoluteUrl('/magazine'), lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { loc: absoluteUrl('/history'), lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { loc: absoluteUrl('/podcast'), lastmod: now, changefreq: 'weekly', priority: 0.7 },
    { loc: absoluteUrl('/live'), lastmod: now, changefreq: 'weekly', priority: 0.6 },
    { loc: absoluteUrl('/advertise'), lastmod: now, changefreq: 'monthly', priority: 0.7 },
    ...sections.map((s) => ({
      loc: absoluteUrl(`/sections/${s.slug}`),
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.7,
    })),
  ]
}
