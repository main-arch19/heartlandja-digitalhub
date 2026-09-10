import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import { EXPIRY_WARNING_DAYS } from '@/lib/constants'
import type { BusinessWithRelations } from '@/types/db'

import { seedBusinesses, seedCategories, seedTiers } from './seed'

/**
 * Admin directory queries.
 *
 * Unlike the public readers, these deliberately include listings in every
 * state — pending, enquiry, expired, suspended — because that is the queue an
 * administrator works through.
 */

const BUSINESS_SELECT = `
  *,
  category:business_categories!businesses_category_id_fkey(*),
  tier:listing_tiers!businesses_tier_id_fkey(*)
`

function hydrate(business: (typeof seedBusinesses)[number]): BusinessWithRelations {
  const category =
    seedCategories.find((c) => c.id === business.category_id) ?? seedCategories[0]
  const tier = seedTiers.find((t) => t.id === business.tier_id) ?? seedTiers[0]
  return { ...business, category, tier }
}

export async function getAllBusinessesAdmin(): Promise<BusinessWithRelations[]> {
  if (!hasSupabase()) {
    return seedBusinesses.map(hydrate).sort((a, b) => a.name.localeCompare(b.name))
  }

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('businesses')
    .select(BUSINESS_SELECT)
    .order('created_at', { ascending: false })

  return (data as BusinessWithRelations[]) ?? []
}

/** Enquiries and pending submissions — the approval queue. */
export async function getPendingBusinesses(): Promise<BusinessWithRelations[]> {
  const all = await getAllBusinessesAdmin()
  return all.filter((b) => b.status === 'pending' || b.status === 'enquiry')
}

/**
 * Listings expiring within the warning window, soonest first.
 *
 * This is the renewal pipeline: what Ventley works through each month.
 */
export async function getExpiringBusinesses(
  days = EXPIRY_WARNING_DAYS,
): Promise<BusinessWithRelations[]> {
  const all = await getAllBusinessesAdmin()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)

  return all
    .filter((b) => {
      if (b.status !== 'active' || !b.listing_expiry) return false
      return new Date(b.listing_expiry) <= cutoff
    })
    .sort(
      (a, b) =>
        new Date(a.listing_expiry!).getTime() - new Date(b.listing_expiry!).getTime(),
    )
}

export interface AdminStats {
  total: number
  active: number
  pending: number
  expiring: number
  paidListings: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const [all, expiring] = await Promise.all([
    getAllBusinessesAdmin(),
    getExpiringBusinesses(),
  ])

  return {
    total: all.length,
    active: all.filter((b) => b.status === 'active').length,
    pending: all.filter((b) => b.status === 'pending' || b.status === 'enquiry').length,
    expiring: expiring.length,
    paidListings: all.filter((b) => b.status === 'active' && b.tier.price_jmd > 0).length,
  }
}
