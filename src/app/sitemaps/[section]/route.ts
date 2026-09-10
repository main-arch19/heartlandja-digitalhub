import {
  buildSitemapSection,
  isSitemapSection,
  renderUrlSet,
} from '@/lib/seo/sitemap'

/**
 * Per-section sitemap: /sitemaps/core.xml, /sitemaps/directory.xml, and so on.
 * Listed by the index at /sitemap.xml.
 *
 * The `.xml` suffix is part of the dynamic segment value and stripped here,
 * rather than being baked into the directory name — Next 16's route type
 * generator does not handle a dotted extension inside a dynamic segment.
 *
 * Cached for an hour rather than prerendered, so a newly published listing or
 * news post appears without a redeploy.
 */

export const revalidate = 3600

export async function GET(
  _request: Request,
  ctx: RouteContext<'/sitemaps/[section]'>,
) {
  const { section } = await ctx.params
  const name = section.replace(/\.xml$/, '')

  if (!isSitemapSection(name)) {
    return new Response('Not found', { status: 404 })
  }

  const entries = await buildSitemapSection(name)

  return new Response(renderUrlSet(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
