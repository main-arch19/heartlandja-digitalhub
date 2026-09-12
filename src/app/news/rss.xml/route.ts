import { richTextToPlainText } from '@/components/editorial/rich-text'
import { SITE } from '@/lib/constants'
import { getLatestNews } from '@/lib/data/news'
import { absoluteUrl } from '@/lib/utils'

/**
 * RSS feed for parish news.
 *
 * The root layout has advertised this URL in a <link rel="alternate"> since
 * Phase 1 — it was pointing at a 404 until now.
 *
 * Full text is deliberately NOT included, only the standfirst: a parish paper's
 * value is people arriving on the page, where the directory listings sit beside
 * the story. A full-text feed is read in the reader and never converts.
 */

export const revalidate = 1800

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = await getLatestNews(50)

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/news/${post.slug}`)
      const summary =
        post.excerpt ?? richTextToPlainText(post.body).slice(0, 300)

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(summary)}</description>
      ${post.publish_date ? `<pubDate>${new Date(post.publish_date).toUTCString()}</pubDate>` : ''}
      ${post.town ? `<category>${escapeXml(post.town)}</category>` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.name} — Parish News`)}</title>
    <link>${escapeXml(absoluteUrl('/news'))}</link>
    <description>${escapeXml('Weekly news from the parish of Clarendon, Jamaica.')}</description>
    <language>en-JM</language>
    <atom:link href="${escapeXml(absoluteUrl('/news/rss.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  })
}
