import type { Metadata } from 'next'

import { SITE } from '@/lib/constants'
import { absoluteUrl, truncate } from '@/lib/utils'
import type { SeoFields } from '@/types/db'

/**
 * Metadata construction.
 *
 * Every page gets a unique title and description. Editors may override any of
 * it per record via the shared SEO column group; where they haven't, we
 * generate a sane default from the content itself. Nothing renders a bare
 * site-name title.
 */

interface BuildMetadataInput {
  title: string
  description: string
  path: string
  /** Editor overrides from a content row. Null fields fall back to generated. */
  seo?: Partial<SeoFields> | null
  images?: { url: string; alt?: string; width?: number; height?: number }[]
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  authors?: string[]
  section?: string
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = input.seo?.seo_title?.trim() || input.title
  const description = truncate(
    input.seo?.seo_description?.trim() || input.description,
    160,
  )
  const canonical = input.seo?.canonical_url?.trim() || absoluteUrl(input.path)

  const ogImage = input.seo?.og_image_url?.trim()
  const images = ogImage
    ? [{ url: ogImage, alt: title, width: 1200, height: 630 }]
    : input.images?.length
      ? input.images
      : [{ url: absoluteUrl('/opengraph-image'), alt: SITE.name, width: 1200, height: 630 }]

  return {
    title,
    description,
    alternates: { canonical },
    robots: input.seo?.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: input.type ?? 'website',
      images,
      ...(input.type === 'article'
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            authors: input.authors,
            section: input.section,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  }
}

/**
 * Directory category pages.
 *
 * These must rank for "plumber in May Pen" and equivalents, so the generated
 * default names the parish explicitly rather than relying on the site name.
 */
export function categoryMetaDefaults(categoryName: string, count: number) {
  const plural = count === 1 ? 'business' : 'businesses'
  return {
    title: `${categoryName} in Clarendon, Jamaica`,
    description:
      count > 0
        ? `Find ${categoryName.toLowerCase()} in Clarendon. ${count} ${plural} listed with phone numbers, opening hours and directions across May Pen, Chapelton, Frankfield and the wider parish.`
        : `${categoryName} in Clarendon, Jamaica. Browse the Heartland JA directory for local businesses across the parish.`,
  }
}

export function townMetaDefaults(town: string, count: number) {
  const plural = count === 1 ? 'business' : 'businesses'
  return {
    title: `Businesses in ${town}, Clarendon`,
    description:
      count > 0
        ? `${count} ${plural} listed in ${town}, Clarendon. Phone numbers, opening hours, directions and contact details for local services.`
        : `Business directory for ${town}, Clarendon. Find local services and contact details.`,
  }
}

export function topicMetaDefaults(
  topicName: string,
  count: number,
  description?: string | null,
) {
  const plural = count === 1 ? 'story' : 'stories'
  return {
    title: `${topicName} — Clarendon news`,
    description:
      description?.trim() ||
      (count > 0
        ? `${count} ${plural} on ${topicName.toLowerCase()} from across Clarendon parish, reported by Heartland JA.`
        : `${topicName} in Clarendon, Jamaica. News and reporting from across the parish by Heartland JA.`),
  }
}

export function listingMetaDefaults(business: {
  name: string
  town: string
  categoryName: string
  description?: string | null
}) {
  return {
    title: `${business.name} — ${business.town}, Clarendon`,
    description:
      business.description?.trim() ||
      `${business.name} in ${business.town}, Clarendon. ${business.categoryName} listed in the Heartland JA business directory, with phone, opening hours and directions.`,
  }
}
