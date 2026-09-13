import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { getTopicsWithCounts } from '@/lib/data/topics'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import type { TopicKind, TopicWithCount } from '@/types/db'

/**
 * The topic index.
 *
 * Every topic is a landing page for a search someone in Clarendon is already
 * typing — "Denbigh show", "May Pen market". This page is what makes them
 * discoverable and crawlable in one hop from the masthead.
 *
 * Topics with no stories yet are still listed. They carry editorial copy and
 * still rank, exactly as the directory keeps a page for every known town at
 * zero listings.
 */

const KIND_HEADINGS: Record<TopicKind, string> = {
  subject: 'Subjects',
  event: 'Events',
  place: 'Places',
  person: 'People',
}

// Fixed order, so the page does not reshuffle as topics are added.
const KIND_ORDER: TopicKind[] = ['subject', 'event', 'place', 'person']

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const topics = await getTopicsWithCounts()
  return buildMetadata({
    title: 'Topics',
    description: `Browse Heartland JA reporting by topic — ${topics.length} subjects, events and places across Clarendon parish.`,
    path: '/topics',
  })
}

export default async function TopicsPage() {
  const topics = await getTopicsWithCounts()

  const crumbs = [{ name: 'Topics', path: '/topics' }]

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    heading: KIND_HEADINGS[kind],
    items: topics.filter((t) => t.topic.kind === kind),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          topics.map((t) => ({ name: t.topic.name, path: `/topics/${t.topic.slug}` })),
          'Topics covered by Heartland JA',
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Clarendon</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Topics
          </h1>
          <p className="standfirst mt-4">
            Everything Heartland JA covers, grouped by subject. Follow a topic to
            keep it in your own feed.
          </p>
        </header>

        {grouped.length === 0 ? (
          <p className="mt-10 text-ink-muted">No topics yet.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {grouped.map((group) => (
              <section key={group.kind}>
                <h2 className="eyebrow">{group.heading}</h2>
                <hr className="rule-gold mt-2 mb-5" />

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((entry) => (
                    <TopicCard key={entry.topic.id} entry={entry} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TopicCard({ entry }: { entry: TopicWithCount }) {
  const { topic, count } = entry

  return (
    <li className="card-lift relative rounded-sm border border-rule bg-paper-raised p-4">
      <h3 className="font-display text-lg font-semibold leading-snug">
        <Link
          href={`/topics/${topic.slug}`}
          className="after:absolute after:inset-0 hover:text-green"
        >
          {topic.name}
        </Link>
      </h3>

      {topic.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          {topic.description}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-ink-faint tnum">
        {count === 0 ? 'No stories yet' : `${count} ${count === 1 ? 'story' : 'stories'}`}
      </p>
    </li>
  )
}
