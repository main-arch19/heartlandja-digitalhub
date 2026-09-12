import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/editorial/rich-text'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { TopicChips } from '@/components/news/eyebrow'
import { StoryLead, StoryRow, TownList } from '@/components/news/story-row'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getNewsByTopic,
  getRelatedTopics,
  getTopicBySlug,
  getTopics,
  getTopicsForPost,
} from '@/lib/data/topics'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, topicMetaDefaults } from '@/lib/seo/metadata'

/**
 * A topic page — the programmatic SEO surface for editorial, mirroring what
 * town and category pages do for the directory.
 *
 * Structure follows /directory/town/[town]: editorial intro, the feed, real
 * cross-links in the sidebar. The feed reuses StoryLead + StoryRow so a topic
 * page reads exactly like the news index, because it is the same list filtered.
 */

interface PageProps {
  params: Promise<{ topic: string }>
  searchParams: Promise<{ page?: string }>
}

const PER_PAGE = 12

export const revalidate = 3600

export async function generateStaticParams() {
  const topics = await getTopics()
  return topics.map((t) => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = await getTopicBySlug(slug)
  if (!topic) return { title: 'Topic not found' }

  const { total } = await getNewsByTopic(slug, { perPage: PER_PAGE })
  const defaults = topicMetaDefaults(topic.name, total, topic.description)

  return buildMetadata({
    ...defaults,
    path: `/topics/${slug}`,
    seo: topic,
  })
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const { topic: slug } = await params
  const { page: pageParam } = await searchParams

  const topic = await getTopicBySlug(slug)
  if (!topic) notFound()

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)

  const [feed, related] = await Promise.all([
    getNewsByTopic(slug, { page, perPage: PER_PAGE }),
    getRelatedTopics(topic.id),
  ])

  // A page number past the end is a 404, not an empty list. Serving 200 with no
  // stories is a soft-404: crawlers index a thin page, and on a site whose
  // business model is search that is a real cost. Page 1 is exempt — a topic
  // with no stories yet is a legitimate page that still carries its intro copy.
  if (page > 1 && feed.posts.length === 0) notFound()

  // Topics for each row's eyebrow. One lookup per story on the page — at 12
  // rows that is cheap, and on seed data it costs nothing at all.
  const topicsByPost = new Map(
    await Promise.all(
      feed.posts.map(
        async (post) => [post.id, await getTopicsForPost(post.id)] as const,
      ),
    ),
  )

  const crumbs = [
    { name: 'Topics', path: '/topics' },
    { name: topic.name, path: `/topics/${slug}` },
  ]

  // Only the first page leads with a hero story. On page two the list is a
  // continuation, and promoting an arbitrary story there would misrepresent it.
  const [lead, ...rest] = page === 1 ? feed.posts : []
  const rows = page === 1 ? rest : feed.posts

  const towns = [
    ...new Set(feed.posts.map((p) => p.town).filter((t): t is string => Boolean(t))),
  ]

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          feed.posts.map((p) => ({ name: p.title, path: `/news/${p.slug}` })),
          `${topic.name} — Clarendon news`,
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">Topic</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {topic.name}
          </h1>

          {topic.intro ? (
            <div className="mt-4">
              <RichText doc={topic.intro} />
            </div>
          ) : topic.description ? (
            <p className="standfirst mt-4">{topic.description}</p>
          ) : null}
        </header>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section>
            <h2 className="eyebrow">
              {feed.total} {feed.total === 1 ? 'story' : 'stories'}
            </h2>
            <hr className="rule-gold mt-2 mb-5" />

            {feed.posts.length === 0 ? (
              <div className="rounded-sm border border-rule bg-paper-sunken p-6">
                <p className="text-ink-muted">
                  Nothing filed under {topic.name} yet. It will appear here as soon
                  as it is.
                </p>
                <Link
                  href="/news"
                  className="link-target mt-1 text-sm text-green underline underline-offset-2 hover:text-green-light"
                >
                  Read the latest parish news
                </Link>
              </div>
            ) : (
              <>
                {lead ? (
                  <StoryLead
                    post={lead}
                    topics={topicsByPost.get(lead.id) ?? []}
                    excludeTopicId={topic.id}
                  />
                ) : null}
                {rows.length > 0 ? (
                  <div className={lead ? 'border-t border-rule-strong' : undefined}>
                    {rows.map((post) => (
                      <StoryRow
                        key={post.id}
                        post={post}
                        topics={topicsByPost.get(post.id) ?? []}
                        excludeTopicId={topic.id}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}

            {feed.totalPages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-8 flex items-center justify-between border-t border-rule pt-5"
              >
                {page > 1 ? (
                  <Link
                    href={page === 2 ? `/topics/${slug}` : `/topics/${slug}?page=${page - 1}`}
                    className="link-target text-sm text-green underline underline-offset-2 hover:text-green-light"
                  >
                    ← Newer
                  </Link>
                ) : (
                  <span />
                )}

                <span className="text-xs text-ink-faint tnum">
                  Page {page} of {feed.totalPages}
                </span>

                {page < feed.totalPages ? (
                  <Link
                    href={`/topics/${slug}?page=${page + 1}`}
                    className="link-target text-sm text-green underline underline-offset-2 hover:text-green-light"
                  >
                    Older →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            {related.length > 0 ? (
              <div className="mb-10">
                <TopicChips topics={related} label="Related topics" />
              </div>
            ) : null}

            {towns.length > 0 ? (
              <section>
                <h2 className="eyebrow">Towns in this coverage</h2>
                <hr className="rule-gold mt-2 mb-3" />
                <TownList towns={towns} />
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}
