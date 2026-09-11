import Link from 'next/link'

import { ListingCard } from '@/components/directory/listing-card'
import { CurrencyCard } from '@/components/widgets/currency-card'
import { WeatherCard } from '@/components/widgets/weather-card'
import { getFeaturedBusinesses, getTownsWithCounts } from '@/lib/data/directory'
import { getLatestNews } from '@/lib/data/news'
import { getExchangeRate, getWeather } from '@/lib/data/widgets'
import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

/**
 * Homepage.
 *
 * Latest news, the current issue, and featured listings — the three layers of
 * the publication in the order they matter to a returning reader.
 *
 * No Instagram embed. A third-party feed widget would add several hundred
 * kilobytes of render-blocking script to a page budgeted at 500KB and would
 * send visitors off the site. Social links live in the footer instead.
 */

export default async function HomePage() {
  // Widget fetches join the same Promise.all so the two external calls run in
  // parallel with everything else and add no serial latency. Both resolve to
  // null on failure rather than throwing, so an outage degrades one card
  // instead of breaking the homepage.
  const [news, featured, towns, exchangeRate, weather] = await Promise.all([
    getLatestNews(5),
    getFeaturedBusinesses(3),
    getTownsWithCounts(),
    getExchangeRate(),
    getWeather(),
  ])

  const [lead, ...rest] = news
  const activeTowns = towns.filter((t) => t.count > 0).slice(0, 8)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* --- Masthead statement --- */}
      <section className="measure">
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-[2.75rem]">
          The parish of Clarendon, documented.
        </h1>
        <p className="standfirst mt-4">
          A quarterly magazine, weekly parish news, and a directory of the businesses
          that keep Clarendon working.
        </p>
      </section>

      <hr className="rule-gold my-10" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* --- News --- */}
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="eyebrow">Latest from the parish</h2>
            <Link
              href="/news"
              className="link-target text-xs font-medium text-green underline underline-offset-2 hover:text-green-light"
            >
              All news
            </Link>
          </div>
          <hr className="rule-gold mt-2 mb-6" />

          {news.length === 0 ? (
            <p className="text-ink-muted">No news published yet.</p>
          ) : (
            <>
              {lead ? (
                <article className="pb-7">
                  <p className="eyebrow">{NEWS_CATEGORY_LABELS[lead.category]}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-snug sm:text-3xl">
                    <Link href={`/news/${lead.slug}`} className="hover:text-green">
                      {lead.title}
                    </Link>
                  </h3>
                  {lead.excerpt ? (
                    <p className="mt-3 measure text-[1.0625rem] leading-relaxed text-ink-muted">
                      {lead.excerpt}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-ink-faint">
                    {formatDate(lead.publish_date)}
                    {lead.town ? ` · ${lead.town}` : ''}
                  </p>
                </article>
              ) : null}

              {rest.length > 0 ? (
                <ul className="border-t border-rule">
                  {rest.map((post) => (
                    <li key={post.id} className="border-b border-rule py-4">
                      <p className="eyebrow text-[0.625rem]">
                        {NEWS_CATEGORY_LABELS[post.category]}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                        <Link href={`/news/${post.slug}`} className="hover:text-green">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-xs text-ink-faint">
                        {formatDate(post.publish_date, 'short')}
                        {post.town ? ` · ${post.town}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>

        {/* --- Sidebar --- */}
        <aside className="lg:border-l lg:border-rule lg:pl-8">
          {/* Current issue */}
          <section>
            <h2 className="eyebrow">The magazine</h2>
            <hr className="rule-gold mt-2 mb-4" />
            <div className="rounded-sm border border-rule bg-paper-sunken p-5">
              <p className="text-sm leading-relaxed text-ink-muted">
                The quarterly Heartland JA magazine — long-form writing on business,
                education, culture, tourism and sport across the parish.
              </p>
              <Link
                href="/magazine"
                className="link-target mt-1 text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
              >
                Read the archive
              </Link>
            </div>
          </section>

          {/* Directory */}
          <section className="mt-10">
            <h2 className="eyebrow">In the directory</h2>
            <hr className="rule-gold mt-2 mb-4" />
            <ul className="flex flex-wrap gap-1.5">
              {activeTowns.map((town) => (
                <li key={town.slug}>
                  <Link
                    href={`/directory/town/${town.slug}`}
                    className="chip-target rounded-sm border border-rule bg-paper-raised px-3 text-xs text-ink-muted transition-colors hover:border-green hover:text-green"
                  >
                    {town.town}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/directory"
              className="link-target mt-1 text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
            >
              Browse the full directory
            </Link>
          </section>

          {/* Utility widgets. These are the two things a Clarendon reader looks
              up constantly — answering them here keeps the visit on the site. */}
          <CurrencyCard data={exchangeRate} />
          <WeatherCard data={weather} />
        </aside>
      </div>

      {/* --- Featured listings --- */}
      {featured.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="eyebrow">Featured businesses</h2>
            <Link
              href="/advertise"
              className="link-target text-xs font-medium text-green underline underline-offset-2 hover:text-green-light"
            >
              List your business
            </Link>
          </div>
          <hr className="rule-gold mt-2 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((business) => (
              <ListingCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
