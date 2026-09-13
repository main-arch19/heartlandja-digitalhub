import Link from 'next/link'

import { ListingCard } from '@/components/directory/listing-card'
import { TopicChips } from '@/components/news/eyebrow'
import { StoryLead, StoryRow } from '@/components/news/story-row'
import { CurrencyCard } from '@/components/widgets/currency-card'
import { WeatherCard } from '@/components/widgets/weather-card'
import { getFeaturedBusinesses, getTownsWithCounts } from '@/lib/data/directory'
import { getFrontPageNews } from '@/lib/data/news'
import { getFeaturedTopics, getTopicsForPosts } from '@/lib/data/topics'
import { getExchangeRate, getWeather } from '@/lib/data/widgets'
import { NEWS_CATEGORY_LABELS } from '@/lib/constants'

/**
 * Homepage.
 *
 * The news runs in three tiers, because a parish front page has to do two
 * things at once: lead with what happened most recently, and show that this
 * publication covers the council and the roads and the school results rather
 * than whatever the week happened to produce. A lead story, then a dense
 * chronological run, then the remaining stories grouped under their category —
 * the first two answer "what is new", the third answers "what do you cover".
 *
 * The rows are the same `StoryLead` / `StoryRow` components as /news and the
 * topic feeds. This page used to hand-roll its own, and the copy had drifted:
 * category eyebrows where every other surface showed topics, no reading time,
 * and only the headline as a tap target instead of the whole row.
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
  const [news, topics, featured, towns, exchangeRate, weather] = await Promise.all([
    getFrontPageNews(),
    getFeaturedTopics(5),
    getFeaturedBusinesses(3),
    getTownsWithCounts(),
    getExchangeRate(),
    getWeather(),
  ])

  const { lead, latest, groups } = news

  // Every story the page will render, in one topic lookup rather than one per
  // row. The eyebrows need this and there are a dozen-odd rows below.
  const topicsByPost = await getTopicsForPosts([
    ...(lead ? [lead.id] : []),
    ...latest.map((p) => p.id),
    ...groups.flatMap((g) => g.posts.map((p) => p.id)),
  ])

  const hasNews = Boolean(lead)
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

      {/* Topics an editor has chosen to put in front of the parish. Deliberately
          not labelled "trending" — nothing here counts news views, so a word
          implying measurement would be claiming a figure that does not exist. */}
      {topics.length > 0 ? (
        <div className="mb-10">
          <TopicChips topics={topics} label="In the parish now" />
        </div>
      ) : null}

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

          {!hasNews ? (
            <p className="text-ink-muted">No news published yet.</p>
          ) : (
            <>
              {lead ? (
                <StoryLead post={lead} topics={topicsByPost.get(lead.id) ?? []} />
              ) : null}

              {latest.length > 0 ? (
                <div className="border-t border-rule-strong">
                  {latest.map((post) => (
                    <StoryRow
                      key={post.id}
                      post={post}
                      topics={topicsByPost.get(post.id) ?? []}
                    />
                  ))}
                </div>
              ) : null}

              {/* The rest of the parish, by beat. Each heading links to the
                  filtered index, which is a real crawlable URL /news already
                  serves — no new route needed. */}
              {groups.map((group) => (
                <section key={group.category} className="mt-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="eyebrow">
                      {NEWS_CATEGORY_LABELS[group.category]}
                    </h3>
                    <Link
                      href={`/news?category=${group.category}`}
                      className="link-target text-xs font-medium text-green underline underline-offset-2 hover:text-green-light"
                    >
                      More
                    </Link>
                  </div>
                  <hr className="rule-gold mt-2 mb-2" />

                  <div>
                    {group.posts.map((post) => (
                      <StoryRow
                        key={post.id}
                        post={post}
                        topics={topicsByPost.get(post.id) ?? []}
                      />
                    ))}
                  </div>
                </section>
              ))}
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
