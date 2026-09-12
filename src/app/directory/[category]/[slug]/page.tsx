import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/editorial/rich-text'
import {
  ContactButton,
  DirectionsIcon,
  PhoneIcon,
  WebsiteIcon,
  WhatsAppIcon,
} from '@/components/directory/contact-actions'
import { RelatedListings } from '@/components/directory/listing-card'
import { OpeningHours } from '@/components/directory/opening-hours'
import { ViewTracker } from '@/components/directory/view-tracker'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { ShareRow } from '@/components/social/share-row'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getBusinessBySlug,
  getCategoryAncestry,
  getRelatedListings,
} from '@/lib/data/directory'
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, listingMetaDefaults } from '@/lib/seo/metadata'
import {
  directionsHref,
  displayUrl,
  externalHref,
  telHref,
  townSlug,
  whatsappHref,
} from '@/lib/utils'

/**
 * The individual business listing — the page being sold.
 *
 * Everything a prospective customer needs is server-rendered and works with
 * JavaScript disabled. Every contact action is measured, because what a
 * business owner sees here at renewal time is the whole revenue argument.
 */

interface PageProps {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business || business.status !== 'active') {
    return { title: 'Listing not found' }
  }

  const defaults = listingMetaDefaults({
    name: business.name,
    town: business.town,
    categoryName: business.category.name,
    description: business.description,
  })

  return buildMetadata({
    ...defaults,
    path: `/directory/${category}/${slug}`,
    seo: business,
  })
}

export default async function ListingPage({ params }: PageProps) {
  const { category: categorySlug, slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business || business.status !== 'active') notFound()

  // The canonical URL for a listing is its own category. Reaching it under a
  // different category slug would create duplicate URLs for one page.
  if (business.category.slug !== categorySlug) notFound()

  const [ancestry, related] = await Promise.all([
    getCategoryAncestry(business.category),
    getRelatedListings({
      categoryId: business.category_id,
      town: business.town,
      excludeId: business.id,
      limit: 5,
    }),
  ])

  const path = `/directory/${business.category.slug}/${business.slug}`
  const tier = business.tier

  const crumbs = [
    { name: 'Directory', path: '/directory' },
    ...ancestry.map((c) => ({ name: c.name, path: `/directory/${c.slug}` })),
    { name: business.name, path },
  ]

  const showWhatsApp = tier.show_whatsapp && business.whatsapp
  const showWebsite = tier.show_website_link && business.website

  return (
    <>
      <JsonLd data={localBusinessJsonLd(business)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ViewTracker businessId={business.id} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* --- Main column --- */}
          <div>
            <p className="eyebrow">
              <Link href={`/directory/${business.category.slug}`} className="hover:underline">
                {business.category.name}
              </Link>
            </p>

            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {business.name}
            </h1>

            <p className="mt-2 text-ink-muted">
              {business.address ? `${business.address}, ` : ''}
              <Link
                href={`/directory/town/${townSlug(business.town)}`}
                className="underline decoration-rule-strong underline-offset-2 hover:text-green"
              >
                {business.town}
              </Link>
              , {business.parish}
            </p>

            {business.description ? (
              <p className="standfirst mt-5 measure">{business.description}</p>
            ) : null}

            {/* --- Contact actions. Real links, tracked, JS-optional. --- */}
            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {business.phone ? (
                <ContactButton
                  businessId={business.id}
                  eventType="phone_tap"
                  href={telHref(business.phone)}
                  variant="primary"
                  icon={<PhoneIcon />}
                  label="Call"
                  sublabel={business.phone}
                />
              ) : null}

              {showWhatsApp ? (
                <ContactButton
                  businessId={business.id}
                  eventType="whatsapp"
                  href={whatsappHref(
                    business.whatsapp!,
                    `Hello ${business.name}, I found you on Heartland JA.`,
                  )}
                  external
                  variant="whatsapp"
                  icon={<WhatsAppIcon />}
                  label="WhatsApp"
                  sublabel="Send a message"
                />
              ) : null}

              <ContactButton
                businessId={business.id}
                eventType="directions"
                href={directionsHref({
                  lat: business.lat,
                  lng: business.lng,
                  address: business.address,
                  name: business.name,
                  town: business.town,
                })}
                external
                icon={<DirectionsIcon />}
                label="Directions"
                sublabel={business.town}
              />

              {showWebsite ? (
                <ContactButton
                  businessId={business.id}
                  eventType="website_click"
                  href={externalHref(business.website!)}
                  external
                  icon={<WebsiteIcon />}
                  label="Website"
                  sublabel={displayUrl(business.website!)}
                />
              ) : null}
            </div>

            {business.body ? (
              <div className="mt-9">
                <hr className="rule-gold mb-6" />
                <RichText doc={business.body} />
              </div>
            ) : null}

            <div className="mt-9">
              <ShareRow
                path={path}
                title={`${business.name} — ${business.town}, Clarendon`}
              />
            </div>
          </div>

          {/* --- Sidebar --- */}
          <aside className="lg:border-l lg:border-rule lg:pl-8">
            {business.hours ? <OpeningHours hours={business.hours} /> : null}

            <RelatedListings
              businesses={related}
              heading={`More ${business.category.name.toLowerCase()} nearby`}
              town={business.town}
            />

            <div className="mt-10 rounded-sm border border-rule bg-paper-sunken p-5">
              <h2 className="font-display text-base font-semibold">
                Is this your business?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Claim your listing to add photographs, update your details and see
                how many people are finding you.
              </p>
              <Link
                href="/advertise"
                className="pressable tap-target mt-3 inline-flex items-center text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
              >
                Claim this listing
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
