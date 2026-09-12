import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { StoryLead, StoryRow, TownList } from '@/components/news/story-row'
import { JsonLd } from '@/components/seo/json-ld'
import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { getNewsIndex } from '@/lib/data/news'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

/**
 * The parish news index.
 *
 * Layout follows Ground News' density model — one lead story, then compact
 * imageless rows so a dozen headlines fit on a screen. Filtering and pagination
 * are plain links with search params, so the whole page is server-rendered,
 * works without JavaScript, and every filtered view is a real shareable URL a
 * crawler can reach.
 *
 * Phase 3 owns the rest of the news engine: the editor UI, RSS, and the
 * permanent /news/[year]/[month]/[slug] URLs.
 */

const CATEGORY_KEYS = Object.keys(NEWS_CATEGORY_LABELS) as (keyof typeof NEWS_CATEGORY_LABELS)[]

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

function isCategory(value: string | undefined): value is keyof typeof NEWS_CATEGORY_LABELS {
  return !!value && CATEGORY_KEYS.includes(value as keyof typeof NEWS_CATEGORY_LABELS)
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category } = await searchParams
  const active = isCategory(category) ? category : null

  const title = active
    ? `${NEWS_CATEGORY_LABELS[active]} — Clarendon Parish News`
    : 'Parish News from Clarendon, Jamaica'

  const description = active
    ? `${NEWS_CATEGORY_LABELS[active]} from across Clarendon — reported weekly by Heartland JA.`
    : 'Council decisions, school results, sports, road works, business openings, community events and obituaries from across the parish of Clarendon, Jamaica.'

  return buildMetadata({
    title,
    description,
    // Filtered views canonicalise to the unfiltered index: they are the same
    // stories in a different slice, and separate canonicals would split the
    // page's authority across seven near-duplicate URLs.
    path: '/news',
  })
}

export default async function NewsIndexPage({ searchParams }: PageProps) {
  const { category, page: pageParam } = await searchParams

  const activeCategory = isCategory(category) ? category : null
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)

  const { posts, total, totalPages, categoryCounts, towns } = await getNewsIndex({
    category: activeCategory,
    page,
  })

  // Only the first page of the unfiltered index leads with a hero story — on
  // page 3 of a filter, a "lead" is just the next item in a sequence.
  const showLead = page === 1 && !activeCategory && posts.length > 0
  const lead = showLead ? posts[0] : null
  const rest = showLead ? posts.slice(1) : posts

  const crumbs = [{ name: 'News', path: '/news' }]

  const href = (opts: { category?: string | null; page?: number }) => {
    const params = new URLSearchParams()
    const cat = opts.category !== undefined ? opts.category : activeCategory
    if (cat) params.set('category', cat)
    if (opts.page && opts.page > 1) params.set('page', String(opts.page))
    const qs = params.toString()
    return qs ? `/news?${qs}` : '/news'
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          posts.map((p) => ({ name: p.title, path: `/news/${p.slug}` })),
          'Clarendon Parish News',
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Every week</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Parish News
          </h1>
          <p className="standfirst mt-3">
            Council decisions, school results, sport, road works and community
            events from across Clarendon.
          </p>
        </header>

        {/* Category filter — plain links, so this works with no JavaScript and
            every filtered view is a crawlable, shareable URL. */}
        <nav aria-label="Filter by category" className="mt-7">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={href({ category: null, page: 1 })}
                aria-current={!activeCategory ? 'page' : undefined}
                className={
                  !activeCategory
                    ? 'chip-target pressable rounded-sm border border-green bg-green px-3.5 text-xs font-medium text-paper'
                    : 'chip-target pressable rounded-sm border border-rule bg-paper-raised px-3.5 text-xs text-ink-muted transition-colors hover:border-green hover:text-green'
                }
              >
                All
              </Link>
            </li>
            {CATEGORY_KEYS.filter((key) => (categoryCounts[key] ?? 0) > 0).map((key) => {
              const active = activeCategory === key
              return (
                <li key={key}>
                  <Link
                    href={href({ category: key, page: 1 })}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'chip-target pressable rounded-sm border border-green bg-green px-3.5 text-xs font-medium text-paper'
                        : 'chip-target pressable rounded-sm border border-rule bg-paper-raised px-3.5 text-xs text-ink-muted transition-colors hover:border-green hover:text-green'
                    }
                  >
                    {NEWS_CATEGORY_LABELS[key]}
                    <span
                      className={
                        active
                          ? 'ml-1.5 text-[0.6875rem] opacity-80 tnum'
                          : 'ml-1.5 text-[0.6875rem] text-ink-faint tnum'
                      }
                    >
                      {categoryCounts[key] ?? 0}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <h2 className="eyebrow">
              {activeCategory ? NEWS_CATEGORY_LABELS[activeCategory] : 'Latest'}
              <span aria-hidden="true"> · </span>
              <span className="tnum">{total}</span>{' '}
              {total === 1 ? 'story' : 'stories'}
            </h2>
            <hr className="rule-gold mt-2 mb-5" />

            {posts.length === 0 ? (
              <div className="rounded-sm border border-rule bg-paper-sunken p-6">
                <p className="text-ink-muted">
                  No stories in this category yet.
                </p>
                <Link
                  href="/news"
                  className="link-target mt-1 text-sm text-green underline underline-offset-2 hover:text-green-light"
                >
                  See all parish news
                </Link>
              </div>
            ) : (
              <>
                {lead ? <StoryLead post={lead} /> : null}
                {lead ? <hr className="rule-gold mb-1" /> : null}
                <div>
                  {rest.map((post) => (
                    <StoryRow key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}

            {/* Pagination — server-rendered links, no client state. */}
            {totalPages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-8 flex items-center justify-between gap-4 border-t border-rule pt-5"
              >
                {page > 1 ? (
                  <Link
                    href={href({ page: page - 1 })}
                    className="link-target text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
                  >
                    ← Newer
                  </Link>
                ) : (
                  <span />
                )}

                <span className="text-xs text-ink-faint tnum">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={href({ page: page + 1 })}
                    className="link-target text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
                  >
                    Older →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="lg:border-l lg:border-rule lg:pl-8">
            {towns.length > 0 ? (
              <section>
                <h2 className="eyebrow">Towns in the news</h2>
                <hr className="rule-gold mt-2 mb-4" />
                <TownList towns={towns} />
              </section>
            ) : null}

            <section className="mt-10">
              <h2 className="eyebrow">The directory</h2>
              <hr className="rule-gold mt-2 mb-4" />
              <div className="rounded-sm border border-rule bg-paper-sunken p-5">
                <p className="text-sm leading-relaxed text-ink-muted">
                  Every trade, shop and service in Clarendon — with a phone
                  number that works and directions that get you there.
                </p>
                <Link
                  href="/directory"
                  className="link-target mt-1 text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
                >
                  Browse the directory
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}
