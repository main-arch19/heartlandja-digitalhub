import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { StoryLead, StoryRow } from '@/components/news/story-row'
import { JsonLd } from '@/components/seo/json-ld'
import { WeatherCard } from '@/components/widgets/weather-card'
import {
  getBusinessesByTown,
  getTownsWithCounts,
  resolveTown,
} from '@/lib/data/directory'
import { getNewsByTown } from '@/lib/data/news'
import { getWeather } from '@/lib/data/widgets'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { townSlug } from '@/lib/utils'

/**
 * Local news for one town — the other half of the town/editorial pairing.
 *
 * `/directory/town/[town]` answers "who trades here". This answers "what is
 * happening here", and the two cross-link. For a reader in Chapelton that
 * second question is the whole reason to open the site.
 *
 * The weather card is here rather than only on the homepage for the same reason
 * Ground News puts a forecast in its local feed: it is the thing a local reader
 * looks up anyway, and answering it here keeps them on the page.
 *
 * ROUTING: this static `town` segment sits alongside the dynamic `/news/[slug]`
 * route. Next resolves static segments first, so `/news/town/...` reaches this
 * file. Do not publish a story with the slug `town`.
 */

interface PageProps {
  params: Promise<{ town: string }>
}

const LIMIT = 24

export const revalidate = 3600

export async function generateStaticParams() {
  const towns = await getTownsWithCounts()
  return towns.map((t) => ({ town: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { town: slug } = await params
  const town = await resolveTown(slug)
  if (!town) return { title: 'Town not found' }

  const posts = await getNewsByTown(town, LIMIT)

  return buildMetadata({
    title: `${town} news`,
    description:
      posts.length > 0
        ? `The latest news from ${town}, Clarendon — ${posts.length} ${posts.length === 1 ? 'story' : 'stories'} reported by Heartland JA.`
        : `News from ${town}, Clarendon, reported by Heartland JA.`,
    path: `/news/town/${slug}`,
  })
}

export default async function TownNewsPage({ params }: PageProps) {
  const { town: slug } = await params
  const town = await resolveTown(slug)
  if (!town) notFound()

  const [posts, businesses, allTowns, weather] = await Promise.all([
    getNewsByTown(town, LIMIT),
    getBusinessesByTown(town),
    getTownsWithCounts(),
    getWeather(),
  ])

  const crumbs = [
    { name: 'News', path: '/news' },
    { name: town, path: `/news/town/${slug}` },
  ]

  const [lead, ...rest] = posts
  const nearby = allTowns.filter((t) => t.slug !== slug).slice(0, 8)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          posts.map((p) => ({ name: p.title, path: `/news/${p.slug}` })),
          `News from ${town}, Clarendon`,
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Local news</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {town}
          </h1>
          <p className="standfirst mt-4">
            News, notices and results from {town} and the surrounding district.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section>
            <h2 className="eyebrow">
              {posts.length} {posts.length === 1 ? 'story' : 'stories'}
            </h2>
            <hr className="rule-gold mt-2 mb-5" />

            {posts.length === 0 ? (
              <div className="rounded-sm border border-rule bg-paper-sunken p-6">
                <p className="text-ink-muted">
                  No stories from {town} yet. Send us a tip and it could be the
                  first.
                </p>
                <Link
                  href="/news"
                  className="link-target mt-1 text-sm text-green underline underline-offset-2 hover:text-green-light"
                >
                  Read news from across the parish
                </Link>
              </div>
            ) : (
              <>
                {lead ? <StoryLead post={lead} /> : null}
                {rest.length > 0 ? (
                  <div className="border-t border-rule-strong">
                    {rest.map((post) => (
                      <StoryRow key={post.id} post={post} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <div className="mb-10">
              <WeatherCard data={weather} />
            </div>

            <section className="mb-10">
              <h2 className="eyebrow">Businesses in {town}</h2>
              <hr className="rule-gold mt-2 mb-3" />
              <p className="text-sm text-ink-muted">
                {businesses.length > 0 ? (
                  <>
                    {businesses.length}{' '}
                    {businesses.length === 1 ? 'business is' : 'businesses are'}{' '}
                    listed in {town}.
                  </>
                ) : (
                  <>No businesses listed in {town} yet.</>
                )}
              </p>
              <Link
                href={`/directory/town/${slug}`}
                className="link-target mt-1 inline-flex text-sm text-green underline underline-offset-2 hover:text-green-light"
              >
                {businesses.length > 0
                  ? `See the ${town} directory`
                  : 'List a business here'}
              </Link>
            </section>

            {nearby.length > 0 ? (
              <section>
                <h2 className="eyebrow">Other towns</h2>
                <hr className="rule-gold mt-2 mb-3" />
                <ul className="flex flex-wrap gap-1.5">
                  {nearby.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/news/town/${townSlug(t.town)}`}
                        className="chip-target pressable rounded-sm border border-rule bg-paper-raised px-3 text-xs text-ink-muted transition-colors hover:border-green hover:text-green"
                      >
                        {t.town}
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
