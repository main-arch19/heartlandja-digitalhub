import { SITE } from '@/lib/constants'
import { absoluteUrl, externalHref } from '@/lib/utils'
import type { BusinessWithRelations, Episode, NewsPost, OpeningHours } from '@/types/db'

/**
 * JSON-LD builders.
 *
 * `LocalBusiness` on every listing is the one that matters commercially — it is
 * what puts a listing into Google's local results with a phone number and
 * opening hours attached.
 */

const ISO_DAY_TO_SCHEMA: Record<string, string> = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
  '7': 'Sunday',
}

function openingHoursSpecification(hours: OpeningHours | null) {
  if (!hours) return undefined
  const spec: Record<string, unknown>[] = []
  for (const [day, ranges] of Object.entries(hours)) {
    const dayName = ISO_DAY_TO_SCHEMA[day]
    if (!dayName || !ranges) continue
    for (const range of ranges) {
      spec.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${dayName}`,
        opens: range.open,
        closes: range.close,
      })
    }
  }
  return spec.length > 0 ? spec : undefined
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: SITE.name,
    url: absoluteUrl('/'),
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/opengraph-image'),
    },
    sameAs: [SITE.social.instagram, SITE.social.facebook],
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Clarendon Parish',
      containedInPlace: { '@type': 'Country', name: 'Jamaica' },
    },
    email: SITE.contact.email,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: SITE.name,
    url: absoluteUrl('/'),
    publisher: { '@id': absoluteUrl('/#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function localBusinessJsonLd(business: BusinessWithRelations) {
  const path = `/directory/${business.category.slug}/${business.slug}`

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluteUrl(`${path}#business`),
    name: business.name,
    url: absoluteUrl(path),
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address ?? undefined,
      addressLocality: business.town,
      addressRegion: business.parish,
      addressCountry: 'JM',
    },
  }

  if (business.description) node.description = business.description
  if (business.phone) node.telephone = business.phone
  if (business.email) node.email = business.email
  if (business.website) node.sameAs = [externalHref(business.website)]
  if (business.logo_url) node.logo = business.logo_url

  if (typeof business.lat === 'number' && typeof business.lng === 'number') {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.lat,
      longitude: business.lng,
    }
  }

  const hours = openingHoursSpecification(business.hours)
  if (hours) node.openingHoursSpecification = hours

  const images = business.gallery.map((g) => g.url)
  if (business.logo_url) images.unshift(business.logo_url)
  if (images.length > 0) node.image = images

  node.isPartOf = { '@id': absoluteUrl('/#website') }

  return node
}

export function newsArticleJsonLd(post: NewsPost, opts: { path: string; authorName?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': absoluteUrl(`${opts.path}#article`),
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publish_date ?? undefined,
    dateModified: post.updated_at,
    image: post.hero_image_url ? [post.hero_image_url] : undefined,
    author: opts.authorName
      ? { '@type': 'Person', name: opts.authorName }
      : { '@id': absoluteUrl('/#organization') },
    publisher: { '@id': absoluteUrl('/#organization') },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(opts.path) },
    isAccessibleForFree: true,
  }
}

export function articleJsonLd(input: {
  title: string
  description?: string | null
  path: string
  image?: string | null
  publishedAt?: string | null
  modifiedAt?: string | null
  authorName?: string | null
  section?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': absoluteUrl(`${input.path}#article`),
    headline: input.title,
    description: input.description ?? undefined,
    datePublished: input.publishedAt ?? undefined,
    dateModified: input.modifiedAt ?? input.publishedAt ?? undefined,
    image: input.image ? [input.image] : undefined,
    articleSection: input.section ?? undefined,
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : { '@id': absoluteUrl('/#organization') },
    publisher: { '@id': absoluteUrl('/#organization') },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(input.path) },
  }
}

export function podcastEpisodeJsonLd(episode: Episode, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    '@id': absoluteUrl(`${path}#episode`),
    name: episode.title,
    description: episode.description ?? undefined,
    datePublished: episode.publish_date ?? undefined,
    url: absoluteUrl(path),
    associatedMedia: {
      '@type': 'MediaObject',
      contentUrl: episode.audio_url,
    },
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: `${SITE.name} Podcast`,
      url: absoluteUrl('/podcast'),
    },
  }
}

export function itemListJsonLd(
  items: { name: string; path: string }[],
  listName: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}
