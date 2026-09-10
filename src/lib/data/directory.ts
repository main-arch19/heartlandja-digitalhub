import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import { CLARENDON_TOWNS } from '@/lib/constants'
import { townSlug } from '@/lib/utils'
import type {
  Business,
  BusinessCategory,
  BusinessWithRelations,
  ListingTier,
  TownCopy,
} from '@/types/db'

import {
  seedBusinesses,
  seedCategories,
  seedTiers,
  seedTownCopy,
} from './seed'

/**
 * Directory data access.
 *
 * Every reader follows the same shape: if Supabase is not configured, serve
 * from the development seed; otherwise query Postgres under RLS. That is the
 * single seam that lets the whole application run and be demonstrated with no
 * backend provisioned.
 *
 * Writers throw rather than silently no-op, so a missing backend is loud.
 */

export class SupabaseNotConfiguredError extends Error {
  constructor(operation: string) {
    super(
      `Cannot ${operation}: Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.`,
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}

const BUSINESS_SELECT = `
  *,
  category:business_categories!businesses_category_id_fkey(*),
  tier:listing_tiers!businesses_tier_id_fkey(*)
`

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

function hydrate(business: Business): BusinessWithRelations {
  const category =
    seedCategories.find((c) => c.id === business.category_id) ?? seedCategories[0]
  const tier = seedTiers.find((t) => t.id === business.tier_id) ?? seedTiers[0]
  return { ...business, category, tier }
}

/** Featured listings first, then alphabetical. Matches the SQL ordering. */
function sortListings(a: BusinessWithRelations, b: BusinessWithRelations) {
  if (a.tier.featured_placement !== b.tier.featured_placement) {
    return a.tier.featured_placement ? -1 : 1
  }
  return a.name.localeCompare(b.name)
}

function activeSeed(): BusinessWithRelations[] {
  return seedBusinesses
    .filter((b) => b.status === 'active')
    .map(hydrate)
    .sort(sortListings)
}

/** All descendant category ids, so a parent page includes its children. */
function categoryTreeIds(categoryId: string, all: BusinessCategory[]): string[] {
  const ids = [categoryId]
  const children = all.filter((c) => c.parent_id === categoryId)
  for (const child of children) ids.push(...categoryTreeIds(child.id, all))
  return ids
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<BusinessCategory[]> {
  if (!hasSupabase()) {
    return [...seedCategories].sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    )
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('business_categories')
    .select('*')
    .order('sort_order')
    .order('name')
  return (data as BusinessCategory[]) ?? []
}

export async function getTopLevelCategories(): Promise<BusinessCategory[]> {
  const all = await getCategories()
  return all.filter((c) => c.parent_id === null)
}

export async function getCategoryBySlug(
  slug: string,
): Promise<BusinessCategory | null> {
  if (!hasSupabase()) {
    return seedCategories.find((c) => c.slug === slug) ?? null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('business_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as BusinessCategory) ?? null
}

export async function getChildCategories(
  parentId: string,
): Promise<BusinessCategory[]> {
  const all = await getCategories()
  return all.filter((c) => c.parent_id === parentId)
}

/** Breadcrumb trail from root to the given category, inclusive. */
export async function getCategoryAncestry(
  category: BusinessCategory,
): Promise<BusinessCategory[]> {
  const all = await getCategories()
  const trail: BusinessCategory[] = [category]
  let current = category
  // Bounded to avoid an infinite loop if data ever contains a cycle.
  for (let depth = 0; depth < 6 && current.parent_id; depth += 1) {
    const parent = all.find((c) => c.id === current.parent_id)
    if (!parent) break
    trail.unshift(parent)
    current = parent
  }
  return trail
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export async function getTiers(): Promise<ListingTier[]> {
  if (!hasSupabase()) {
    return [...seedTiers].sort((a, b) => a.sort_order - b.sort_order)
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!.from('listing_tiers').select('*').order('sort_order')
  return (data as ListingTier[]) ?? []
}

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export async function getBusinessBySlug(
  slug: string,
): Promise<BusinessWithRelations | null> {
  if (!hasSupabase()) {
    const found = seedBusinesses.find((b) => b.slug === slug)
    return found ? hydrate(found) : null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  return (data as BusinessWithRelations) ?? null
}

export async function getBusinessById(
  id: string,
): Promise<BusinessWithRelations | null> {
  if (!hasSupabase()) {
    const found = seedBusinesses.find((b) => b.id === id)
    return found ? hydrate(found) : null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('id', id)
    .maybeSingle()
  return (data as BusinessWithRelations) ?? null
}

export async function getBusinessesByCategory(
  categorySlug: string,
): Promise<BusinessWithRelations[]> {
  if (!hasSupabase()) {
    const category = seedCategories.find((c) => c.slug === categorySlug)
    if (!category) return []
    const ids = categoryTreeIds(category.id, seedCategories)
    return activeSeed().filter((b) => ids.includes(b.category_id))
  }

  const supabase = await getSupabaseServerClient()
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []
  const all = await getCategories()
  const ids = categoryTreeIds(category.id, all)

  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .in('category_id', ids)
    .eq('status', 'active')
    .order('name')

  return ((data as BusinessWithRelations[]) ?? []).sort(sortListings)
}

export async function getBusinessesByTown(
  town: string,
): Promise<BusinessWithRelations[]> {
  if (!hasSupabase()) {
    return activeSeed().filter((b) => townSlug(b.town) === townSlug(town))
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('status', 'active')
    .ilike('town', town)
    .order('name')
  return ((data as BusinessWithRelations[]) ?? []).sort(sortListings)
}

export async function getFeaturedBusinesses(
  limit = 6,
): Promise<BusinessWithRelations[]> {
  if (!hasSupabase()) {
    return activeSeed()
      .filter((b) => b.tier.featured_placement)
      .slice(0, limit)
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('status', 'active')
    .eq('tier.featured_placement', true)
    .limit(limit)
  return (data as BusinessWithRelations[]) ?? []
}

export async function getAllActiveBusinesses(): Promise<BusinessWithRelations[]> {
  if (!hasSupabase()) return activeSeed()
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('status', 'active')
    .order('name')
  return ((data as BusinessWithRelations[]) ?? []).sort(sortListings)
}

export async function searchBusinesses(
  query: string,
): Promise<BusinessWithRelations[]> {
  const term = query.trim()
  if (!term) return []

  if (!hasSupabase()) {
    const needle = term.toLowerCase()
    return activeSeed().filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.description?.toLowerCase().includes(needle) ||
        b.town.toLowerCase().includes(needle) ||
        b.category.name.toLowerCase().includes(needle),
    )
  }

  const supabase = await getSupabaseServerClient()
  // Escape PostgREST's `or` filter delimiters before interpolating user input.
  const safe = term.replace(/[(),]/g, ' ')
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('status', 'active')
    .or(`name.ilike.%${safe}%,description.ilike.%${safe}%,town.ilike.%${safe}%`)
    .limit(50)
  return ((data as BusinessWithRelations[]) ?? []).sort(sortListings)
}

/**
 * Related listings.
 *
 * This is the mechanism that converts editorial traffic into listing value.
 * Phase 2 uses it on listing pages; Phase 3 drops the same function into news
 * posts so a story about May Pen surfaces May Pen businesses.
 */
export async function getRelatedListings(opts: {
  categoryId?: string | null
  categorySlug?: string | null
  town?: string | null
  excludeId?: string | null
  limit?: number
}): Promise<BusinessWithRelations[]> {
  const limit = opts.limit ?? 4

  const pool = hasSupabase()
    ? await getAllActiveBusinesses()
    : activeSeed()

  const scored = pool
    .filter((b) => b.id !== opts.excludeId)
    .map((b) => {
      let score = 0
      if (opts.categoryId && b.category_id === opts.categoryId) score += 3
      if (opts.categorySlug && b.category.slug === opts.categorySlug) score += 3
      if (opts.town && townSlug(b.town) === townSlug(opts.town)) score += 2
      if (b.tier.featured_placement) score += 1
      return { business: b, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.business.name.localeCompare(b.business.name))

  return scored.slice(0, limit).map((entry) => entry.business)
}

// ---------------------------------------------------------------------------
// Towns
// ---------------------------------------------------------------------------

export interface TownSummary {
  town: string
  slug: string
  count: number
}

export async function getTownsWithCounts(): Promise<TownSummary[]> {
  const businesses = await getAllActiveBusinesses()
  const counts = new Map<string, number>()
  for (const b of businesses) {
    counts.set(b.town, (counts.get(b.town) ?? 0) + 1)
  }
  // Every known town gets a page, even at zero listings — the page still ranks
  // and still carries editorial copy.
  const towns = new Set<string>([...CLARENDON_TOWNS, ...counts.keys()])
  return [...towns]
    .map((town) => ({ town, slug: townSlug(town), count: counts.get(town) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.town.localeCompare(b.town))
}

export async function getTownCopy(town: string): Promise<TownCopy | null> {
  if (!hasSupabase()) {
    return seedTownCopy.find((t) => townSlug(t.town) === townSlug(town)) ?? null
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('town_copy')
    .select('*')
    .eq('slug', townSlug(town))
    .maybeSingle()
  return (data as TownCopy) ?? null
}

/** Resolves a URL slug back to the canonical town name. */
export async function resolveTown(slug: string): Promise<string | null> {
  const known = CLARENDON_TOWNS.find((t) => townSlug(t) === slug)
  if (known) return known
  const businesses = await getAllActiveBusinesses()
  return businesses.find((b) => townSlug(b.town) === slug)?.town ?? null
}

export async function getCategoryCounts(): Promise<Map<string, number>> {
  const businesses = await getAllActiveBusinesses()
  const counts = new Map<string, number>()
  for (const b of businesses) {
    counts.set(b.category_id, (counts.get(b.category_id) ?? 0) + 1)
  }
  return counts
}

/**
 * Counts for a category including all its descendants — what a category page
 * actually displays, since a parent page lists its children's businesses too.
 */
export async function getCategoryTreeCounts(): Promise<Map<string, number>> {
  const [all, direct] = await Promise.all([getCategories(), getCategoryCounts()])
  const result = new Map<string, number>()
  for (const category of all) {
    const ids = categoryTreeIds(category.id, all)
    result.set(
      category.id,
      ids.reduce((sum, id) => sum + (direct.get(id) ?? 0), 0),
    )
  }
  return result
}
