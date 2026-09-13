import 'server-only'

import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { NewsCategory, NewsPost, Section } from '@/types/db'

import { seedNewsPosts, seedSections } from './seed'

/**
 * Category display order.
 *
 * Derived from the label map rather than written out again, so adding a
 * category in one place adds it everywhere. `/news` derives its filter chips
 * the same way — the declaration order in `constants.ts` is the single source
 * of how these are sequenced.
 */
const CATEGORY_ORDER = Object.keys(NEWS_CATEGORY_LABELS) as NewsCategory[]

/**
 * News and section reads.
 *
 * Phase 2 needs only enough of this to render the homepage and to power
 * related-listings. The full news engine — editor UI, archive, RSS — lands in
 * Phase 3 and extends this module rather than replacing it.
 */

function publishedSeed(): NewsPost[] {
  return seedNewsPosts
    .filter((p) => p.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publish_date ?? 0).getTime() -
        new Date(a.publish_date ?? 0).getTime(),
    )
}

export async function getSections(): Promise<Section[]> {
  if (!hasSupabase()) {
    return [...seedSections].sort((a, b) => a.sort_order - b.sort_order)
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!.from('sections').select('*').order('sort_order')
  return (data as Section[]) ?? []
}

export async function getSectionBySlug(slug: string): Promise<Section | null> {
  if (!hasSupabase()) {
    return seedSections.find((s) => s.slug === slug) ?? null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('sections')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as Section) ?? null
}

export async function getLatestNews(limit = 6): Promise<NewsPost[]> {
  if (!hasSupabase()) return publishedSeed().slice(0, limit)

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .lte('publish_date', new Date().toISOString())
    .order('publish_date', { ascending: false })
    .limit(limit)
  return (data as NewsPost[]) ?? []
}

export async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  if (!hasSupabase()) {
    return publishedSeed().find((p) => p.slug === slug) ?? null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as NewsPost) ?? null
}

/**
 * Every story in every state, for the newsroom.
 *
 * Deliberately unlike the public readers: drafts, scheduled and archived posts
 * all appear, because the point of this list is to show an editor what is
 * waiting on them. RLS still restricts what a contributor can actually load.
 */
export async function getAllNewsAdmin(): Promise<NewsPost[]> {
  if (!hasSupabase()) {
    return [...seedNewsPosts].sort(
      (a, b) =>
        new Date(b.publish_date ?? b.created_at).getTime() -
        new Date(a.publish_date ?? a.created_at).getTime(),
    )
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .order('publish_date', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false })

  return (data as NewsPost[]) ?? []
}

/** A single story by id, in any state — for the editor. */
export async function getNewsById(id: string): Promise<NewsPost | null> {
  if (!hasSupabase()) {
    return seedNewsPosts.find((p) => p.id === id) ?? null
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return (data as NewsPost) ?? null
}

export interface NewsIndexResult {
  posts: NewsPost[]
  total: number
  page: number
  totalPages: number
  /** Post counts per category, for the filter chips. Always the unfiltered counts. */
  categoryCounts: Record<string, number>
  /** Towns appearing in the news, most recent first. */
  towns: string[]
}

/**
 * The /news index: filtered, paginated, with the counts the filter chips need.
 *
 * Category counts are deliberately computed across ALL published posts, not the
 * filtered set — a chip showing "Road Works 0" while you are filtered to road
 * works would be nonsense. They tell you what is available, not what is shown.
 */
export async function getNewsIndex(opts: {
  category?: string | null
  page?: number
  perPage?: number
}): Promise<NewsIndexResult> {
  const perPage = opts.perPage ?? 12
  const page = Math.max(1, opts.page ?? 1)

  const all = hasSupabase() ? await fetchAllPublished() : publishedSeed()

  const categoryCounts: Record<string, number> = {}
  for (const post of all) {
    categoryCounts[post.category] = (categoryCounts[post.category] ?? 0) + 1
  }

  const towns = [...new Set(all.map((p) => p.town).filter((t): t is string => !!t))]

  const filtered = opts.category
    ? all.filter((p) => p.category === opts.category)
    : all

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return {
    posts: filtered.slice(start, start + perPage),
    total,
    page,
    totalPages,
    categoryCounts,
    towns,
  }
}

/**
 * All published posts, newest first.
 *
 * Paginating in memory rather than in SQL is the right trade at this scale — a
 * weekly parish paper accumulates a few hundred posts a year, and the counts
 * for the filter chips need the whole set anyway. If the archive ever grows
 * past a few thousand, move the count to a SQL aggregate and the slice to
 * `.range()`.
 */
async function fetchAllPublished(): Promise<NewsPost[]> {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .lte('publish_date', new Date().toISOString())
    .order('publish_date', { ascending: false })
  return (data as NewsPost[]) ?? []
}

export interface FrontPageNewsGroup {
  category: NewsCategory
  posts: NewsPost[]
}

export interface FrontPageNews {
  /** The newest story. Null only when nothing is published. */
  lead: NewsPost | null
  /** The dense run under the lead — newest first, across all categories. */
  latest: NewsPost[]
  /** What is left, bucketed by category so each beat is visibly covered. */
  groups: FrontPageNewsGroup[]
}

/**
 * The front page's news in one pass.
 *
 * Three tiers, because a parish front page has to do two things at once: lead
 * with what happened most recently, and show that the publication covers road
 * works and school results and the council rather than whatever the week
 * happened to produce. The chronological run answers the first; the grouped
 * sections answer the second.
 *
 * A story appears exactly once. The groups are built from what the lead and the
 * latest run did not already use, so the same headline never shows twice on one
 * screen — which is what makes the grouped tier read as "more of the parish"
 * rather than as a second pass over the same stories.
 *
 * Category order follows the declaration order of `NEWS_CATEGORY_LABELS`, which
 * is already the de-facto display order — `/news` derives its filter chips the
 * same way. Two orderings for the same list would drift.
 */
export async function getFrontPageNews(
  opts: { latestCount?: number; perCategory?: number } = {},
): Promise<FrontPageNews> {
  const latestCount = opts.latestCount ?? 9
  const perCategory = opts.perCategory ?? 3

  const all = hasSupabase() ? await fetchAllPublished() : publishedSeed()

  const lead = all[0] ?? null
  const latest = all.slice(1, 1 + latestCount)

  const shown = new Set<string>()
  if (lead) shown.add(lead.id)
  for (const post of latest) shown.add(post.id)

  const byCategory = new Map<NewsCategory, NewsPost[]>()
  for (const post of all) {
    if (shown.has(post.id)) continue
    const list = byCategory.get(post.category) ?? []
    if (list.length >= perCategory) continue
    list.push(post)
    byCategory.set(post.category, list)
  }

  const groups = CATEGORY_ORDER.flatMap((category) => {
    const posts = byCategory.get(category)
    return posts && posts.length > 0 ? [{ category, posts }] : []
  })

  return { lead, latest, groups }
}

export async function getNewsByTown(town: string, limit = 4): Promise<NewsPost[]> {
  if (!hasSupabase()) {
    return publishedSeed()
      .filter((p) => p.town?.toLowerCase() === town.toLowerCase())
      .slice(0, limit)
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .ilike('town', town)
    .order('publish_date', { ascending: false })
    .limit(limit)
  return (data as NewsPost[]) ?? []
}
