import type { Metadata } from 'next'
import Link from 'next/link'

import { ListingCard } from '@/components/directory/listing-card'
import { DirectorySearch } from '@/components/directory/directory-search'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getCategoryTreeCounts,
  getFeaturedBusinesses,
  getTopLevelCategories,
  getTownsWithCounts,
  searchBusinesses,
} from '@/lib/data/directory'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

/**
 * Directory home.
 *
 * Search is a server-rendered GET form: results come back as a normal page
 * navigation, so they work without JavaScript and each result set is a real
 * URL that can be shared and crawled.
 */

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Clarendon Business Directory',
    description:
      'Find businesses across Clarendon, Jamaica — plumbers, restaurants, hardware, mechanics, pharmacies and more. Phone numbers, opening hours and directions for May Pen, Chapelton, Frankfield and the wider parish.',
    path: '/directory',
  })
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const [categories, towns, featured, counts, results] = await Promise.all([
    getTopLevelCategories(),
    getTownsWithCounts(),
    getFeaturedBusinesses(6),
    getCategoryTreeCounts(),
    query ? searchBusinesses(query) : Promise.resolve([]),
  ])

  const crumbs = [{ name: 'Directory', path: '/directory' }]

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Clarendon, Jamaica</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            The Clarendon Business Directory
          </h1>
          <p className="standfirst mt-4">
            Every trade, shop and service in the parish, with a phone number that
            works and directions that get you there.
          </p>
        </header>

        <div className="mt-7 max-w-xl">
          <DirectorySearch defaultValue={query} />
        </div>

        {/* --- Search results --- */}
        {query ? (
          <section className="mt-10" aria-live="polite">
            <h2 className="eyebrow">
              {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
            </h2>
            <hr className="rule-gold mt-2 mb-5" />
            {results.length === 0 ? (
              <div className="rounded-sm border border-rule bg-paper-sunken p-6">
                <p className="text-ink-muted">
                  Nothing matched “{query}”. Try a broader term, or browse by category
                  below.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((business) => (
                  <ListingCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* --- Featured --- */}
        {!query && featured.length > 0 ? (
          <section className="mt-12">
            <h2 className="eyebrow">Featured businesses</h2>
            <hr className="rule-gold mt-2 mb-5" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((business) => (
                <ListingCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Categories --- */}
        <section className="mt-12">
          <h2 className="eyebrow">Browse by category</h2>
          <hr className="rule-gold mt-2 mb-5" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/directory/${category.slug}`}
                  className="flex items-baseline justify-between gap-3 rounded-sm border border-rule bg-paper-raised px-4 py-3 transition-colors hover:border-green"
                >
                  <span>
                    <span className="block font-medium">{category.name}</span>
                    {category.description ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
                        {category.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm text-ink-faint tnum">
                    {counts.get(category.id) ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Towns --- */}
        <section id="towns" className="mt-12 scroll-mt-8">
          <h2 className="eyebrow">Browse by town</h2>
          <hr className="rule-gold mt-2 mb-5" />
          <ul className="flex flex-wrap gap-2">
            {towns.map((town) => (
              <li key={town.slug}>
                <Link
                  href={`/directory/town/${town.slug}`}
                  className="pressable tap-target inline-flex items-center rounded-sm border border-rule bg-paper-raised px-3.5 text-sm text-ink-muted transition-colors hover:border-green hover:text-green"
                >
                  {town.town}
                  <span className="ml-2 text-xs text-ink-faint tnum">{town.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Advertise --- */}
        <section className="mt-14 rounded-sm border border-green/25 bg-green-wash p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-green-deep sm:text-2xl">
            List your business
          </h2>
          <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">
            A free entry puts your business in front of people already searching for
            what you do. Paid listings add photographs, WhatsApp, a website link — and
            a monthly report showing exactly how many people called, messaged or asked
            for directions.
          </p>
          <Link
            href="/advertise"
            className="pressable tap-target mt-4 inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
          >
            See listing options
          </Link>
        </section>
      </div>
    </>
  )
}
