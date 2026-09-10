import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { NewsPost, Section } from '@/types/db'

import { seedNewsPosts, seedSections } from './seed'

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
