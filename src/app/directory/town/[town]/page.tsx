import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/editorial/rich-text'
import { ListingCard } from '@/components/directory/listing-card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getBusinessesByTown,
  getTownCopy,
  getTownsWithCounts,
  resolveTown,
} from '@/lib/data/directory'
import { getNewsByTown } from '@/lib/data/news'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, townMetaDefaults } from '@/lib/seo/metadata'
import { formatDate } from '@/lib/utils'

/**
 * Town page — the second programmatic SEO target.
 *
 * NOTE ON ROUTING: this static `town` segment sits alongside the dynamic
 * `/directory/[category]` route. Next.js resolves static segments first, so
 * `/directory/town/...` reaches this file rather than being read as a category
 * named "town". Do not create a business category with the slug `town`.
 *
 * Also carries recent news from the same town — the first half of the
 * editorial-to-directory link that Phase 3 completes in the other direction.
 */

interface PageProps {
  params: Promise<{ town: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const towns = await getTownsWithCounts()
  return towns.map((t) => ({ town: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { town: slug } = await params
  const town = await resolveTown(slug)
  if (!town) return { title: 'Town not found' }

  const [businesses, copy] = await Promise.all([
    getBusinessesByTown(town),
    getTownCopy(town),
  ])

  const defaults = townMetaDefaults(town, businesses.length)

  return buildMetadata({
    ...defaults,
    path: `/directory/town/${slug}`,
    seo: copy,
  })
}

export default async function TownPage({ params }: PageProps) {
  const { town: slug } = await params
  const town = await resolveTown(slug)
  if (!town) notFound()

  const [businesses, copy, news, allTowns] = await Promise.all([
    getBusinessesByTown(town),
    getTownCopy(town),
    getNewsByTown(town, 3),
    getTownsWithCounts(),
  ])

  const crumbs = [
    { name: 'Directory', path: '/directory' },
    { name: 'Towns', path: '/directory#towns' },
    { name: town, path: `/directory/town/${slug}` },
  ]

  // Categories present in this town — a real cross-link, not filler.
  const categories = [...new Map(businesses.map((b) => [b.category.slug, b.category])).values()]
    .sort((a, b) => a.name.localeCompare(b.name))

  const nearby = allTowns.filter((t) => t.slug !== slug && t.count > 0).slice(0, 6)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          businesses.map((b) => ({
            name: b.name,
            path: `/directory/${b.category.slug}/${b.slug}`,
          })),
          `Businesses in ${town}, Clarendon`,
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Clarendon</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Businesses in {town}
          </h1>

          {copy?.intro ? (
            <div className="mt-4">
              <RichText doc={copy.intro} />
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-[1.0625rem] leading-relaxed text-ink-muted">
              <p>
                {businesses.length > 0 ? (
                  <>
                    {businesses.length}{' '}
                    {businesses.length === 1 ? 'business is' : 'businesses are'} listed
                    in {town}, Clarendon
                    {categories.length > 0 ? (
                      <>
                        , covering{' '}
                        {categories.slice(0, 4).map((c, i, arr) => (
                          <span key={c.slug}>
                            <Link
                              href={`/directory/${c.slug}`}
                              className="text-green underline underline-offset-2 hover:text-green-light"
                            >
                              {c.name.toLowerCase()}
                            </Link>
                            {i < arr.length - 1 ? (i === arr.length - 2 ? ' and ' : ', ') : ''}
                          </span>
                        ))}
                      </>
                    ) : null}
                    . Every listing carries a phone number and directions.
                  </>
                ) : (
                  <>
                    {town} is a district of Clarendon parish. No businesses are listed
                    here yet — if you trade in {town}, a free entry puts you in front of
                    people already searching for what you do.
                  </>
                )}
              </p>
            </div>
          )}
        </header>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section>
            <h2 className="eyebrow">
              {businesses.length} {businesses.length === 1 ? 'listing' : 'listings'}
            </h2>
            <hr className="rule-gold mt-2 mb-5" />

            {businesses.length === 0 ? (
              <div className="rounded-sm border border-rule bg-paper-sunken p-6">
                <p className="text-ink-muted">Nothing listed in {town} yet.</p>
                <Link
                  href="/advertise"
                  className="link-target mt-1 text-sm text-green underline underline-offset-2 hover:text-green-light"
                >
                  Be the first business listed here
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((business) => (
                  <ListingCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            {/* News from this town. Phase 3 completes the loop by surfacing
                listings on news posts. */}
            {news.length > 0 ? (
              <section className="mb-10">
                <h2 className="eyebrow">News from {town}</h2>
                <hr className="rule-gold mt-2 mb-1" />
                <ul>
                  {news.map((post) => (
                    <li key={post.id} className="border-b border-rule py-3 last:border-0">
                      <Link
                        href={`/news/${post.slug}`}
                        className="text-[0.9375rem] font-medium leading-snug hover:text-green"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {formatDate(post.publish_date, 'short')}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {nearby.length > 0 ? (
              <section>
                <h2 className="eyebrow">Other towns</h2>
                <hr className="rule-gold mt-2 mb-3" />
                <ul className="flex flex-wrap gap-2">
                  {nearby.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/directory/town/${t.slug}`}
                        className="tap-target inline-flex items-center rounded-sm border border-rule bg-paper-raised px-3 text-sm text-ink-muted transition-colors hover:border-green hover:text-green"
                      >
                        {t.town}
                        <span className="ml-1.5 text-xs text-ink-faint tnum">{t.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}
