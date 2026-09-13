import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { NewsPost, Topic, TopicWithCount } from '@/types/db'

import { seedNewsPostTopics, seedNewsPosts, seedTopics } from './seed'

/**
 * Topic reads.
 *
 * A topic is what a story is *about* — distinct from its `category` (the kind
 * of story) and its `town` (where it happened). The relationship is many-to-
 * many through `news_post_topics`, so these readers all join rather than
 * filtering a column.
 *
 * Same contract as every other module in this directory: with no Supabase
 * project configured, serve from the development seed; otherwise query
 * Postgres under RLS. Reads never throw — a failed query yields an empty list,
 * because a topic page with no stories is a valid page.
 */

function sortedSeedTopics(): Topic[] {
  return [...seedTopics].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  )
}

/** Published seed posts, newest first. Mirrors the private helper in news.ts. */
function publishedSeedPosts(): NewsPost[] {
  return seedNewsPosts
    .filter((p) => p.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publish_date ?? 0).getTime() -
        new Date(a.publish_date ?? 0).getTime(),
    )
}

/** Seed post ids carrying a given topic id. */
function seedPostIdsForTopic(topicId: string): Set<string> {
  const ids = new Set<string>()
  for (const [postId, topicIds] of Object.entries(seedNewsPostTopics)) {
    if (topicIds.includes(topicId)) ids.add(postId)
  }
  return ids
}

export async function getTopics(): Promise<Topic[]> {
  if (!hasSupabase()) return sortedSeedTopics()

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('topics')
    .select('*')
    .order('sort_order')
    .order('name')
  return (data as Topic[]) ?? []
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  if (!hasSupabase()) {
    return seedTopics.find((t) => t.slug === slug) ?? null
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as Topic) ?? null
}

/**
 * The "In the parish now" bar.
 *
 * Editor-chosen, not measured. Nothing counts news page views, so this must
 * never be labelled "trending" in the UI — it is what an editor has decided
 * the parish should see first.
 */
export async function getFeaturedTopics(limit = 8): Promise<Topic[]> {
  if (!hasSupabase()) {
    return sortedSeedTopics()
      .filter((t) => t.featured)
      .slice(0, limit)
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('topics')
    .select('*')
    .eq('featured', true)
    .order('sort_order')
    .limit(limit)
  return (data as Topic[]) ?? []
}

/**
 * Every topic with its published-story count.
 *
 * Topics with zero stories are kept, exactly as `getTownsWithCounts()` keeps
 * every known town: the page still carries editorial copy and still ranks. A
 * topic that has been created but not yet used is a promise to the reader, not
 * an error.
 */
export async function getTopicsWithCounts(): Promise<TopicWithCount[]> {
  const topics = await getTopics()

  if (!hasSupabase()) {
    const published = new Set(publishedSeedPosts().map((p) => p.id))
    const counts = new Map<string, number>()
    for (const [postId, topicIds] of Object.entries(seedNewsPostTopics)) {
      if (!published.has(postId)) continue
      for (const id of topicIds) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return topics.map((topic) => ({ topic, count: counts.get(topic.id) ?? 0 }))
  }

  const supabase = await getSupabaseServerClient()
  // Join through to news_posts so drafts and scheduled stories are not counted
  // — the number next to a topic must match what a reader actually finds.
  const { data } = await supabase!
    .from('news_post_topics')
    .select('topic_id, news_posts!inner(status, publish_date)')
    .eq('news_posts.status', 'published')
    .lte('news_posts.publish_date', new Date().toISOString())

  const counts = new Map<string, number>()
  for (const row of (data as { topic_id: string }[] | null) ?? []) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1)
  }
  return topics.map((topic) => ({ topic, count: counts.get(topic.id) ?? 0 }))
}

export interface TopicFeedResult {
  posts: NewsPost[]
  total: number
  page: number
  totalPages: number
}

/**
 * Published stories carrying a topic, paginated.
 *
 * In-memory pagination, for the same reason `getNewsIndex()` does it: a weekly
 * parish paper accumulates a few hundred posts a year. If the archive ever
 * grows past a few thousand, move the slice to `.range()` and the count to a
 * SQL aggregate.
 */
export async function getNewsByTopic(
  slug: string,
  opts: { page?: number; perPage?: number } = {},
): Promise<TopicFeedResult> {
  const perPage = opts.perPage ?? 12
  const page = Math.max(1, opts.page ?? 1)

  const all = await fetchTopicPosts(slug)

  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return { posts: all.slice(start, start + perPage), total, page, totalPages }
}

async function fetchTopicPosts(slug: string): Promise<NewsPost[]> {
  if (!hasSupabase()) {
    const topic = seedTopics.find((t) => t.slug === slug)
    if (!topic) return []
    const ids = seedPostIdsForTopic(topic.id)
    return publishedSeedPosts().filter((p) => ids.has(p.id))
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_post_topics')
    .select('news_posts!inner(*), topics!inner(slug)')
    .eq('topics.slug', slug)
    .eq('news_posts.status', 'published')
    .lte('news_posts.publish_date', new Date().toISOString())
    .order('publish_date', { ascending: false, referencedTable: 'news_posts' })

  const rows = (data as { news_posts: NewsPost }[] | null) ?? []
  return rows.map((row) => row.news_posts)
}

/** The topics a single story carries — the eyebrow, and the story page strip. */
export async function getTopicsForPost(postId: string): Promise<Topic[]> {
  if (!hasSupabase()) {
    const ids = seedNewsPostTopics[postId] ?? []
    return sortedSeedTopics().filter((t) => ids.includes(t.id))
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_post_topics')
    .select('topics!inner(*)')
    .eq('news_post_id', postId)

  const rows = (data as { topics: Topic }[] | null) ?? []
  return rows
    .map((row) => row.topics)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

/**
 * The topics carried by many stories at once, keyed by post id.
 *
 * One query for a whole page of rows, where `getTopicsForPost` is one query per
 * row. A front page or topic feed rendering a dozen stories would otherwise
 * issue a dozen round trips to build the same map — cheap at this scale, but
 * needlessly so, and the cost grows with every row added.
 *
 * Posts with no topics are simply absent from the map rather than present with
 * an empty list: `StoryEyebrow` already falls back to the category when handed
 * nothing, so a missing key and an empty value mean the same thing to callers.
 */
export async function getTopicsForPosts(
  postIds: string[],
): Promise<Map<string, Topic[]>> {
  const byPost = new Map<string, Topic[]>()
  if (postIds.length === 0) return byPost

  if (!hasSupabase()) {
    const sorted = sortedSeedTopics()
    for (const postId of postIds) {
      const ids = seedNewsPostTopics[postId] ?? []
      if (ids.length === 0) continue
      byPost.set(
        postId,
        sorted.filter((t) => ids.includes(t.id)),
      )
    }
    return byPost
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_post_topics')
    .select('news_post_id, topics!inner(*)')
    .in('news_post_id', postIds)

  const rows = (data as { news_post_id: string; topics: Topic }[] | null) ?? []
  for (const row of rows) {
    const list = byPost.get(row.news_post_id) ?? []
    list.push(row.topics)
    byPost.set(row.news_post_id, list)
  }

  // Same ordering as the single-post reader, so a row renders identically
  // whichever of the two fetched its topics.
  for (const list of byPost.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  }

  return byPost
}

/**
 * Topics that share stories with this one.
 *
 * Scored on real co-occurrence — how many published stories carry both topics
 * — which is the house pattern from `getRelatedListings()`. Unlike that
 * function there is no editorial thumb on the scale: a topic either shares
 * coverage or it does not.
 */
export async function getRelatedTopics(
  topicId: string,
  limit = 6,
): Promise<Topic[]> {
  const pairs = await fetchTopicPairs()

  const shared = new Map<string, number>()
  for (const topicIds of pairs) {
    if (!topicIds.includes(topicId)) continue
    for (const other of topicIds) {
      if (other === topicId) continue
      shared.set(other, (shared.get(other) ?? 0) + 1)
    }
  }

  if (shared.size === 0) return []

  const topics = await getTopics()
  const byId = new Map(topics.map((t) => [t.id, t]))

  return [...shared.entries()]
    .sort((a, b) => b[1] - a[1] || (byId.get(a[0])?.name ?? '').localeCompare(byId.get(b[0])?.name ?? ''))
    .map(([id]) => byId.get(id))
    .filter((t): t is Topic => Boolean(t))
    .slice(0, limit)
}

/** Topic-id groups, one per published story. The raw material for scoring. */
async function fetchTopicPairs(): Promise<string[][]> {
  if (!hasSupabase()) {
    const published = new Set(publishedSeedPosts().map((p) => p.id))
    return Object.entries(seedNewsPostTopics)
      .filter(([postId]) => published.has(postId))
      .map(([, topicIds]) => topicIds)
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_post_topics')
    .select('news_post_id, topic_id, news_posts!inner(status)')
    .eq('news_posts.status', 'published')

  const grouped = new Map<string, string[]>()
  for (const row of (data as { news_post_id: string; topic_id: string }[] | null) ?? []) {
    const list = grouped.get(row.news_post_id) ?? []
    list.push(row.topic_id)
    grouped.set(row.news_post_id, list)
  }
  return [...grouped.values()]
}
